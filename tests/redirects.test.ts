import { describe, expect, it } from "vitest";
import worker from "../src/worker";

describe("legacy redirects", () => {
  it("redirects the old MPG root in one hop and retains its query", async () => {
    const response = await worker.fetch(new Request("https://mpg.cinkr.com/?source=old"), {});
    expect(response.status).toBe(301);
    expect(response.headers.get("location")).toBe("https://cinkr.com/mpg/?source=old");
  });
  it("does not turn an unknown legacy path into a homepage redirect", async () => {
    const response = await worker.fetch(new Request("https://mpg.cinkr.com/not-known/"), {});
    expect(response.status).not.toBe(301);
  });
});
