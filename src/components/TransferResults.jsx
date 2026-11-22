import { leftoverRemark, navLabel, sectionId, sectionTitle, shownInterchange, transferTime } from "../lib/transfer.js";
import { Chevron } from "./Chevron.jsx";

export function TransferResults({
  result,
  sections,
  status,
  message,
  openSectionId,
  onOpenSection,
  onToggleSection,
  openRows,
  onToggleRow,
}) {
  return (
    <>
      {sections.length > 0 && (
        <nav className="transfer-nav" aria-label="轉乘方向">
          {sections.map((section) => {
            const id = sectionId(section);
            return (
              <a key={id} href={`#${id}`} onClick={() => onOpenSection(id)}>
                {navLabel(result.route, section)}
              </a>
            );
          })}
        </nav>
      )}

      {status === "loading" && <p className="status">正在搜尋…</p>}
      {message && <h2 className="empty">{message}</h2>}

      {sections.map((section) => {
        const id = sectionId(section);
        const isOpen = openSectionId === id;
        return (
          <section className="result-block" id={id} key={id}>
            <h2>
              <button
                type="button"
                className="section-toggle"
                aria-expanded={isOpen}
                aria-controls={`${id}-panel`}
                onClick={() => onToggleSection(id)}
              >
                <span>{sectionTitle(result.route, section)}</span>
                <Chevron open={isOpen} />
              </button>
            </h2>
            {isOpen && (
              <ul className="transfer-list" id={`${id}-panel`}>
                {section.rows.map((row, index) => (
                  <TransferRow
                    key={`${id}-${index}`}
                    rowKey={`${id}-${index}`}
                    row={row}
                    even={index % 2 === 0}
                    open={Boolean(openRows[`${id}-${index}`])}
                    onToggle={onToggleRow}
                  />
                ))}
              </ul>
            )}
          </section>
        );
      })}
    </>
  );
}

function TransferRow({ rowKey, row, even, open, onToggle }) {
  const stop = shownInterchange(row.interchange);
  const remark = leftoverRemark(row.remark);
  const minutes = transferTime(row.remark);

  return (
    <li className={even ? "even" : undefined}>
      <button
        type="button"
        className="row-toggle"
        aria-expanded={open}
        aria-controls={`${rowKey}-details`}
        onClick={() => onToggle(rowKey)}
      >
        <span className="route">{row.route}</span>
        <span className="dest">{row.destination}</span>
        <Chevron open={open} />
      </button>
      {open && (
        <dl className="row-details" id={`${rowKey}-details`}>
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
}
