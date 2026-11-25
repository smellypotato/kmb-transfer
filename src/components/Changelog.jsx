import { useEffect, useRef, useState } from "react";
import { FiX } from "react-icons/fi";
import { changelog } from "../changelog.js";

const SEEN_KEY = "kmb.changelogSeen";
const latest = changelog[0]?.date ?? "";

function lastSeen() {
  try {
    return localStorage.getItem(SEEN_KEY) || "";
  } catch {
    return "";
  }
}

export function Changelog() {
  const [open, setOpen] = useState(() => Boolean(latest) && lastSeen() !== latest);
  const buttonRef = useRef(null);
  const dialogRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    try {
      localStorage.setItem(SEEN_KEY, latest);
    } catch {
      // The popup still works if storage is unavailable.
    }
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialogRef.current?.focus();
    function onKey(event) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKey);
      buttonRef.current?.focus();
    };
  }, [open]);

  return (
    <>
      <button ref={buttonRef} type="button" className="changelog-button" onClick={() => setOpen(true)}>
        更新記錄
      </button>
      {open && (
        <div className="changelog-backdrop" onClick={() => setOpen(false)}>
          <div
            ref={dialogRef}
            className="changelog-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="changelog-title"
            tabIndex={-1}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="changelog-dialog-bar">
              <h2 id="changelog-title">更新記錄</h2>
              <button type="button" aria-label="關閉" onClick={() => setOpen(false)}>
                <FiX aria-hidden="true" />
              </button>
            </div>
            <div className="changelog-dialog-body">
              {changelog.map((entry) => (
                <article key={entry.date}>
                  <h3>
                    <time dateTime={entry.date}>{entry.date}</time>
                    <span>{entry.target}</span>
                  </h3>
                  <ul>
                    {entry.items.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
