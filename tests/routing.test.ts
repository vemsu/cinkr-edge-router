import { afterEach, describe, expect, it, vi } from "vitest";
import { LEGACY_HOST_PRODUCTS, originFor, productRoute } from "../src/routes";
import worker from "../src/worker";

const origins = { main: "https://main.example", kinco: "https://kinco.example", hqd: "https://hqd.example", richauto: "https://richauto.example", mpg: "https://mpg.example" };

describe("product routing", () => {
  afterEach(() => vi.restoreAllMocks());

  it.each([["/kinco/", "kinco"], ["/hqd/downloads/a.pdf", "hqd"], ["/richauto/_astro/app.js", "richauto"], ["/mpg/sitemap-0.xml", "mpg"]])("retains the %s prefix", (pathname, expected) => expect(productRoute(pathname)).toBe(expected));
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
      "richauto.cinkr.com": "richauto",
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
  it("allows the dedicated workers.dev hostname only in staging", async () => {
    const staging = await worker.fetch(new Request("https://cinkr-edge-router-staging.atcspindle.workers.dev/"), { ENVIRONMENT: "staging" });
    const production = await worker.fetch(new Request("https://cinkr-edge-router-staging.atcspindle.workers.dev/"), { ENVIRONMENT: "production" });
    expect(staging.status).not.toBe(421);
    expect(production.status).toBe(421);
  });
});
