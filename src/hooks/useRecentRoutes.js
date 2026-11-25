import { useCallback, useState } from "react";
import { rememberRoute, readRecent } from "../lib/recentRoutes.js";

export function useRecentRoutes() {
  const [recent, setRecent] = useState(readRecent);

  const remember = useCallback((route, secondary = []) => {
    setRecent(rememberRoute(route, secondary));
  }, []);

  return { recent, remember };
}
