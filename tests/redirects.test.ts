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
  it("keeps RichAuto out of the legacy exact-redirect manifest", () => {
    expect(legacyRedirects.some((entry) => entry.host === "richauto.cinkr.com")).toBe(false);
    expect(legacyRedirects.some((entry) => entry.host === "www.richauto.cinkr.com")).toBe(false);
  });
  it("keeps HQD out of the retired host manifest and product origins", () => {
    expect(legacyRedirects.some((entry) => entry.host === "hqd.cinkr.com")).toBe(false);
    expect("hqd" in policies.production).toBe(false);
    expect("hqd" in policies.staging).toBe(false);
  });
  it("does not turn an unknown legacy path into a homepage redirect", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response("MPG not found", { status: 404 }));
    const response = await worker.fetch(new Request("https://mpg.cinkr.com/not-known/"), {});
    expect(response.status).toBe(404);
    expect(await response.text()).toBe("MPG not found");
    expect(fetchMock).toHaveBeenCalledOnce();
    expect((fetchMock.mock.calls[0][0] as Request).url).toBe(`${policies.production.mpg}/mpg/__legacy_host_unmapped__`);
  });
  it("returns a product 404 for an unknown mpg path", async () => {
    const host = "mpg.cinkr.com";
    const product = "mpg";
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response("not found", { status: 404 }));
    const response = await worker.fetch(new Request(`https://${host}/unknown-deep/path/`), { ENVIRONMENT: "production" });
    expect(response.status).toBe(404);
    expect(fetchMock).toHaveBeenCalledOnce();
    expect((fetchMock.mock.calls[0][0] as Request).url).toBe(`${policies.production[product]}/${product}/__legacy_host_unmapped__`);
  });
  it("redirects every unknown HMI host path to the Kinco subdomain without fetching an origin", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch");
    const response = await worker.fetch(new Request("https://hmi.cinkr.com/not-known/?source=old"), { ENVIRONMENT: "production" });
    expect(response.status).toBe(301);
    expect(response.headers.get("location")).toBe("https://kinco.cinkr.com/not-known/?source=old");
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it("keeps HMI exact rules on kinco.cinkr.com", () => {
    const hmi = legacyRedirects.filter((entry) => entry.host === "hmi.cinkr.com");
    expect(hmi.length).toBeGreaterThan(0);
    expect(hmi.every((entry) => new URL(entry.target).origin === "https://kinco.cinkr.com")).toBe(true);
    expect(hmi.some((entry) => entry.target.includes("cinkr.com/kinco"))).toBe(false);
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
