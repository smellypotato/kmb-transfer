import { normalizeToken } from "./routes.js";

export const ROUTE_PATTERN = /^[A-Z0-9]{1,6}$/;
const SECONDARY_LIMIT = 20;

export function parseRouteList(values) {
  const routes = [];
  for (const value of values) {
    for (const part of String(value).split(",")) {
      const route = normalizeToken(part);
      if (!ROUTE_PATTERN.test(route) || routes.includes(route)) continue;
      routes.push(route);
      if (routes.length >= SECONDARY_LIMIT) return routes;
    }
  }
  return routes;
}

export function readUrlSearch() {
  const params = new URLSearchParams(window.location.search);
  if (!params.has("route")) return null;
  const route = normalizeToken(params.get("route") || "");
  if (!ROUTE_PATTERN.test(route)) return null;
  const secondary = parseRouteList(params.getAll("secondary")).filter((item) => item !== route);
  return { route, secondary };
}

export function urlMatchesSearch(route, secondary) {
  const current = readUrlSearch();
  if (!current || current.route !== route) return false;
  return current.secondary.join(",") === secondary.join(",");
}

export function writeUrlSearch(route, secondary) {
  const params = new URLSearchParams();
  params.set("route", route);
  for (const item of secondary) params.append("secondary", item);
  const next = `${window.location.pathname}?${params}${window.location.hash}`;
  const current = `${window.location.pathname}${window.location.search}${window.location.hash}`;
  if (current !== next) window.history.replaceState(null, "", next);
}
