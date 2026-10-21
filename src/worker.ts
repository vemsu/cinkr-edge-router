import legacyRedirects from "../manifests/legacy-redirects.json";
import policies from "../manifests/origin-policy.json";
import { originFor, PUBLIC_HOSTS } from "./routes";

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

function unavailable(requestId: string): Response {
  return new Response("Origin unavailable", { status: 502, headers: { "content-type": "text/plain; charset=utf-8", "x-request-id": requestId } });
}

export default {
  async fetch(request: Request, env: Environment): Promise<Response> {
    const url = new URL(request.url);
    const requestId = crypto.randomUUID();
    const isWorkersDevStagingHost = env.ENVIRONMENT === "staging" && url.hostname === "cinkr-edge-router-staging.atcspindle.workers.dev";
    if (!PUBLIC_HOSTS.has(url.hostname) && !isWorkersDevStagingHost) return new Response("Unknown host", { status: 421, headers: { "x-request-id": requestId } });
    const redirect = redirectFor(url);
    if (redirect) return redirect;
    if (!["GET", "HEAD"].includes(request.method)) return new Response("Method not allowed", { status: 405, headers: { allow: "GET, HEAD", "x-request-id": requestId } });

    const policy = policies[(env.ENVIRONMENT ?? "production") as "production" | "staging"];
    const origin = originFor(url.pathname, policy);
    const originUrl = new URL(`${url.pathname}${url.search}`, origin);
    try {
      const response = await fetch(new Request(originUrl, request));
      const headers = new Headers(response.headers);
      headers.set("x-request-id", requestId);
      if (env.ENVIRONMENT === "staging") headers.set("x-robots-tag", "noindex, nofollow");
      return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
    } catch {
      return unavailable(requestId);
    }
  }
} satisfies ExportedHandler<Environment>;
