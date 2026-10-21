import { describe, expect, it } from "vitest";
import { originFor, productRoute } from "../src/routes";
import worker from "../src/worker";

const origins = { main: "https://main.example", kinco: "https://kinco.example", hqd: "https://hqd.example", richauto: "https://richauto.example", mpg: "https://mpg.example" };

describe("product routing", () => {
  it.each([["/kinco/", "kinco"], ["/hqd/downloads/a.pdf", "hqd"], ["/richauto/_astro/app.js", "richauto"], ["/mpg/sitemap-0.xml", "mpg"]])("retains the %s prefix", (pathname, expected) => expect(productRoute(pathname)).toBe(expected));
  it("keeps root-site requests on the main origin", () => expect(originFor("/privacy-policy/", origins)).toBe(origins.main));
  it("allows the dedicated workers.dev hostname only in staging", async () => {
    const staging = await worker.fetch(new Request("https://cinkr-edge-router-staging.atcspindle.workers.dev/"), { ENVIRONMENT: "staging" });
    const production = await worker.fetch(new Request("https://cinkr-edge-router-staging.atcspindle.workers.dev/"), { ENVIRONMENT: "production" });
    expect(staging.status).not.toBe(421);
    expect(production.status).toBe(421);
  });
});
