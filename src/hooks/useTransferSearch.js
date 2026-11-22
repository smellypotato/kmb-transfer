import { useCallback, useMemo, useState } from "react";
import { fetchTransfer } from "../api.js";
import { visibleSections } from "../lib/transfer.js";
import { useRecentRoutes } from "./useRecentRoutes.js";

export function useTransferSearch(routeSet) {
  const { recent, remember } = useRecentRoutes();
  const [query, setQuery] = useState("");
  const [result, setResult] = useState(null);
  const [openSectionId, setOpenSectionId] = useState(null);
  const [openRows, setOpenRows] = useState({});
  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("");

  const search = useCallback(
    async (route, filters = []) => {
      const normalized = route.trim().toUpperCase();
      setQuery(normalized);
      if (!routeSet.has(normalized)) {
        setResult(null);
        setStatus("empty");
        setMessage("沒有轉乘計劃");
        return;
      }
      setStatus("loading");
      setMessage("");
      setResult(null);
      setOpenSectionId(null);
      setOpenRows({});
      try {
        const data = await fetchTransfer(normalized, filters);
        const hasRows = Boolean(data?.sections.some((section) => section.rows.length > 0));
        setResult(hasRows ? data : null);
        setStatus(hasRows ? "ready" : "empty");
        setMessage(hasRows ? "" : "沒有轉乘計劃");
        if (data) remember(normalized);
      } catch {
        setResult(null);
        setStatus("error");
        setMessage("搜尋失敗，請稍後再試。");
      }
    },
    [routeSet, remember],
  );

  const sections = useMemo(() => visibleSections(result), [result]);

  const toggleSection = useCallback((id) => {
    setOpenSectionId((current) => (current === id ? null : id));
  }, []);

  const openSection = useCallback((id) => {
    setOpenSectionId(id);
  }, []);

  const toggleRow = useCallback((key) => {
    setOpenRows((current) => ({ ...current, [key]: !current[key] }));
  }, []);

  return {
    query,
    setQuery,
    result,
    status,
    message,
    sections,
    openSectionId,
    openSection,
    toggleSection,
    openRows,
    toggleRow,
    search,
    recent,
  };
}
