const STORAGE_KEY = "kmb.recentRoutes";
const LIMIT = 5;

export function readRecent() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item) => typeof item === "string").slice(0, LIMIT);
  } catch {
    return [];
  }
}

export function rememberRoute(route) {
  const next = [route, ...readRecent().filter((item) => item !== route)].slice(0, LIMIT);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return next;
}
