import { afterEach, describe, expect, it, vi } from "vitest";
import { LEGACY_HOST_PRODUCTS, originFor, productRoute } from "../src/routes";
import worker from "../src/worker";

const origins = { main: "https://main.example", kinco: "https://kinco.example", hqd: "https://hqd.example", mpg: "https://mpg.example" };

describe("product routing", () => {
  afterEach(() => vi.restoreAllMocks());

  it.each([["/kinco/", "kinco"], ["/hqd/downloads/a.pdf", "hqd"], ["/mpg/sitemap-0.xml", "mpg"]])("retains the %s prefix", (pathname, expected) => expect(productRoute(pathname)).toBe(expected));
  it("does not treat the retired RichAuto subdirectory as a product origin", () => expect(productRoute("/richauto/a11/")).toBeNull());
  it("keeps root-site requests on the main origin", () => expect(originFor("/privacy-policy/", origins)).toBe(origins.main));
  it("strips the incoming Host header from the origin request", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
      const request = input as Request;
      expect(request.url).toBe("https://cinkr-home.pages.dev/");
      expect(request.headers.has("host")).toBe(false);
      return new Response("home", { status: 200 });
    });
    const response = await worker.fetch(new Request("https://cinkr.com/"), { ENVIRONMENT: "production" });
    expect(response.status).toBe(200);
    expect(await response.text()).toBe("home");
    expect(fetchMock).toHaveBeenCalledOnce();
  });
  it("maps every legacy product host to its product origin", () => {
    expect(LEGACY_HOST_PRODUCTS).toEqual({
      "hmi.cinkr.com": "kinco",
      "hqd.cinkr.com": "hqd",
      "mpg.cinkr.com": "mpg"
    });
  });
  it("redirects product robots requests to the single site-level robots file", async () => {
    const response = await worker.fetch(new Request("https://cinkr.com/kinco/robots.txt"), {});
    expect(response.status).toBe(301);
    expect(response.headers.get("location")).toBe("https://cinkr.com/robots.txt");
  });
  it("prefix-maps the retired /hmi/ path without dropping its query", async () => {
    const response = await worker.fetch(new Request("https://cinkr.com/hmi/gl070/?source=old"), {});
    expect(response.status).toBe(301);
    expect(response.headers.get("location")).toBe("https://cinkr.com/kinco/gl070/?source=old");
  });
  it("redirects /hmi without a trailing slash to the Kinco homepage", async () => {
    const response = await worker.fetch(new Request("https://cinkr.com/hmi?source=old"), {});
    expect(response.status).toBe(301);
    expect(response.headers.get("location")).toBe("https://cinkr.com/kinco/?source=old");
  });
  it("keeps canonical redirects on the staging host", async () => {
    const response = await worker.fetch(new Request("https://staging.cinkr.com/hmi?source=old"), { ENVIRONMENT: "staging" });
    expect(response.status).toBe(301);
    expect(response.headers.get("location")).toBe("https://staging.cinkr.com/kinco/?source=old");
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(response.headers.get("x-robots-tag")).toBe("noindex, nofollow");
  });
  it.each([
    ["https://cinkr.com/richauto", "https://richauto.cinkr.com/"],
    ["https://cinkr.com/richauto/", "https://richauto.cinkr.com/"],
    ["https://cinkr.com/richauto/a11/", "https://richauto.cinkr.com/a11/"],
    ["https://www.cinkr.com/richauto/blog/?utm_source=old", "https://richauto.cinkr.com/blog/?utm_source=old"],
    ["https://staging.cinkr.com/richauto/a11/?source=staging", "https://richauto.cinkr.com/a11/?source=staging"]
  ])("redirects %s to the RichAuto subdomain in one hop", async (source, expected) => {
    const response = await worker.fetch(new Request(source), { ENVIRONMENT: source.includes("staging.") ? "staging" : "production" });
    expect(response.status).toBe(301);
    expect(response.headers.get("location")).toBe(expected);
  });
  it("does not match paths that only share the RichAuto prefix", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response("home", { status: 200 }));
    const response = await worker.fetch(new Request("https://cinkr.com/richauto-other/"), { ENVIRONMENT: "production" });
    expect(response.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledOnce();
  });
  it("keeps the RichAuto target host fixed for unusual suffixes", async () => {
    const response = await worker.fetch(new Request("https://cinkr.com/richauto//outside.example/"), { ENVIRONMENT: "production" });
    expect(response.status).toBe(301);
    expect(response.headers.get("location")).toBe("https://richauto.cinkr.com//outside.example/");
  });
  it("no longer accepts RichAuto hosts on the edge worker", async () => {
    const response = await worker.fetch(new Request("https://richauto.cinkr.com/"), { ENVIRONMENT: "production" });
    expect(response.status).toBe(421);
  });
  it("allows the dedicated workers.dev hostname only in staging", async () => {
    const staging = await worker.fetch(new Request("https://cinkr-edge-router-staging.atcspindle.workers.dev/"), { ENVIRONMENT: "staging" });
    const production = await worker.fetch(new Request("https://cinkr-edge-router-staging.atcspindle.workers.dev/"), { ENVIRONMENT: "production" });
    expect(staging.status).not.toBe(421);
    expect(production.status).toBe(421);
  });
});
