import { readFile } from "node:fs/promises";

const args = process.argv.slice(2);
const modeIndex = args.findIndex((arg) => arg.startsWith("--mode="));
const mode = modeIndex >= 0 ? args[modeIndex].slice("--mode=".length) : "staging";
if (!["staging", "production"].includes(mode)) throw new Error(`Unsupported acceptance mode: ${mode}`);

const baseArg = args.find((arg, index) => index !== modeIndex && !arg.startsWith("--"));
const defaultBase = mode === "production"
  ? "https://cinkr.com/"
  : "https://cinkr-edge-router-staging.atcspindle.workers.dev/";
const base = new URL(baseArg ?? defaultBase);
if (!base.pathname.endsWith("/")) base.pathname += "/";

const redirectManifest = JSON.parse(await readFile(new URL("../manifests/legacy-redirects.json", import.meta.url), "utf8"));
const products = ["kinco", "hqd", "richauto", "mpg"];
const legacyHosts = {
  "hmi.cinkr.com": "kinco",
  "hqd.cinkr.com": "hqd",
  "richauto.cinkr.com": "richauto",
  "mpg.cinkr.com": "mpg"
};
const securityHeaders = [
  "content-security-policy",
  "strict-transport-security",
  "x-content-type-options",
  "x-frame-options",
  "referrer-policy",
  "permissions-policy"
];
const failures = [];
const checked = { pages: 0, assets: 0, redirects: 0, notFound: 0, securityHeaders: 0 };
const accessHeaders = process.env.CF_ACCESS_CLIENT_ID && process.env.CF_ACCESS_CLIENT_SECRET
  ? { "CF-Access-Client-Id": process.env.CF_ACCESS_CLIENT_ID, "CF-Access-Client-Secret": process.env.CF_ACCESS_CLIENT_SECRET }
  : process.env.CLOUDFLARE_ACCESS_COOKIE
    ? { Cookie: process.env.CLOUDFLARE_ACCESS_COOKIE }
    : {};

const publicUrl = (path) => new URL(path, base).href;
const canonicalFor = (product) => `https://cinkr.com/${product}/`;
const decode = (value) => value.replaceAll("&amp;", "&");

async function get(path, options = {}) {
  const response = await fetch(publicUrl(path), {
    redirect: "manual",
    ...options,
    headers: { ...accessHeaders, ...options.headers }
  });
  const text = response.status < 300 || response.status >= 400 ? await response.text() : "";
  return { response, text };
}

async function getAbsolute(url, options = {}) {
  const response = await fetch(url, { redirect: "manual", ...options, headers: { ...accessHeaders, ...options.headers } });
  const text = response.status < 300 || response.status >= 400 ? await response.text() : "";
  return { response, text };
}

function expect(condition, message) {
  if (!condition) failures.push(message);
}

function checkRobotsHeader(response, path) {
  const value = response.headers.get("x-robots-tag") ?? "";
  if (mode === "staging") {
    expect(value.toLowerCase().includes("noindex"), `${path}: missing X-Robots-Tag noindex`);
    expect(response.headers.get("cache-control") === "no-store", `${path}: missing Cache-Control no-store`);
  } else {
    expect(!value.toLowerCase().includes("noindex"), `${path}: production response contains noindex`);
  }
}

function checkSecurityHeaders(response, path) {
  for (const header of securityHeaders) {
    expect(Boolean(response.headers.get(header)), `${path}: missing ${header}`);
  }
  checked.securityHeaders += 1;
}

for (const product of products) {
  const path = `/${product}/`;
  const { response, text } = await get(path);
  checked.pages += 1;
  expect(response.status === 200, `${path}: expected 200, received ${response.status}`);
  checkRobotsHeader(response, path);
  checkSecurityHeaders(response, path);
  expect((text.match(/<link rel="canonical"/g) ?? []).length === 1, `${path}: expected one canonical`);
  expect(text.includes(`href="${canonicalFor(product)}"`), `${path}: canonical does not point to ${canonicalFor(product)}`);

  const robots = await get(`/${product}/robots.txt`);
  checked.redirects += 1;
  expect(robots.response.status === 301, `/${product}/robots.txt: expected 301, received ${robots.response.status}`);
  expect(robots.response.headers.get("location") === publicUrl("/robots.txt"), `/${product}/robots.txt: wrong redirect target`);

  const missing = await get(`/${product}/acceptance-path-that-does-not-exist/`);
  checked.notFound += 1;
  expect(missing.response.status === 404, `/${product}/unknown: expected 404, received ${missing.response.status}`);
}

const hmi = await get("/hmi/gl070/?source=legacy");
checked.redirects += 1;
expect(hmi.response.status === 301, "/hmi/gl070/: expected 301");
expect(hmi.response.headers.get("location") === publicUrl("/kinco/gl070/?source=legacy"), "/hmi/gl070/: wrong redirect target");

const hmiRoot = await get("/hmi?source=legacy");
checked.redirects += 1;
expect(hmiRoot.response.status === 301, "/hmi: expected 301");
expect(hmiRoot.response.headers.get("location") === publicUrl("/kinco/?source=legacy"), "/hmi: wrong redirect target");

const mainMissing = await get("/acceptance-path-that-does-not-exist/");
checked.notFound += 1;
expect(mainMissing.response.status === 404, "/unknown: expected 404, received " + mainMissing.response.status);

if (mode === "production") {
  for (const [host, product] of Object.entries(legacyHosts)) {
    const hostRedirects = redirectManifest.filter((entry) => entry.host === host);
    const rootRedirect = hostRedirects.find((entry) => entry.path === "/");
    const deepRedirect = hostRedirects.find((entry) => entry.path !== "/" && entry.target.startsWith(`https://cinkr.com/${product}/`));
    for (const entry of [rootRedirect, deepRedirect].filter(Boolean)) {
      const requestUrl = new URL(`https://${host}${entry.path}?acceptance=legacy`);
      const { response } = await getAbsolute(requestUrl);
      const expected = new URL(entry.target);
      expected.search = "?acceptance=legacy";
      checked.redirects += 1;
      expect(response.status === 301, `${host}${entry.path}: expected 301, received ${response.status}`);
      expect(response.headers.get("location") === expected.href, `${host}${entry.path}: wrong redirect target`);
    }

    const unknown = await getAbsolute(`https://${host}/acceptance-path-that-does-not-exist/`);
    checked.notFound += 1;
    expect(unknown.response.status === 404, `${host}/unknown: expected 404, received ${unknown.response.status}`);
  }
}

const assetPaths = new Set();
for (const product of products) {
  const index = await get(`/${product}/sitemap-index.xml`);
  expect(index.response.status === 200, `/${product}/sitemap-index.xml: expected 200, received ${index.response.status}`);
  const sitemaps = [...index.text.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => decode(match[1]));
  expect(sitemaps.length > 0, `/${product}/sitemap-index.xml: no child sitemap`);
  for (const sitemap of sitemaps) {
    const sitemapPath = new URL(sitemap).pathname;
    const child = await get(sitemapPath);
    expect(child.response.status === 200, `${sitemapPath}: expected 200, received ${child.response.status}`);
    for (const match of child.text.matchAll(/<loc>([^<]+)<\/loc>/g)) {
      const pageUrl = new URL(decode(match[1]));
      const page = await get(pageUrl.pathname);
      checked.pages += 1;
      expect(page.response.status === 200, `${pageUrl.pathname}: expected 200, received ${page.response.status}`);
      checkRobotsHeader(page.response, pageUrl.pathname);
      expect(page.text.includes(`href="${pageUrl.href}"`), `${pageUrl.pathname}: canonical missing`);
      for (const resource of page.text.matchAll(/(?<![\w-])(?:href|src)="(\/[^"#?]+(?:\?[^"#]*)?)"/g)) {
        const value = decode(resource[1]);
        if (!/\.(?:css|js|mjs|png|jpe?g|webp|avif|svg|ico|pdf|woff2?)(?:\?.*)?$/i.test(value)) continue;
        assetPaths.add(value);
      }
    }
  }
}

const assets = [...assetPaths];
for (let offset = 0; offset < assets.length; offset += 16) {
  await Promise.all(assets.slice(offset, offset + 16).map(async (path) => {
    const response = await fetch(publicUrl(path), { redirect: "manual", headers: accessHeaders });
    checked.assets += 1;
    expect(response.status === 200, `${path}: asset expected 200, received ${response.status}`);
  }));
}

if (failures.length) {
  console.error(JSON.stringify({
    mode,
    base: base.href,
    checked,
    failures: failures.slice(0, 100),
    failureCount: failures.length
  }, null, 2));
  process.exit(1);
} else {
  console.log(JSON.stringify({ mode, base: base.href, checked }, null, 2));
  process.exit(0);
}
