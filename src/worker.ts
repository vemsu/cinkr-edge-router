import legacyRedirects from "../manifests/legacy-redirects.json";
import policies from "../manifests/origin-policy.json";
import { LEGACY_HOST_PRODUCTS, originFor, PUBLIC_HOSTS, type ProductRoute } from "./routes";

type Environment = { ENVIRONMENT?: "production" | "staging" };
type LegacyRedirect = { host: string; path: string; target: string };
const redirects = new Map((legacyRedirects as LegacyRedirect[]).map((entry) => [`${entry.host}${entry.path}`, entry.target]));

function redirectFor(url: URL): Response | null {
  const target = redirects.get(`${url.hostname}${url.pathname}`);
  if (!target) return null;
  const destination = new URL(target);
  destination.search = url.search;
  return Response.redirect(destination, 301);
}

function richautoSubdomainRedirect(url: URL): Response | null {
  if (!["cinkr.com", "www.cinkr.com", "staging.cinkr.com"].includes(url.hostname)) return null;
  if (url.pathname !== "/richauto" && !url.pathname.startsWith("/richauto/")) return null;
  const suffix = url.pathname.slice("/richauto".length) || "/";
  const destination = new URL(`https://richauto.cinkr.com${suffix}`);
  destination.search = url.search;
  return Response.redirect(destination, 301);
}

function canonicalPathRedirect(url: URL): Response | null {
  if (url.pathname === "/hmi") {
    const destination = new URL("/kinco/", url.origin);
    destination.search = url.search;
    return Response.redirect(destination, 301);
  }
  if (url.pathname.startsWith("/hmi/")) {
    const destination = new URL(`/kinco/${url.pathname.slice("/hmi/".length)}`, url.origin);
    destination.search = url.search;
    return Response.redirect(destination, 301);
  }
  for (const product of ["kinco", "hqd", "mpg"]) {
    if (url.pathname === `/${product}/robots.txt`) return Response.redirect(new URL("/robots.txt", url.origin), 301);
  }
  return null;
}

function unavailable(requestId: string): Response {
  return new Response("Origin unavailable", { status: 502, headers: { "content-type": "text/plain; charset=utf-8", "x-request-id": requestId } });
}

function requestForOrigin(url: URL, request: Request): Request {
  const headers = new Headers(request.headers);
  headers.delete("host");
  return new Request(url, { method: request.method, headers, redirect: "manual" });
}

async function legacyHostNotFound(request: Request, origin: string, product: ProductRoute, requestId: string): Promise<Response> {
  const notFoundUrl = new URL(`/${product}/__legacy_host_unmapped__`, origin);
  try {
    const response = await fetch(requestForOrigin(notFoundUrl, request));
    if (response.status === 404) return response;
  } catch {
    // Return a deterministic 404 below if the product origin cannot provide its styled page.
  }
  return new Response("Not found", {
    status: 404,
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "x-robots-tag": "noindex, nofollow",
      "x-request-id": requestId
    }
  });
}

function finalizeResponse(response: Response, env: Environment, requestId: string): Response {
  const headers = new Headers(response.headers);
  headers.set("x-request-id", requestId);
  if (env.ENVIRONMENT === "staging") {
    headers.set("x-robots-tag", "noindex, nofollow");
    headers.set("cache-control", "no-store");
  }
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}

export default {
  async fetch(request: Request, env: Environment): Promise<Response> {
    const url = new URL(request.url);
    const requestId = crypto.randomUUID();
    const isWorkersDevStagingHost = env.ENVIRONMENT === "staging" && url.hostname === "cinkr-edge-router-staging.atcspindle.workers.dev";
    if (!PUBLIC_HOSTS.has(url.hostname) && !isWorkersDevStagingHost) return new Response("Unknown host", { status: 421, headers: { "x-request-id": requestId } });
    const richautoRedirect = richautoSubdomainRedirect(url);
    if (richautoRedirect) return finalizeResponse(richautoRedirect, env, requestId);
    const redirect = redirectFor(url);
    if (redirect) return finalizeResponse(redirect, env, requestId);
    const canonicalRedirect = canonicalPathRedirect(url);
    if (canonicalRedirect) return finalizeResponse(canonicalRedirect, env, requestId);
    if (!["GET", "HEAD"].includes(request.method)) return new Response("Method not allowed", { status: 405, headers: { allow: "GET, HEAD", "x-request-id": requestId } });

    const policy = policies[(env.ENVIRONMENT ?? "production") as "production" | "staging"];
    const legacyProduct = LEGACY_HOST_PRODUCTS[url.hostname];
    const origin = legacyProduct ? policy[legacyProduct] : originFor(url.pathname, policy);
    if (legacyProduct) {
      const response = await legacyHostNotFound(request, origin, legacyProduct, requestId);
      return finalizeResponse(response, env, requestId);
    }
    const originUrl = new URL(`${url.pathname}${url.search}`, origin);
    try {
      const response = await fetch(requestForOrigin(originUrl, request));
      return finalizeResponse(response, env, requestId);
    } catch {
      return unavailable(requestId);
    }
  }
} satisfies ExportedHandler<Environment>;
