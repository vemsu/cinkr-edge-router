import { afterEach, describe, expect, it, vi } from "vitest";
import { LEGACY_HOST_PRODUCTS, originFor, productRoute, RETIRED_PRODUCT_HOSTS } from "../src/routes";
import worker from "../src/worker";

const origins = { main: "https://main.example", hqd: "https://hqd.example", mpg: "https://mpg.example" };

describe("product routing", () => {
  afterEach(() => vi.restoreAllMocks());

  it.each([
    ["/hqd/downloads/a.pdf", "hqd"],
    ["/mpg/sitemap-0.xml", "mpg"]
  ])("retains the %s prefix", (pathname, expected) => expect(productRoute(pathname)).toBe(expected));
  it("does not treat retired Kinco and RichAuto subdirectories as product origins", () => {
    expect(productRoute("/kinco/gl070/")).toBeNull();
    expect(productRoute("/richauto/a11/")).toBeNull();
  });
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
  it("maps every remaining legacy product host to its product origin", () => {
    expect(LEGACY_HOST_PRODUCTS).toEqual({
      "hqd.cinkr.com": "hqd",
      "mpg.cinkr.com": "mpg"
    });
    expect(RETIRED_PRODUCT_HOSTS).toEqual({
      "hmi.cinkr.com": "https://kinco.cinkr.com"
    });
  });
  it("redirects remaining product robots requests to the single site-level robots file", async () => {
    const response = await worker.fetch(new Request("https://cinkr.com/hqd/robots.txt"), {});
    expect(response.status).toBe(301);
    expect(response.headers.get("location")).toBe("https://cinkr.com/robots.txt");
  });
  it.each([
    ["https://cinkr.com/kinco", "https://kinco.cinkr.com/"],
    ["https://cinkr.com/kinco/", "https://kinco.cinkr.com/"],
    ["https://cinkr.com/kinco/gl070/?source=old", "https://kinco.cinkr.com/gl070/?source=old"],
    ["https://www.cinkr.com/kinco/blog/?utm_source=old", "https://kinco.cinkr.com/blog/?utm_source=old"],
    ["https://cinkr.com/hmi", "https://kinco.cinkr.com/"],
    ["https://cinkr.com/hmi/gl070/?source=old", "https://kinco.cinkr.com/gl070/?source=old"]
  ])("redirects %s to the Kinco subdomain in one hop", async (source, expected) => {
    const response = await worker.fetch(new Request(source), { ENVIRONMENT: "production" });
    expect(response.status).toBe(301);
    expect(response.headers.get("location")).toBe(expected);
  });
  it("routes retired HMI hosts to the Kinco subdomain", async () => {
    const exact = await worker.fetch(new Request("https://hmi.cinkr.com/GL070/?source=old"), { ENVIRONMENT: "production" });
    expect(exact.status).toBe(301);
    expect(exact.headers.get("location")).toBe("https://kinco.cinkr.com/gl070/?source=old");

    const unknown = await worker.fetch(new Request("https://hmi.cinkr.com/unknown/?source=old"), { ENVIRONMENT: "production" });
    expect(unknown.status).toBe(301);
    expect(unknown.headers.get("location")).toBe("https://kinco.cinkr.com/unknown/?source=old");
  });
  it("keeps retired redirects fixed for unusual suffixes", async () => {
    const kinco = await worker.fetch(new Request("https://cinkr.com/kinco//outside.example/"), { ENVIRONMENT: "production" });
    expect(kinco.status).toBe(301);
    expect(kinco.headers.get("location")).toBe("https://kinco.cinkr.com//outside.example/");
    const richauto = await worker.fetch(new Request("https://cinkr.com/richauto//outside.example/"), { ENVIRONMENT: "production" });
    expect(richauto.status).toBe(301);
    expect(richauto.headers.get("location")).toBe("https://richauto.cinkr.com//outside.example/");
  });
  it.each(["kinco-other", "richauto-other"])("does not match paths that only share the %s prefix", async (prefix) => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response("home", { status: 200 }));
    const response = await worker.fetch(new Request(`https://cinkr.com/${prefix}/`), { ENVIRONMENT: "production" });
    expect(response.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledOnce();
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
  it("no longer accepts restored product hosts on the edge worker", async () => {
    for (const host of ["kinco.cinkr.com", "richauto.cinkr.com"]) {
      const response = await worker.fetch(new Request(`https://${host}/`), { ENVIRONMENT: "production" });
      expect(response.status).toBe(421);
    }
  });
  it("keeps retired redirects on the staging host without cacheable indexing", async () => {
    const response = await worker.fetch(new Request("https://staging.cinkr.com/kinco/gl070/?source=old"), { ENVIRONMENT: "staging" });
    expect(response.status).toBe(301);
    expect(response.headers.get("location")).toBe("https://kinco.cinkr.com/gl070/?source=old");
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(response.headers.get("x-robots-tag")).toBe("noindex, nofollow");
  });
  it("tests retired redirects on the dedicated staging workers.dev host", async () => {
    const response = await worker.fetch(
      new Request("https://cinkr-edge-router-staging.atcspindle.workers.dev/kinco/gl070/?source=staging"),
      { ENVIRONMENT: "staging" }
    );
    expect(response.status).toBe(301);
    expect(response.headers.get("location")).toBe("https://kinco.cinkr.com/gl070/?source=staging");
  });
  it("allows the dedicated workers.dev hostname only in staging", async () => {
    const staging = await worker.fetch(new Request("https://cinkr-edge-router-staging.atcspindle.workers.dev/"), { ENVIRONMENT: "staging" });
    const production = await worker.fetch(new Request("https://cinkr-edge-router-staging.atcspindle.workers.dev/"), { ENVIRONMENT: "production" });
    expect(staging.status).not.toBe(421);
    expect(production.status).toBe(421);
  });
});
