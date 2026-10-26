export const PUBLIC_HOSTS = new Set(["cinkr.com", "www.cinkr.com", "hmi.cinkr.com", "hqd.cinkr.com", "mpg.cinkr.com", "staging.cinkr.com"]);

export type ProductRoute = "hqd" | "mpg";
export const PRODUCT_ROUTES: readonly ProductRoute[] = ["hqd", "mpg"];
export const LEGACY_HOST_PRODUCTS: Readonly<Record<string, ProductRoute>> = {
  "hqd.cinkr.com": "hqd",
  "mpg.cinkr.com": "mpg"
};
export const RETIRED_PRODUCT_HOSTS: Readonly<Record<string, string>> = {
  "hmi.cinkr.com": "https://kinco.cinkr.com"
};

export function productRoute(pathname: string): ProductRoute | null {
  for (const route of PRODUCT_ROUTES) if (pathname === `/${route}` || pathname.startsWith(`/${route}/`)) return route;
  return null;
}

export function originFor(pathname: string, origins: Record<"main" | ProductRoute, string>): string {
  return origins[productRoute(pathname) ?? "main"];
}
