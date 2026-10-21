import { readFile, readdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const inputs = [
  { file: process.argv[2], host: "cinkr.com", basePath: "" },
  { file: process.argv[3], dist: process.argv[4], host: "hmi.cinkr.com", basePath: "/kinco", product: "kinco" },
  { file: process.argv[5], dist: process.argv[6], host: "hqd.cinkr.com", basePath: "/hqd", product: "hqd" },
  { file: process.argv[7], dist: process.argv[8], host: "richauto.cinkr.com", basePath: "/richauto", product: "richauto" },
  { file: process.argv[9], dist: process.argv[10], host: "mpg.cinkr.com", basePath: "/mpg", product: "mpg" }
];

if (inputs.some(({ file, dist }) => !file || (dist !== undefined && !dist))) throw new Error("Usage: import-legacy-redirects.mjs <home-redirects> <kinco-redirects> <kinco-dist> <hqd-redirects> <hqd-dist> <richauto-redirects> <richauto-dist> <mpg-redirects> <mpg-dist>");

const redirects = new Map();
const add = (host, path, target) => {
  if (!path.startsWith("/") || path.includes("*") || path.includes("\0")) throw new Error(`Invalid legacy path: ${path}`);
  const destination = new URL(target, "https://cinkr.com");
  if (destination.protocol !== "https:" || destination.origin !== "https://cinkr.com") throw new Error(`Legacy target leaves cinkr.com: ${target}`);
  if (destination.href === new URL(path, `https://${host}`).href) return;
  const key = `${host}${path}`;
  if (redirects.has(key) && redirects.get(key) !== destination.href) throw new Error(`Conflicting legacy redirect: ${key}`);
  redirects.set(key, destination.href);
};

async function walk(directory, prefix = "") {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    const name = `${prefix}${entry.name}`;
    if (entry.isDirectory()) files.push(...await walk(path, `${name}/`));
    else if (entry.isFile()) files.push(name);
  }
  return files;
}

for (const { file, dist, host, basePath, product } of inputs) {
  const source = await readFile(file, "utf8");
  for (const raw of source.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const [from, to, status] = line.split(/\s+/);
    if (!from || !to || status !== "301") throw new Error(`Unsupported legacy redirect in ${file}: ${line}`);
    const destination = /^https?:\/\//i.test(to) ? to : `${basePath}${to}`;
    add(host, from, destination);
  }
  if (dist) {
    for (const name of await walk(dist)) {
      if (["_headers", "_redirects", ".DS_Store", "robots.txt"].includes(name) || name.endsWith("/.DS_Store")) continue;
      if (name.endsWith("/index.html")) {
        const path = `/${name.slice(0, -"index.html".length)}`;
        add(host, path, `https://cinkr.com${basePath}${path}`);
      } else if (name !== "index.html") {
        add(host, `/${name}`, `https://cinkr.com${basePath}/${name}`);
      }
    }
  }
  add(host, "/", `https://cinkr.com${basePath}/`);
}

for (const host of ["hmi.cinkr.com", "hqd.cinkr.com", "richauto.cinkr.com", "mpg.cinkr.com"]) add(host, "/robots.txt", "https://cinkr.com/robots.txt");

const output = [...redirects].map(([key, target]) => {
  const slash = key.indexOf("/", 1);
  return { host: key.slice(0, slash), path: key.slice(slash), target };
}).sort((left, right) => `${left.host}${left.path}`.localeCompare(`${right.host}${right.path}`));

const target = fileURLToPath(new URL("../manifests/legacy-redirects.json", import.meta.url));
await writeFile(target, `${JSON.stringify(output, null, 2)}\n`, "utf8");
console.log(`Imported ${output.length} exact legacy redirects.`);
