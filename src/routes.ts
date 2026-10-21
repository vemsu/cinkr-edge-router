export const PUBLIC_HOSTS = new Set(["cinkr.com", "www.cinkr.com", "hmi.cinkr.com", "hqd.cinkr.com", "richauto.cinkr.com", "mpg.cinkr.com", "staging.cinkr.com"]);

export type ProductRoute = "kinco" | "hqd" | "richauto" | "mpg";
export const PRODUCT_ROUTES: readonly ProductRoute[] = ["kinco", "hqd", "richauto", "mpg"];
export const LEGACY_HOST_PRODUCTS: Readonly<Record<string, ProductRoute>> = {
  "hmi.cinkr.com": "kinco",
  "hqd.cinkr.com": "hqd",
  "richauto.cinkr.com": "richauto",
  "mpg.cinkr.com": "mpg"
};

export function productRoute(pathname: string): ProductRoute | null {
  for (const route of PRODUCT_ROUTES) if (pathname === `/${route}` || pathname.startsWith(`/${route}/`)) return route;
  return null;
}

export function originFor(pathname: string, origins: Record<"main" | ProductRoute, string>): string {
  return origins[productRoute(pathname) ?? "main"];
}
