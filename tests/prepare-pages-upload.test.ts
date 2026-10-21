import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { preparePagesUpload, prefixHeaders } from "../scripts/prepare-pages-upload.mjs";

const temporaryDirectories: string[] = [];

async function temporaryDirectory() {
  const directory = await mkdtemp(join(tmpdir(), "cinkr-pages-upload-"));
  temporaryDirectories.push(directory);
  return directory;
}

afterEach(async () => {
  await Promise.all(temporaryDirectories.splice(0).map((directory) => rm(directory, { recursive: true, force: true })));
});

describe("prepare Pages upload", () => {
  it("prefixes specific header paths without duplicating the catch-all", () => {
    expect(prefixHeaders("/*\n  CSP: test\n\n/_astro/*\n  Cache-Control: max-age=1\n", "kinco")).toBe([
      "  CSP: test",
      "",
      "/kinco/_astro/*",
      "  Cache-Control: max-age=1",
      ""
    ].join("\n"));
  });

  it("builds a compatibility package with legacy and prefixed resources", async () => {
    const directory = await temporaryDirectory();
    const source = join(directory, "dist");
    const product = join(source, "kinco");
    const output = join(directory, "upload");
    await mkdir(product, { recursive: true });
    await writeFile(join(source, "index.html"), "legacy home", "utf8");
    await writeFile(join(source, "_headers"), "/*\n  Content-Security-Policy: default-src 'self'\n", "utf8");
    await writeFile(join(source, "_redirects"), "/Old /old/ 301\n", "utf8");
    await writeFile(join(product, "index.html"), "product home", "utf8");
    await writeFile(join(product, "_headers"), [
      "/*",
      "  Content-Security-Policy: default-src 'self'",
      "",
      "/downloads/*",
      "  Cache-Control: public, max-age=604800",
      "",
      "/downloads/model.pdf",
      "  X-Robots-Tag: noindex",
      ""
    ].join("\n"), "utf8");
    await writeFile(join(product, "_redirects"), "/G100 /g100/ 301\n", "utf8");

    await preparePagesUpload(source, "kinco", output);

    const headers = await readFile(join(output, "_headers"), "utf8");
    const redirects = await readFile(join(output, "_redirects"), "utf8");
    expect(await readFile(join(output, "index.html"), "utf8")).toBe("legacy home");
    expect(await readFile(join(output, "kinco", "index.html"), "utf8")).toBe("product home");
    expect(headers).toContain("/*\n  Content-Security-Policy");
    expect(headers).not.toContain("/kinco/*\n  Content-Security-Policy");
    expect(headers).toContain("/kinco/downloads/*");
    expect(headers).toContain("/kinco/downloads/model.pdf\n  X-Robots-Tag: noindex");
    expect(redirects).toContain("/ https://cinkr.com/kinco/ 301");
    expect(redirects).not.toContain("/kinco https://cinkr.com/kinco/ 301");
    expect(redirects).not.toContain("/kinco/ https://cinkr.com/kinco/ 301");
    expect(redirects).toContain("/Old /old/ 301");
    expect(redirects).toContain("/kinco/G100 /kinco/g100/ 301");
    expect(redirects).toContain("/kinco/* /kinco/:splat 200");
    await expect(readFile(join(output, "kinco", "_headers"), "utf8")).rejects.toMatchObject({ code: "ENOENT" });
    await expect(readFile(join(output, "kinco", "_redirects"), "utf8")).rejects.toMatchObject({ code: "ENOENT" });
  });

  it("refuses an output path that overlaps the build directory", async () => {
    const directory = await temporaryDirectory();
    const source = join(directory, "dist");
    await mkdir(join(source, "kinco"), { recursive: true });
    await expect(preparePagesUpload(source, "kinco", join(source, "upload"))).rejects.toThrow("must not overlap");
  });
});
