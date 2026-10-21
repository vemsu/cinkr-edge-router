import { afterEach, describe, expect, it, vi } from "vitest";
import legacyRedirects from "../manifests/legacy-redirects.json";
import policies from "../manifests/origin-policy.json";
import worker from "../src/worker";

describe("legacy redirects", () => {
  afterEach(() => vi.restoreAllMocks());

  it("redirects the old MPG root in one hop and retains its query", async () => {
    const response = await worker.fetch(new Request("https://mpg.cinkr.com/?source=old"), {});
    expect(response.status).toBe(301);
    expect(response.headers.get("location")).toBe("https://cinkr.com/mpg/?source=old");
  });
  it.each([
    ["https://www.richauto.cinkr.com/?source=old", "https://cinkr.com/richauto/?source=old"],
    ["https://www.richauto.cinkr.com/a11/?source=old", "https://cinkr.com/richauto/a11/?source=old"]
  ])("redirects the RichAuto www alias %s in one hop", async (source, expected) => {
    const response = await worker.fetch(new Request(source), {});
    expect(response.status).toBe(301);
    expect(response.headers.get("location")).toBe(expected);
  });
  it("does not turn an unknown legacy path into a homepage redirect", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response("MPG not found", { status: 404 }));
    const response = await worker.fetch(new Request("https://mpg.cinkr.com/not-known/"), {});
    expect(response.status).toBe(404);
    expect(await response.text()).toBe("MPG not found");
    expect(fetchMock).toHaveBeenCalledOnce();
    expect((fetchMock.mock.calls[0][0] as Request).url).toBe(`${policies.production.mpg}/mpg/__legacy_host_unmapped__`);
  });
  it.each([
    ["hmi.cinkr.com", "kinco"],
    ["hqd.cinkr.com", "hqd"],
    ["richauto.cinkr.com", "richauto"],
    ["www.richauto.cinkr.com", "richauto"],
    ["mpg.cinkr.com", "mpg"]
  ])("returns a product 404 for an unknown %s path", async (host, product) => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response("not found", { status: 404 }));
    const response = await worker.fetch(new Request(`https://${host}/unknown-deep/path/`), { ENVIRONMENT: "production" });
    expect(response.status).toBe(404);
    expect(fetchMock).toHaveBeenCalledOnce();
    expect((fetchMock.mock.calls[0][0] as Request).url).toBe(`${policies.production[product as keyof typeof policies.production]}/${product}/__legacy_host_unmapped__`);
  });
  it("routes every manifest entry to its exact canonical target in one hop", async () => {
    const failures: string[] = [];
    for (const entry of legacyRedirects) {
      const response = await worker.fetch(new Request(`https://${entry.host}${entry.path}?acceptance=legacy`), { ENVIRONMENT: "production" });
      const expected = new URL(entry.target);
      expected.search = "?acceptance=legacy";
      if (response.status !== 301 || response.headers.get("location") !== expected.href) {
        failures.push(`${entry.host}${entry.path}: ${response.status} ${response.headers.get("location")} (expected 301 ${expected.href})`);
      }
    }
    expect(failures).toEqual([]);
  });
});
