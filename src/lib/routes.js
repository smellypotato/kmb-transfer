export function normalizeToken(value) {
  return value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6);
}

export function suggestRoutes(routes, query, exclude = []) {
  if (!query) return [];
  const excluded = new Set(exclude);
  const starts = [];
  const includes = [];
  for (const route of routes) {
    if (excluded.has(route)) continue;
    if (route.startsWith(query)) starts.push(route);
    else if (route.includes(query)) includes.push(route);
    if (starts.length >= 12) break;
  }
  return [...starts, ...includes].slice(0, 12);
}
