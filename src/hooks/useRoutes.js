import { useEffect, useMemo, useState } from "react";
import { fetchRoutes } from "../api.js";

export function useRoutes() {
  const [routes, setRoutes] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    fetchRoutes()
      .then((list) => {
        if (!cancelled) setRoutes(list);
      })
      .catch(() => {
        if (!cancelled) setError("暫時無法載入路線，請稍後再試。");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const routeSet = useMemo(() => new Set(routes), [routes]);
  return { routes, error, routeSet };
}
