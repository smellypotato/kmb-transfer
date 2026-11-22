import { useEffect, useMemo, useRef, useState } from "react";
import { FiChevronDown, FiChevronRight, FiClock, FiExternalLink, FiSearch, FiX } from "react-icons/fi";
import { fetchRoutes, fetchTransfer } from "./api.js";

function Chevron({ open }) {
  const Icon = open ? FiChevronDown : FiChevronRight;
  return <Icon className="chevron" aria-hidden="true" />;
}

const STORAGE_KEY = "kmb.recentRoutes";

function readRecent() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item) => typeof item === "string").slice(0, 5);
  } catch {
    return [];
  }
}

function rememberRoute(route) {
  const next = [route, ...readRecent().filter((item) => item !== route)].slice(0, 5);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return next;
}

function normalizeToken(value) {
  return value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6);
}

function suggestRoutes(routes, query, exclude) {
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

const TRANSFER_MINUTES = { "^": 30, "#": 60, "*": 90, "@": 120 };

function transferTime(remark) {
  for (const symbol of Object.keys(TRANSFER_MINUTES)) {
    if ((remark ?? "").includes(symbol)) return TRANSFER_MINUTES[symbol];
  }
  return 150;
}

function leftoverRemark(remark) {
  return (remark ?? "").replace(/[\^#*@]/g, "").replace(/\s+/g, " ").trim();
}

const GENERIC_STOP = "任何能接駁第二程路線的巴士站";

function shownInterchange(value) {
  const text = (value ?? "").trim();
  return text === GENERIC_STOP ? "" : text;
}

function sectionId(section) {
  return `transfer-${section.bound}-${section.leg}`;
}

function sectionTitle(route, section) {
  const label = `${route} (往 ${section.destination})`;
  if (section.leg === 1) return `${label} => 下一程`;
  return `上一程 => ${label}`;
}

function navLabel(route, section) {
  if (section.leg === 1) return `${route} ${section.destination} =>`;
  return `=> ${route} ${section.destination}`;
}

export default function App() {
  const [routes, setRoutes] = useState([]);
  const [routesError, setRoutesError] = useState("");
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [secondary, setSecondary] = useState([]);
  const [secondaryQuery, setSecondaryQuery] = useState("");
  const [secondaryOpen, setSecondaryOpen] = useState(false);
  const [secondaryActive, setSecondaryActive] = useState(0);
  const [recent, setRecent] = useState(readRecent);
  const [result, setResult] = useState(null);
  const [collapsed, setCollapsed] = useState({});
  const [openRows, setOpenRows] = useState({});
  const [introOpen, setIntroOpen] = useState(false);
  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("");
  const routeComboRef = useRef(null);
  const secondaryComboRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    fetchRoutes()
      .then((list) => {
        if (!cancelled) setRoutes(list);
      })
      .catch(() => {
        if (!cancelled) setRoutesError("暫時無法載入路線，請稍後再試。");
      });
    return () => {
      cancelled = true;
    };
  }, []);

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

  const routeSet = useMemo(() => new Set(routes), [routes]);
  const suggestions = useMemo(
    () => suggestRoutes(routes, query, []),
    [query, routes],
  );
  const secondarySuggestions = useMemo(
    () => suggestRoutes(routes, secondaryQuery, secondary),
    [secondaryQuery, routes, secondary],
  );

  function addSecondary(tokens) {
    setSecondary((current) => {
      const next = [...current];
      for (const token of tokens) {
        const route = normalizeToken(token);
        if (!route || !routeSet.has(route) || next.includes(route)) continue;
        if (next.length >= 20) break;
        next.push(route);
      }
      return next;
    });
  }

  function commitSecondary(routesToSearch) {
    const pending = routeSet.has(secondaryQuery) ? secondaryQuery : "";
    if (!pending || routesToSearch.includes(pending)) {
      return routesToSearch;
    }
    addSecondary([pending]);
    setSecondaryQuery("");
    setSecondaryOpen(false);
    return [...routesToSearch, pending];
  }

  async function search(route, secondaryRoutes = secondary) {
    const normalized = route.trim().toUpperCase();
    const filters = commitSecondary(secondaryRoutes);
    setQuery(normalized);
    setOpen(false);
    if (!routeSet.has(normalized)) {
      setResult(null);
      setStatus("empty");
      setMessage("沒有轉乘計劃");
      return;
    }
    setStatus("loading");
    setMessage("");
    setResult(null);
    setCollapsed({});
    setOpenRows({});
    try {
      const data = await fetchTransfer(normalized, filters);
      const hasRows = Boolean(data?.sections.some((section) => section.rows.length > 0));
      setResult(hasRows ? data : null);
      setStatus(hasRows ? "ready" : "empty");
      setMessage(hasRows ? "" : "沒有轉乘計劃");
      if (data) setRecent(rememberRoute(normalized));
    } catch {
      setResult(null);
      setStatus("error");
      setMessage("搜尋失敗，請稍後再試。");
    }
  }

  function onChange(event) {
    setQuery(normalizeToken(event.target.value));
    setOpen(true);
    setActiveIndex(0);
  }

  function onSecondaryChange(event) {
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
      setSecondary((current) => current.slice(0, -1));
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
    if (event.key === "Enter") {
      event.preventDefault();
      if (!routes.length) return;
      const highlighted = open ? suggestions[activeIndex] : undefined;
      if (routeSet.has(query)) search(query);
      else if (highlighted) search(highlighted);
      else search(query);
    }
  }

  const visibleSections = result?.sections.filter((section) => section.rows.length > 0) ?? [];

  function toggleSection(id) {
    setCollapsed((current) => ({ ...current, [id]: !current[id] }));
  }

  function openSection(id) {
    setCollapsed((current) => (current[id] ? { ...current, [id]: false } : current));
  }

  function toggleRow(key) {
    setOpenRows((current) => ({ ...current, [key]: !current[key] }));
  }

  return (
    <main className="page">
      <header className={introOpen ? "intro is-open" : "intro"}>
        <h1>
          <button
            type="button"
            className="section-toggle"
            aria-expanded={introOpen}
            aria-controls="intro-body"
            onClick={() => setIntroOpen((current) => !current)}
          >
            <span>八達通及電子支付巴士轉乘計劃</span>
            <Chevron open={introOpen} />
          </button>
        </h1>
        {introOpen && (
          <div id="intro-body">
            <p>
              九巴的八達通及電子支付巴士轉乘計劃，為乘客提供第二程接駁巴士的車資折扣優惠，乘客以優惠車資接駁至目的地，更充份善用九巴龐大的巴士服務網絡。
            </p>
            <p>
              教學說明：乘客可先在「搜尋」一欄輸入首程乘搭的路線，再視乎路線方向，於首個或第二個選項列「第一程」中查閱第二程路線、建議轉乘地點和車資優惠。
            </p>
            <p>
              例子：乘客由油塘出發，前往葵盛（東），首程選擇先於油塘乘搭路線33前往荃灣西站，乘客可於「搜尋」一欄輸入33，再選擇首個項列，即「第一程乘搭33往荃灣西站，轉乘下列第二程路線」，可以查閱到前往葵盛（東）的路線為38，建議轉乘巴士站為黃大仙轉車站, 沙田坳道(D1)，並可享有$4.2車資優惠。
            </p>
          </div>
        )}
      </header>

      <section className="search-panel">
        <div className="search-box">
          <div
            className="combo"
            ref={routeComboRef}
            onBlur={(event) => {
              const next = event.relatedTarget;
              if (!(next instanceof Node) || event.currentTarget.contains(next)) return;
              setOpen(false);
            }}
          >
            <input
              id="routeno"
              aria-label="路線"
              aria-autocomplete="list"
              aria-controls="route-suggestions"
              aria-expanded={open && suggestions.length > 0}
              placeholder="請選擇路線"
              value={query}
              autoCapitalize="characters"
              onChange={onChange}
              onFocus={() => setOpen(true)}
              onKeyDown={onKeyDown}
            />
            {open && suggestions.length > 0 && (
              <ul id="route-suggestions" role="listbox" aria-label="建議路線">
                {suggestions.map((route, index) => (
                  <li key={route} role="presentation">
                    <button
                      type="button"
                      role="option"
                      aria-selected={index === activeIndex}
                      className={index === activeIndex ? "active" : undefined}
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => search(route)}
                    >
                      {route}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        <div className="secondary">
          <div className="chip-field">
            {secondary.map((route) => (
              <span className="chip" key={route}>
                {route}
                <button
                  type="button"
                  aria-label={`移除 ${route}`}
                  onClick={() => setSecondary((current) => current.filter((item) => item !== route))}
                >
                  <FiX aria-hidden="true" />
                </button>
              </span>
            ))}
            <div
              className="combo"
              ref={secondaryComboRef}
              onBlur={(event) => {
                const next = event.relatedTarget;
                if (!(next instanceof Node) || event.currentTarget.contains(next)) return;
                setSecondaryOpen(false);
              }}
            >
              <input
                id="secondary-routes"
                aria-label="轉乘路線"
                aria-autocomplete="list"
                aria-controls="secondary-suggestions"
                aria-expanded={secondaryOpen && secondarySuggestions.length > 0}
                placeholder={secondary.length ? "" : "轉乘路線（可選）"}
                value={secondaryQuery}
                autoCapitalize="characters"
                onChange={onSecondaryChange}
                onFocus={() => setSecondaryOpen(true)}
                onKeyDown={onSecondaryKeyDown}
              />
              {secondaryOpen && secondarySuggestions.length > 0 && (
                <ul id="secondary-suggestions" role="listbox" aria-label="建議轉乘路線">
                  {secondarySuggestions.map((route, index) => (
                    <li key={route} role="presentation">
                      <button
                        type="button"
                        role="option"
                        aria-selected={index === secondaryActive}
                        className={index === secondaryActive ? "active" : undefined}
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() => {
                          addSecondary([route]);
                          setSecondaryQuery("");
                          setSecondaryOpen(false);
                        }}
                      >
                        {route}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
          <button
            type="button"
            className="search-button"
            disabled={!routes.length || status === "loading"}
            onClick={() => search(query)}
          >
            <FiSearch aria-hidden="true" />
            搜尋
          </button>
        </div>
        {routesError && <p className="status error">{routesError}</p>}
        {!routes.length && !routesError && <p className="status">正在載入路線…</p>}
        {recent.length > 0 && (
          <div className="recent">
            <span>
              <FiClock aria-hidden="true" />
              最近搜尋
            </span>
            {recent.map((route) => (
              <button
                key={route}
                type="button"
                disabled={!routes.length || status === "loading"}
                onClick={() => search(route)}
              >
                {route}
              </button>
            ))}
          </div>
        )}
      </section>

      {visibleSections.length > 0 && (
        <nav className="transfer-nav" aria-label="轉乘方向">
          {visibleSections.map((section) => {
            const id = sectionId(section);
            return (
              <a key={id} href={`#${id}`} onClick={() => openSection(id)}>
                {navLabel(result.route, section)}
              </a>
            );
          })}
        </nav>
      )}

      {status === "loading" && <p className="status">正在搜尋…</p>}
      {message && <h2 className="empty">{message}</h2>}

      {visibleSections.map((section) => {
        const id = sectionId(section);
        const isOpen = !collapsed[id];
        return (
          <section className="result-block" id={id} key={id}>
            <h2>
              <button
                type="button"
                className="section-toggle"
                aria-expanded={isOpen}
                aria-controls={`${id}-panel`}
                onClick={() => toggleSection(id)}
              >
                <span>{sectionTitle(result.route, section)}</span>
                <Chevron open={isOpen} />
              </button>
            </h2>
            {isOpen && (
              <ul className="transfer-list" id={`${id}-panel`}>
                {section.rows.map((row, index) => {
                  const key = `${id}-${index}`;
                  const rowOpen = Boolean(openRows[key]);
                  const stop = shownInterchange(row.interchange);
                  const remark = leftoverRemark(row.remark);
                  const minutes = transferTime(row.remark);
                  return (
                    <li className={index % 2 === 0 ? "even" : undefined} key={key}>
                      <button
                        type="button"
                        className="row-toggle"
                        aria-expanded={rowOpen}
                        aria-controls={`${key}-details`}
                        onClick={() => toggleRow(key)}
                      >
                        <span className="route">{row.route}</span>
                        <span className="dest">{row.destination}</span>
                        <Chevron open={rowOpen} />
                      </button>
                      {rowOpen && (
                        <dl className="row-details" id={`${key}-details`}>
                          {stop && (
                            <div>
                              <dt>建議轉乘巴士站</dt>
                              <dd>{stop}</dd>
                            </div>
                          )}
                          <div>
                            <dt>第二程應繳車費或最高優惠</dt>
                            <dd>{row.discount}</dd>
                          </div>
                          <div>
                            <dt>最高連續轉乘</dt>
                            <dd>{row.maxInterchange}</dd>
                          </div>
                          <div>
                            <dt>轉乘時間(分鐘)</dt>
                            <dd>{minutes}</dd>
                          </div>
                          {remark && (
                            <div>
                              <dt>備註</dt>
                              <dd>{remark}</dd>
                            </div>
                          )}
                          {row.detail && (
                            <div>
                              <dt>詳情</dt>
                              <dd className="detail">{row.detail}</dd>
                            </div>
                          )}
                        </dl>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        );
      })}

      <footer className="notes">
        <p>
          乘客用八達通卡或電子支付方式繳付第一程車資後，除個別符號之指定時間外，乘客可於指定時間內以同一張八達通卡或電子支付方式繳付第二程車資，享受巴士轉乘優惠。!代表「適用於塘尾道或以後乘搭2A線之乘客」。
        </p>
        <p>
          <a href="https://www.kmb.hk/interchange_condition.html" target="_blank" rel="noreferrer">
            請按此參閱八達通及電子支付巴士轉乘須知
            <FiExternalLink aria-hidden="true" />
          </a>
        </p>
      </footer>
    </main>
  );
}
