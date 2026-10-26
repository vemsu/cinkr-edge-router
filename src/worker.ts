import legacyRedirects from "../manifests/legacy-redirects.json";
import policies from "../manifests/origin-policy.json";
import { LEGACY_HOST_PRODUCTS, originFor, PUBLIC_HOSTS, RETIRED_PRODUCT_HOSTS, type ProductRoute } from "./routes";

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

function retiredSubdomainRedirect(url: URL, env: Environment): Response | null {
  const allowedHosts = ["cinkr.com", "www.cinkr.com", "staging.cinkr.com"];
  const isStagingWorkersDevHost = env.ENVIRONMENT === "staging" && url.hostname === "cinkr-edge-router-staging.atcspindle.workers.dev";
  if (!allowedHosts.includes(url.hostname) && !isStagingWorkersDevHost) return null;
  const targets: Readonly<Record<string, string>> = {
    "/kinco": "https://kinco.cinkr.com",
    "/hmi": "https://kinco.cinkr.com",
    "/richauto": "https://richauto.cinkr.com"
  };
  const route = Object.keys(targets).find((prefix) => url.pathname === prefix || url.pathname.startsWith(`${prefix}/`));
  if (!route) return null;
  const suffix = url.pathname.slice(route.length) || "/";
  const destination = new URL(`${targets[route]}${suffix}`);
  destination.search = url.search;
  return Response.redirect(destination, 301);
}

function retiredHostRedirect(url: URL): Response | null {
  const origin = RETIRED_PRODUCT_HOSTS[url.hostname];
  if (!origin) return null;
  const destination = new URL(url.pathname, origin);
  destination.search = url.search;
  return Response.redirect(destination, 301);
}

function canonicalPathRedirect(url: URL): Response | null {
  for (const product of ["hqd", "mpg"]) {
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
    const redirect = redirectFor(url);
    if (redirect) return finalizeResponse(redirect, env, requestId);
    const retiredRedirect = retiredSubdomainRedirect(url, env);
    if (retiredRedirect) return finalizeResponse(retiredRedirect, env, requestId);
    const retiredHost = retiredHostRedirect(url);
    if (retiredHost) return finalizeResponse(retiredHost, env, requestId);
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
