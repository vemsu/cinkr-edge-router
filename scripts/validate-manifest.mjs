import { readFile } from "node:fs/promises";

const redirects = JSON.parse(await readFile(new URL("../manifests/legacy-redirects.json", import.meta.url), "utf8"));
const seen = new Set();
for (const redirect of redirects) {
  if (!redirect.host || !redirect.path?.startsWith("/") || !redirect.target?.startsWith("https://cinkr.com/")) throw new Error(`Invalid redirect: ${JSON.stringify(redirect)}`);
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
