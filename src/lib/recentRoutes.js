const STORAGE_KEY = "kmb.recentRoutes";
const LIMIT = 5;

function parseEntry(item) {
  if (typeof item === "string") return { route: item, secondary: [] };
  if (!item || typeof item.route !== "string") return null;
  const secondary = Array.isArray(item.secondary)
    ? item.secondary.filter((route) => typeof route === "string")
    : [];
  return { route: item.route, secondary };
}

function entryKey(entry) {
  return `${entry.route}\n${entry.secondary.join(",")}`;
}

export function recentLabel(entry) {
  if (!entry.secondary.length) return entry.route;
  return `${entry.route} <=> ${entry.secondary.join("/")}`;
}

export function readRecent() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    if (!Array.isArray(parsed)) return [];
    return parsed.map(parseEntry).filter(Boolean).slice(0, LIMIT);
  } catch {
    return [];
  }
}

export function rememberRoute(route, secondary = []) {
  const entry = { route, secondary };
  const next = [entry, ...readRecent().filter((item) => entryKey(item) !== entryKey(entry))].slice(0, LIMIT);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return next;
}
