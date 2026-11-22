export function RouteCombo({
  rootRef,
  id,
  label,
  listId,
  listLabel,
  placeholder,
  value,
  open,
  suggestions,
  activeIndex,
  onChange,
  onFocus,
  onKeyDown,
  onClose,
  onSelect,
}) {
  return (
    <div
      className="combo"
      ref={rootRef}
      onBlur={(event) => {
        const next = event.relatedTarget;
        if (!(next instanceof Node) || event.currentTarget.contains(next)) return;
        onClose();
      }}
    >
      <input
        id={id}
        aria-label={label}
        aria-autocomplete="list"
        aria-controls={listId}
        aria-expanded={open && suggestions.length > 0}
        placeholder={placeholder}
        value={value}
        autoCapitalize="characters"
        onChange={onChange}
        onFocus={onFocus}
        onKeyDown={onKeyDown}
      />
      {open && suggestions.length > 0 && (
        <ul id={listId} role="listbox" aria-label={listLabel}>
          {suggestions.map((route, index) => (
            <li key={route} role="presentation">
              <button
                type="button"
                role="option"
                aria-selected={index === activeIndex}
                className={index === activeIndex ? "active" : undefined}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => onSelect(route)}
              >
                {route}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
