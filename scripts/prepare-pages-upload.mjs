import { cp, mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const PAGES_METADATA = new Set(["_headers", "_redirects", "_routes.json"]);

function isInside(parent, child) {
  const path = relative(parent, child);
  return path === "" || (!path.startsWith(`..${sep}`) && path !== ".." && !path.startsWith(sep));
}

function prefixPath(path, product) {
  if (!path.startsWith("/")) return path;
  if (path === `/${product}` || path.startsWith(`/${product}/`)) return path;
  return `/${product}${path === "/" ? "/" : path}`;
}

export function prefixHeaders(text, product) {
  const output = [];
  for (const line of text.split(/\r?\n/)) {
    if (line.trim() === "/*") continue;
    if (line.startsWith("/")) output.push(prefixPath(line.trim(), product));
    else output.push(line);
  }
  return output.join("\n").trimEnd() + "\n";
}

function prefixRedirectDestination(destination, product) {
  if (!destination.startsWith("/")) return destination;
  return prefixPath(destination, product);
}

function prefixedRedirectLines(text, product) {
  const output = [];
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      output.push(line);
      continue;
    }
    const [from, destination, ...rest] = trimmed.split(/\s+/);
    if (!from || !destination) throw new Error(`Invalid redirect line: ${line}`);
    output.push([
      prefixPath(from, product),
      prefixRedirectDestination(destination, product),
      ...rest
    ].join(" "));
  }
  return output;
}

async function readOptional(path) {
  try {
    return await readFile(path, "utf8");
  } catch (error) {
    if (error?.code === "ENOENT") return "";
    throw error;
  }
}

async function copyDirectoryContents(source, destination) {
  await mkdir(destination, { recursive: true });
  for (const entry of await readdir(source)) {
    await cp(join(source, entry), join(destination, entry), { recursive: true });
  }
}

function countHeaderRules(text) {
  return text.split(/\r?\n/).filter((line) => line.startsWith("/")).length;
}

function countRedirectRules(text) {
  return text.split(/\r?\n/).filter((line) => {
    const trimmed = line.trim();
    return trimmed && !trimmed.startsWith("#");
  }).length;
}

function validatePackage({ headers, redirects, product, legacyHeaderCount, legacyRedirectCount }) {
  if (!headers.includes("/*")) throw new Error("Generated _headers is missing the catch-all");
  if (!headers.includes("Content-Security-Policy:")) throw new Error("Generated _headers is missing CSP");
  if (legacyHeaderCount > 1 && !headers.includes(`/${product}/`)) {
    throw new Error("Generated _headers is missing prefixed cache rules");
  }
  if (!redirects.includes(`/${product}/* /${product}/:splat 200`)) throw new Error("Generated _redirects is missing the product catch-all");
  if (!redirects.includes(`/ https://cinkr.com/${product}/ 301`)) {
    throw new Error("Generated _redirects is missing the legacy root migration");
  }
  if (legacyRedirectCount > 0 && !redirects.includes(`/${product}/`)) {
    throw new Error("Generated _redirects is missing prefixed compatibility rules");
  }
}

export async function preparePagesUpload(sourceArg, product, outputArg) {
  if (!sourceArg || !product || !outputArg) {
    throw new Error("Usage: prepare-pages-upload.mjs <dist> <product> <output>");
  }
  if (!/^[a-z0-9-]+$/.test(product)) throw new Error(`Invalid product path: ${product}`);

  const sourceRoot = resolve(sourceArg);
  const productRoot = join(sourceRoot, product);
  const output = resolve(outputArg);
  if (!isInside(sourceRoot, productRoot)) throw new Error("Product path escapes the build directory");
  if (isInside(sourceRoot, output) || isInside(output, sourceRoot)) {
    throw new Error("Upload output must not overlap the build source");
  }

  const legacyHeaders = await readOptional(join(sourceRoot, "_headers"));
  const legacyRedirects = await readOptional(join(sourceRoot, "_redirects"));
  const productHeaders = await readOptional(join(productRoot, "_headers"));
  const productRedirects = await readOptional(join(productRoot, "_redirects"));

  await rm(output, { recursive: true, force: true });
  await copyDirectoryContents(sourceRoot, output);

  for (const metadata of PAGES_METADATA) {
    await rm(join(output, metadata), { force: true });
    await rm(join(output, product, metadata), { force: true });
  }

  const headerSections = [
    legacyHeaders.trimEnd(),
    productHeaders ? [
      "# Prefixed product rules used when the edge router serves this Pages project.",
      prefixHeaders(productHeaders, product).trimEnd()
    ].join("\n") : ""
  ].filter(Boolean);
  const headers = headerSections.join("\n\n") + "\n";

  const redirectLines = [
    "# Legacy product host compatibility. These rules remain valid until the Worker route takes over.",
    `/ https://cinkr.com/${product}/ 301`,
    "",
    legacyRedirects.trimEnd(),
    "",
    "# Prefixed product rules used through cinkr.com and the edge router.",
    ...prefixedRedirectLines(productRedirects, product),
    "",
    `/${product}/* /${product}/:splat 200`,
    `/robots.txt /${product}/robots.txt 302`,
    `/sitemap-index.xml /${product}/sitemap-index.xml 302`,
    `/sitemap-0.xml /${product}/sitemap-0.xml 302`,
    ""
  ];
  const redirects = redirectLines.join("\n").replace(/\n{3,}/g, "\n\n");

  const legacyHeaderCount = countHeaderRules(legacyHeaders);
  const legacyRedirectCount = countRedirectRules(legacyRedirects);
  const prefixedHeaderCount = countHeaderRules(productHeaders);
  const prefixedRedirectCount = countRedirectRules(productRedirects);
  validatePackage({ headers, redirects, product, legacyHeaderCount, legacyRedirectCount });

  await writeFile(join(output, "_headers"), headers, "utf8");
  await writeFile(join(output, "_redirects"), redirects, "utf8");

  const exposedMetadata = [];
  for (const [root, label] of [[output, "root"], [join(output, product), product]]) {
    for (const metadata of PAGES_METADATA) {
      if (root === output && (metadata === "_headers" || metadata === "_redirects")) continue;
      try {
        await readFile(join(root, metadata));
        exposedMetadata.push(`${label}/${metadata}`);
      } catch (error) {
        if (error?.code !== "ENOENT") throw error;
      }
    }
  }
  if (exposedMetadata.length) throw new Error(`Pages metadata remained in public directories: ${exposedMetadata.join(", ")}`);

  console.log(JSON.stringify({
    source: sourceRoot,
    output,
    product,
    legacyHeaderCount,
    legacyRedirectCount,
    prefixedHeaderCount,
    prefixedRedirectCount
  }, null, 2));
  return output;
}

const invokedPath = process.argv[1] ? resolve(process.argv[1]) : "";
if (invokedPath && invokedPath === resolve(fileURLToPath(import.meta.url))) {
  await preparePagesUpload(...process.argv.slice(2));
}
