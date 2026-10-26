const PUBLIC_ORIGIN = "https://kinco.cinkr.com";
const args = process.argv.slice(2);
const option = (name) => {
  const prefix = `--${name}=`;
  return args.find((arg) => arg.startsWith(prefix))?.slice(prefix.length);
};
const preview = args.includes("--preview");
const routing = args.includes("--routing");
const siteBase = new URL(option("site-base") ?? `${PUBLIC_ORIGIN}/`);
if (!siteBase.pathname.endsWith("/")) siteBase.pathname += "/";

const failures = [];
const checked = { pages: 0, assets: 0, redirects: 0, notFound: 0 };
const expect = (condition, message) => {
  if (!condition) failures.push(message);
};
const decode = (value) => value.replaceAll("&amp;", "&");
const sameSiteUrl = (value) => {
  const url = new URL(decode(value), PUBLIC_ORIGIN);
  expect(url.origin === PUBLIC_ORIGIN, `Unexpected Kinco public origin: ${url.href}`);
  return new URL(`${url.pathname}${url.search}`, siteBase).href;
};
const fetchText = async (url, options = {}) => {
  const response = await fetch(url, { redirect: "manual", ...options });
  const text = response.status < 300 || response.status >= 400 ? await response.text() : "";
  return { response, text };
};
const oneCanonical = (html) => [...html.matchAll(/<link rel="canonical" href="([^"]+)"/g)].map((match) => match[1]);
const noindexMeta = (html) => /<meta name="robots" content="[^"]*noindex/i.test(html);
const checkSecurityHeaders = (response, label) => {
  for (const header of [
    "content-security-policy",
    "strict-transport-security",
    "x-content-type-options",
    "x-frame-options",
    "referrer-policy",
    "permissions-policy"
  ]) {
    expect(Boolean(response.headers.get(header)), `${label}: missing ${header}`);
  }
};
const absoluteAsset = (value) => {
  if (!value || value.startsWith("#") || value.startsWith("mailto:") || value.startsWith("data:")) return null;
  try {
    const url = new URL(decode(value), PUBLIC_ORIGIN);
    if (url.origin !== PUBLIC_ORIGIN) return null;
    return url;
  } catch {
    return null;
  }
};

const root = await fetchText(siteBase.href);
expect(root.response.status === 200, `/: expected 200, received ${root.response.status}`);
expect(!noindexMeta(root.text), "/: unexpected noindex meta");
if (!preview) expect(!(root.response.headers.get("x-robots-tag") ?? "").toLowerCase().includes("noindex"), "/: unexpected X-Robots-Tag noindex");
checkSecurityHeaders(root.response, "/");

const robots = await fetchText(new URL("robots.txt", siteBase).href);
expect(robots.response.status === 200, `robots.txt: expected 200, received ${robots.response.status}`);
expect(robots.text.includes(`Sitemap: ${PUBLIC_ORIGIN}/sitemap-index.xml`), "robots.txt: Kinco sitemap declaration missing");
expect(!robots.text.includes("cinkr.com/kinco"), "robots.txt: old subdirectory sitemap remains");

const sitemapIndex = await fetchText(new URL("sitemap-index.xml", siteBase).href);
expect(sitemapIndex.response.status === 200, `sitemap-index.xml: expected 200, received ${sitemapIndex.response.status}`);
const sitemapUrls = [...sitemapIndex.text.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => decode(match[1]));
expect(sitemapUrls.length > 0, "sitemap-index.xml: no child sitemap");

const pageUrls = new Set();
const assetUrls = new Set();
for (const sitemapUrl of sitemapUrls) {
  const child = await fetchText(sameSiteUrl(sitemapUrl));
  expect(child.response.status === 200, `${sitemapUrl}: expected 200, received ${child.response.status}`);
  for (const match of child.text.matchAll(/<loc>([^<]+)<\/loc>/g)) pageUrls.add(decode(match[1]));
}
expect(pageUrls.size > 70, `sitemap: suspiciously few Kinco pages (${pageUrls.size})`);

for (const pageUrl of pageUrls) {
  const publicPage = new URL(pageUrl);
  expect(publicPage.origin === PUBLIC_ORIGIN, `sitemap: page leaves Kinco origin: ${pageUrl}`);
  const { response, text } = await fetchText(sameSiteUrl(pageUrl));
  checked.pages += 1;
  expect(response.status === 200, `${publicPage.pathname}: expected 200, received ${response.status}`);
  expect(!noindexMeta(text), `${publicPage.pathname}: unexpected noindex meta`);
  if (!preview) expect(!(response.headers.get("x-robots-tag") ?? "").toLowerCase().includes("noindex"), `${publicPage.pathname}: unexpected X-Robots-Tag noindex`);
  const canonicals = oneCanonical(text);
  expect(canonicals.length === 1, `${publicPage.pathname}: expected one canonical, found ${canonicals.length}`);
  expect(canonicals[0] === publicPage.href, `${publicPage.pathname}: canonical is ${canonicals[0] ?? "missing"}`);
  expect(text.includes(`<meta property="og:url" content="${publicPage.href}">`), `${publicPage.pathname}: og:url differs from canonical`);
  expect(!text.includes("https://cinkr.com/kinco"), `${publicPage.pathname}: old subdirectory URL remains`);
  expect(!/(?:href|src)="\/kinco(?:\/|")/.test(text), `${publicPage.pathname}: old root-relative path remains`);

  for (const match of text.matchAll(/(?:href|src)="([^"]+)"/g)) {
    const asset = absoluteAsset(match[1]);
    if (asset && /\.(?:css|m?js|png|jpe?g|webp|avif|svg|ico|pdf|woff2?)(?:\?.*)?$/i.test(asset.pathname + asset.search)) {
      assetUrls.add(asset.href);
    }
  }
  for (const match of text.matchAll(/(?:property|name)="(?:og:image|twitter:image)" content="([^"]+)"/g)) {
    const asset = absoluteAsset(match[1]);
    if (asset) assetUrls.add(asset.href);
  }
}

const pagination = await fetchText(new URL("blog/page/2/", siteBase).href);
expect(pagination.response.status === 200, "blog/page/2/: expected 200");
expect(noindexMeta(pagination.text), "blog/page/2/: expected noindex");
expect(oneCanonical(pagination.text).length === 1, "blog/page/2/: expected one self canonical");

const missing = await fetchText(new URL("acceptance-path-that-does-not-exist/", siteBase).href);
checked.notFound += 1;
expect(missing.response.status === 404, `unknown path: expected 404, received ${missing.response.status}`);
expect(noindexMeta(missing.text), "unknown path: branded 404 must be noindex");

for (const assetUrl of assetUrls) {
  const response = await fetch(sameSiteUrl(assetUrl), { redirect: "manual" });
  checked.assets += 1;
  expect(response.status === 200, `${new URL(assetUrl).pathname}: asset expected 200, received ${response.status}`);
}

if (routing) {
  const redirectCases = [
    ["https://cinkr.com/kinco?utm_source=cutover", "https://kinco.cinkr.com/?utm_source=cutover"],
    ["https://cinkr.com/kinco/?utm_source=cutover", "https://kinco.cinkr.com/?utm_source=cutover"],
    ["https://cinkr.com/kinco/gl070/?utm_source=cutover", "https://kinco.cinkr.com/gl070/?utm_source=cutover"],
    ["https://www.cinkr.com/kinco/blog/?utm_source=cutover", "https://kinco.cinkr.com/blog/?utm_source=cutover"],
    ["https://cinkr.com/hmi/gl070/?utm_source=cutover", "https://kinco.cinkr.com/gl070/?utm_source=cutover"],
    ["https://hmi.cinkr.com/?utm_source=cutover", "https://kinco.cinkr.com/?utm_source=cutover"],
    ["https://hmi.cinkr.com/GL070/?utm_source=cutover", "https://kinco.cinkr.com/gl070/?utm_source=cutover"],
    ["https://hmi.cinkr.com/unknown-acceptance-path/?utm_source=cutover", "https://kinco.cinkr.com/unknown-acceptance-path/?utm_source=cutover"],
    ["https://www.kinco.cinkr.com/gl070/?utm_source=cutover", "https://kinco.cinkr.com/gl070/?utm_source=cutover"]
  ];
  for (const [source, expected] of redirectCases) {
    const response = await fetch(source, { redirect: "manual" });
    checked.redirects += 1;
    expect(response.status === 301, `${source}: expected 301, received ${response.status}`);
    expect(response.headers.get("location") === expected, `${source}: redirect target ${response.headers.get("location")}`);
  }
  const other = await fetch("https://cinkr.com/kinco-other/", { redirect: "manual" });
  expect(!(other.status === 301 && (other.headers.get("location") ?? "").startsWith(PUBLIC_ORIGIN)), "/kinco-other/: must not match the retired prefix");

  const home = await fetchText("https://cinkr.com/");
  expect(home.text.includes(`href="${PUBLIC_ORIGIN}/"`), "Cinkr homepage must link directly to the Kinco subdomain");
  const homeRobots = await fetchText("https://cinkr.com/robots.txt");
  expect(homeRobots.text.includes(`Sitemap: ${PUBLIC_ORIGIN}/sitemap-index.xml`), "Cinkr robots must declare the Kinco subdomain sitemap");
  expect(!homeRobots.text.includes("Sitemap: https://cinkr.com/kinco/sitemap-index.xml"), "Cinkr robots still declares the retired sitemap");
}

if (failures.length) {
  console.error(JSON.stringify({ siteBase: siteBase.href, preview, routing, checked, failureCount: failures.length, failures: failures.slice(0, 100) }, null, 2));
  process.exit(1);
}
console.log(JSON.stringify({ siteBase: siteBase.href, preview, routing, checked }, null, 2));
