import { useCallback, useState } from "react";
import { readRecent, rememberRoute } from "../lib/recentRoutes.js";

export function useRecentRoutes() {
  const [recent, setRecent] = useState(readRecent);
  const remember = useCallback((route) => {
    setRecent(rememberRoute(route));
  }, []);
  return { recent, remember };
}
