import { readFile } from "node:fs/promises";

const redirects = JSON.parse(await readFile(new URL("../manifests/legacy-redirects.json", import.meta.url), "utf8"));
const seen = new Set();
for (const redirect of redirects) {
  if (!redirect.host || !redirect.path?.startsWith("/") || !redirect.target?.startsWith("https://")) throw new Error(`Invalid redirect: ${JSON.stringify(redirect)}`);
  const targetOrigin = new URL(redirect.target).origin;
  const allowedOrigins = redirect.host === "hmi.cinkr.com"
    ? new Set(["https://kinco.cinkr.com"])
    : new Set(["https://cinkr.com", "https://kinco.cinkr.com"]);
  if (!allowedOrigins.has(targetOrigin)) throw new Error(`Unexpected redirect origin: ${JSON.stringify(redirect)}`);
  if (new URL(redirect.target).href === new URL(redirect.path, `https://${redirect.host}`).href) {
    throw new Error(`Self redirect: ${redirect.host}${redirect.path}`);
  }
  const key = `${redirect.host}${redirect.path}`;
  if (seen.has(key)) throw new Error(`Duplicate redirect: ${key}`);
  seen.add(key);
}
const policies = JSON.parse(await readFile(new URL("../manifests/origin-policy.json", import.meta.url), "utf8"));
for (const environment of ["production", "staging"]) for (const origin of Object.values(policies[environment])) {
  const url = new URL(origin);
  if (url.protocol !== "https:" || !url.hostname.endsWith(".pages.dev")) throw new Error(`Invalid ${environment} origin: ${origin}`);
}
console.log(`Manifest valid (${redirects.length} exact redirects).`);
