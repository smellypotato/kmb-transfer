const TRANSFER_MINUTES = { "^": 30, "#": 60, "*": 90, "@": 120 };
const GENERIC_STOP = "任何能接駁第二程路線的巴士站";

export function transferTime(remark) {
  for (const symbol of Object.keys(TRANSFER_MINUTES)) {
    if ((remark ?? "").includes(symbol)) return TRANSFER_MINUTES[symbol];
  }
  return 150;
}

export function leftoverRemark(remark) {
  return (remark ?? "").replace(/[\^#*@]/g, "").replace(/\s+/g, " ").trim();
}

export function shownInterchange(value) {
  const text = (value ?? "").trim();
  return text === GENERIC_STOP ? "" : text;
}

export function sectionId(section) {
  return `transfer-${section.bound}-${section.leg}`;
}

export function sectionTitle(route, section) {
  const label = `${route} (往 ${section.destination})`;
  if (section.leg === 1) return `${label} => 下一程`;
  return `上一程 => ${label}`;
}

export function navLabel(route, section) {
  if (section.leg === 1) return `${route} ${section.destination} =>`;
  return `=> ${route} ${section.destination}`;
}

export function visibleSections(result) {
  return result?.sections.filter((section) => section.rows.length > 0) ?? [];
}
