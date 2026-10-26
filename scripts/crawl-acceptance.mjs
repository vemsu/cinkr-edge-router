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

const home = await get("/");
checked.pages += 1;
expect(home.response.status === 200, `/: expected 200, received ${home.response.status}`);
checkRobotsHeader(home.response, "/");
checkSecurityHeaders(home.response, "/");
expect((home.text.match(/<link rel="canonical"/g) ?? []).length === 1, "/: expected one canonical");
expect(home.text.includes('href="https://cinkr.com/"'), "/: canonical does not point to the Cinkr origin");

const kincoRedirects = [
  ["/kinco?source=legacy", "https://kinco.cinkr.com/?source=legacy"],
  ["/kinco/gl070/?source=legacy", "https://kinco.cinkr.com/gl070/?source=legacy"],
  ["/hmi?source=legacy", "https://kinco.cinkr.com/?source=legacy"],
  ["/hmi/gl070/?source=legacy", "https://kinco.cinkr.com/gl070/?source=legacy"]
];
for (const [path, expected] of kincoRedirects) {
  const result = await get(path);
  checked.redirects += 1;
  expect(result.response.status === 301, `${path}: expected 301, received ${result.response.status}`);
  expect(result.response.headers.get("location") === expected, `${path}: wrong redirect target`);
}
const kincoOther = await get("/kinco-other/");
expect(kincoOther.response.status === 404, "/kinco-other/: must not match the retired prefix");
if (mode === "production") {
  for (const [path, expected] of [
    ["/", "https://kinco.cinkr.com/"],
    ["/gl070/?source=legacy", "https://kinco.cinkr.com/gl070/?source=legacy"],
    ["/unknown-acceptance/?source=legacy", "https://kinco.cinkr.com/unknown-acceptance/?source=legacy"]
  ]) {
    const { response } = await getAbsolute(`https://hmi.cinkr.com${path}`);
    checked.redirects += 1;
    expect(response.status === 301, `hmi.cinkr.com${path}: expected 301, received ${response.status}`);
    expect(response.headers.get("location") === expected, `hmi.cinkr.com${path}: wrong redirect target`);
  }
}

const richautoRedirects = [
  ["/richauto", "https://richauto.cinkr.com/"],
  ["/richauto/", "https://richauto.cinkr.com/"],
  ["/richauto/a11/?source=legacy", "https://richauto.cinkr.com/a11/?source=legacy"]
];
for (const [path, expected] of richautoRedirects) {
  const { response } = await get(path);
  checked.redirects += 1;
  expect(response.status === 301, `${path}: expected 301, received ${response.status}`);
  expect(response.headers.get("location") === expected, `${path}: wrong redirect target`);
}
const richautoOther = await get("/richauto-other/");
expect(richautoOther.response.status === 404, "/richauto-other/: must not match the retired prefix");

const hqdRedirects = [
  ["/hqd", "https://hqd.cinkr.com/"],
  ["/hqd/", "https://hqd.cinkr.com/"],
  ["/hqd/gdz-23/?source=legacy", "https://hqd.cinkr.com/gdz-23/?source=legacy"]
];
for (const [path, expected] of hqdRedirects) {
  const { response } = await get(path);
  checked.redirects += 1;
  expect(response.status === 301, `${path}: expected 301, received ${response.status}`);
  expect(response.headers.get("location") === expected, `${path}: wrong redirect target`);
}
const hqdOther = await get("/hqd-other/");
expect(hqdOther.response.status === 404, "/hqd-other/: must not match the retired prefix");

const mpgRedirects = [
  ["/mpg", "https://mpg.cinkr.com/"],
  ["/mpg/", "https://mpg.cinkr.com/"],
  ["/mpg/blog/", "https://mpg.cinkr.com/blog/"],
  ["/mpg/robots.txt", "https://mpg.cinkr.com/robots.txt"],
  ["/mpg/blog/what-is-a-cnc-mpg-handwheel/?source=legacy", "https://mpg.cinkr.com/blog/what-is-a-cnc-mpg-handwheel/?source=legacy"]
];
for (const [path, expected] of mpgRedirects) {
  const { response } = await get(path);
  checked.redirects += 1;
  expect(response.status === 301, `${path}: expected 301, received ${response.status}`);
  expect(response.headers.get("location") === expected, `${path}: wrong redirect target`);
}
const mpgOther = await get("/mpg-other/");
expect(mpgOther.response.status === 404, "/mpg-other/: must not match the retired prefix");

const mainMissing = await get("/acceptance-path-that-does-not-exist/");
checked.notFound += 1;
expect(mainMissing.response.status === 404, "/unknown: expected 404, received " + mainMissing.response.status);

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
