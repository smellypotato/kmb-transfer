import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { fetchTransfer } from "../api.js";
import { normalizeToken } from "../lib/routes.js";
import { readRecent } from "../lib/recentRoutes.js";
import { ROUTE_PATTERN, readUrlSearch, writeUrlSearch } from "../lib/searchQuery.js";
import { visibleSections } from "../lib/transfer.js";
import { useRecentRoutes } from "./useRecentRoutes.js";

function openingSearch() {
  if (new URLSearchParams(window.location.search).has("route")) return readUrlSearch();
  return readRecent()[0] ?? null;
}

function transferRoutesOf(route, filters) {
  return filters
    .map(normalizeToken)
    .filter((item, index, list) => ROUTE_PATTERN.test(item) && item !== route && list.indexOf(item) === index);
}

export function useTransferSearch() {
  const { recent, remember } = useRecentRoutes();
  const [opening] = useState(openingSearch);
  const [query, setQuery] = useState(opening?.route ?? "");
  const [secondary, setSecondary] = useState(opening?.secondary ?? []);
  const [result, setResult] = useState(null);
  const [openSectionId, setOpenSectionId] = useState(null);
  const [openRows, setOpenRows] = useState({});
  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("");
  const request = useRef(0);

  const search = useCallback(
    async (route, filters = []) => {
      const normalized = normalizeToken(route);
      const transferRoutes = transferRoutesOf(normalized, filters);
      setQuery(normalized);
      setSecondary(transferRoutes);
      if (!ROUTE_PATTERN.test(normalized)) {
        setResult(null);
        setOpenSectionId(null);
        setOpenRows({});
        setStatus("empty");
        setMessage("沒有轉乘計劃");
        return;
      }

      writeUrlSearch(normalized, transferRoutes);
      const requestId = request.current + 1;
      request.current = requestId;
      setStatus("loading");
      setMessage("");
      setResult(null);
      setOpenSectionId(null);
      setOpenRows({});
      try {
        const data = await fetchTransfer(normalized, transferRoutes);
        if (request.current !== requestId) return;
        const hasRows = Boolean(data?.sections.some((section) => section.rows.length > 0));
        setResult(hasRows ? data : null);
        setStatus(hasRows ? "ready" : "empty");
        setMessage(hasRows ? "" : "沒有轉乘計劃");
        if (data) remember(normalized, transferRoutes);
      } catch {
        if (request.current !== requestId) return;
        setResult(null);
        setStatus("error");
        setMessage("搜尋失敗，請稍後再試。");
      }
    },
    [remember],
  );

  useEffect(() => {
    if (opening) search(opening.route, opening.secondary);
  }, [opening, search]);

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
    secondary,
    setSecondary,
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
