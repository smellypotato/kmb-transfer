import { useEffect, useMemo, useRef, useState } from "react";
import { FiClock, FiSearch, FiShare2, FiX } from "react-icons/fi";
import { recentLabel } from "../lib/recentRoutes.js";
import { normalizeToken, suggestRoutes } from "../lib/routes.js";
import { urlMatchesSearch } from "../lib/searchQuery.js";
import { RouteCombo } from "./RouteCombo.jsx";

const SECONDARY_LIMIT = 20;

async function copyUrl(url) {
  if (navigator.clipboard?.writeText) {
    try {
      const pending = navigator.clipboard.writeText(url);
      pending.catch(() => {});
      const timeout = new Promise((_, reject) => {
        window.setTimeout(() => reject(new Error("timeout")), 1000);
      });
      await Promise.race([pending, timeout]);
      return true;
    } catch {
      // The clipboard API can reject when the page is not allowed to write.
    }
  }
  try {
    const input = document.createElement("textarea");
    input.value = url;
    input.setAttribute("readonly", "");
    input.style.position = "fixed";
    input.style.left = "-9999px";
    document.body.appendChild(input);
    input.select();
    const copiedOk = document.execCommand("copy");
    input.remove();
    return copiedOk;
  } catch {
    return false;
  }
}

export function SearchPanel({
  routes,
  routeSet,
  routesError,
  query,
  onQueryChange,
  secondary,
  onSecondaryChange,
  searching,
  recent,
  onSearch,
}) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [secondaryQuery, setSecondaryQuery] = useState("");
  const [copied, setCopied] = useState(false);
  const [secondaryOpen, setSecondaryOpen] = useState(false);
  const [secondaryActive, setSecondaryActive] = useState(0);
  const routeComboRef = useRef(null);
  const secondaryComboRef = useRef(null);

  useEffect(() => {
    if (!open && !secondaryOpen) return undefined;
    function onPointerDown(event) {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (open && !routeComboRef.current?.contains(target)) setOpen(false);
      if (secondaryOpen && !secondaryComboRef.current?.contains(target)) setSecondaryOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open, secondaryOpen]);

  const suggestions = useMemo(() => suggestRoutes(routes, query), [query, routes]);
  const secondarySuggestions = useMemo(
    () => suggestRoutes(routes, secondaryQuery, secondary),
    [secondaryQuery, routes, secondary],
  );

  function addSecondary(tokens) {
    onSecondaryChange((current) => {
      const next = [...current];
      for (const token of tokens) {
        const route = normalizeToken(token);
        if (!route || !routeSet.has(route) || next.includes(route)) continue;
        if (next.length >= SECONDARY_LIMIT) break;
        next.push(route);
      }
      return next;
    });
  }

  function commitSecondary(routesToSearch) {
    const pending = routeSet.has(secondaryQuery) ? secondaryQuery : "";
    if (!pending || routesToSearch.includes(pending)) return routesToSearch;
    addSecondary([pending]);
    setSecondaryQuery("");
    setSecondaryOpen(false);
    return [...routesToSearch, pending];
  }

  function submit(route, secondaryRoutes = secondary) {
    const filters = commitSecondary(secondaryRoutes);
    setOpen(false);
    onSearch(route, filters);
  }

  async function share() {
    const url = window.location.href;
    const copiedOk = await copyUrl(url);
    if (!copiedOk) return;
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  function onChange(event) {
    onQueryChange(normalizeToken(event.target.value));
    setOpen(true);
    setActiveIndex(0);
  }

  function onKeyDown(event) {
    if (event.key === "ArrowDown" && suggestions.length > 0) {
      event.preventDefault();
      setOpen(true);
      setActiveIndex((index) => (index + 1) % suggestions.length);
      return;
    }
    if (event.key === "ArrowUp" && suggestions.length > 0) {
      event.preventDefault();
      setOpen(true);
      setActiveIndex((index) => (index - 1 + suggestions.length) % suggestions.length);
      return;
    }
    if (event.key === "Escape") {
      setOpen(false);
      return;
    }
    if (event.key !== "Enter") return;
    event.preventDefault();
    if (!routes.length) return;
    const highlighted = open ? suggestions[activeIndex] : undefined;
    if (routeSet.has(query)) submit(query);
    else if (highlighted) submit(highlighted);
    else submit(query);
  }

  function onSecondaryInput(event) {
    const raw = event.target.value.toUpperCase();
    if (raw.includes(",")) {
      const parts = raw.split(",");
      const pending = parts.pop() ?? "";
      addSecondary(parts);
      setSecondaryQuery(normalizeToken(pending));
    } else {
      setSecondaryQuery(normalizeToken(raw));
    }
    setSecondaryOpen(true);
    setSecondaryActive(0);
  }

  function onSecondaryKeyDown(event) {
    if (event.key === "ArrowDown" && secondarySuggestions.length > 0) {
      event.preventDefault();
      setSecondaryOpen(true);
      setSecondaryActive((index) => (index + 1) % secondarySuggestions.length);
      return;
    }
    if (event.key === "ArrowUp" && secondarySuggestions.length > 0) {
      event.preventDefault();
      setSecondaryOpen(true);
      setSecondaryActive((index) => (index - 1 + secondarySuggestions.length) % secondarySuggestions.length);
      return;
    }
    if (event.key === "Escape") {
      setSecondaryOpen(false);
      return;
    }
    if (event.key === "Backspace" && !secondaryQuery && secondary.length > 0) {
      onSecondaryChange((current) => current.slice(0, -1));
      return;
    }
    if (event.key !== "Enter") return;
    event.preventDefault();
    const typed = normalizeToken(event.currentTarget.value);
    const highlighted = secondaryOpen ? secondarySuggestions[secondaryActive] : undefined;
    const candidate = routeSet.has(typed)
      ? typed
      : highlighted && routeSet.has(highlighted)
        ? highlighted
        : "";
    if (!candidate) return;
    addSecondary([candidate]);
    setSecondaryQuery("");
    setSecondaryOpen(false);
  }

  return (
    <section className="search-panel">
      <div className="search-box">
        <RouteCombo
          rootRef={routeComboRef}
          id="routeno"
          label="路線"
          listId="route-suggestions"
          listLabel="建議路線"
          placeholder="請選擇路線"
          value={query}
          open={open}
          suggestions={suggestions}
          activeIndex={activeIndex}
          onChange={onChange}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          onClose={() => setOpen(false)}
          onSelect={submit}
        />
        <div className="secondary">
          <div className="chip-field">
            {secondary.map((route) => (
              <span className="chip" key={route}>
                {route}
                <button
                  type="button"
                  aria-label={`移除 ${route}`}
                  onClick={() => onSecondaryChange((current) => current.filter((item) => item !== route))}
                >
                  <FiX aria-hidden="true" />
                </button>
              </span>
            ))}
            <RouteCombo
              rootRef={secondaryComboRef}
              id="secondary-routes"
              label="轉乘路線"
              listId="secondary-suggestions"
              listLabel="建議轉乘路線"
              placeholder={secondary.length ? "" : "轉乘路線（可選）"}
              value={secondaryQuery}
              open={secondaryOpen}
              suggestions={secondarySuggestions}
              activeIndex={secondaryActive}
              onChange={onSecondaryInput}
              onFocus={() => setSecondaryOpen(true)}
              onKeyDown={onSecondaryKeyDown}
              onClose={() => setSecondaryOpen(false)}
              onSelect={(route) => {
                addSecondary([route]);
                setSecondaryQuery("");
                setSecondaryOpen(false);
              }}
            />
          </div>
        </div>
        <div className="search-actions">
          <button
            type="button"
            className="search-button"
            disabled={!routes.length || searching}
            onClick={() => submit(query)}
          >
            <FiSearch aria-hidden="true" />
            搜尋
          </button>
          <button
            type="button"
            className="share-button"
            disabled={!urlMatchesSearch(query, secondary)}
            onClick={share}
          >
            <FiShare2 aria-hidden="true" />
            {copied ? "已複製" : "分享"}
          </button>
        </div>
      </div>
      {routesError && <p className="status error">{routesError}</p>}
      {!routes.length && !routesError && <p className="status">正在載入路線…</p>}
      {recent.length > 0 && (
        <div className="recent">
          <span>
            <FiClock aria-hidden="true" />
            最近搜尋
          </span>
          {recent.map((entry) => (
            <button
              key={`${entry.route}|${entry.secondary.join(",")}`}
              type="button"
              onClick={() => {
                setSecondaryQuery("");
                setSecondaryOpen(false);
                setOpen(false);
                onSearch(entry.route, entry.secondary);
              }}
            >
              {recentLabel(entry)}
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
