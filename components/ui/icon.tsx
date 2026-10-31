/* Minimal Lucide-style line-icon set from the design (24 viewBox, 1.6 stroke). */
const ICONS = {
  grid: `<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/>`,
  inbox: `<path d="M4 12h4l2 3h4l2-3h4"/><path d="M4 12 6 4h12l2 8"/><path d="M4 12v6a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-6"/>`,
  file: `<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><polyline points="14 2 14 8 20 8"/>`,
  clock: `<circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 15.5 14"/>`,
  shield: `<path d="M12 21c6-2.5 8-7 8-12V6l-8-3-8 3v3c0 5 2 9.5 8 12Z"/>`,
  users: `<path d="M16 20v-1.5a3.5 3.5 0 0 0-3.5-3.5h-5A3.5 3.5 0 0 0 4 18.5V20"/><circle cx="9" cy="8" r="3.5"/><path d="M21 20v-1.5a3.2 3.2 0 0 0-2.2-3"/><path d="M15 4.6a3.5 3.5 0 0 1 0 6.8"/>`,
  sliders: `<line x1="4" y1="6" x2="20" y2="6"/><circle cx="14" cy="6" r="2"/><line x1="4" y1="12" x2="20" y2="12"/><circle cx="9" cy="12" r="2"/><line x1="4" y1="18" x2="20" y2="18"/><circle cx="16" cy="18" r="2"/>`,
  search: `<circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.2" y2="16.2"/>`,
  plus: `<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>`,
  pencil: `<path d="M4 20h4L18.5 9.5a2.1 2.1 0 0 0-3-3L5 17Z"/><line x1="13.5" y1="6.5" x2="17" y2="10"/>`,
  trash: `<path d="M4 7h16"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M6 7l1 13a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-13"/><path d="M9 7V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3"/>`,
  upload: `<path d="M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2"/><polyline points="7 9 12 4 17 9"/><line x1="12" y1="4" x2="12" y2="15"/>`,
  x: `<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>`,
  check: `<polyline points="4 12 9 17 20 6"/>`,
  checkCircle: `<circle cx="12" cy="12" r="9"/><polyline points="8.5 12.5 11 15 15.5 9"/>`,
  alertTriangle: `<path d="M10.6 3.9 2.5 18a1.8 1.8 0 0 0 1.6 2.7h15.8a1.8 1.8 0 0 0 1.6-2.7L13.4 3.9a1.8 1.8 0 0 0-2.8 0Z"/><line x1="12" y1="9.5" x2="12" y2="13.5"/><line x1="12" y1="16.5" x2="12" y2="16.6"/>`,
  alertOctagon: `<path d="M8 2h8l6 6v8l-6 6H8l-6-6V8Z"/><line x1="12" y1="8" x2="12" y2="12.5"/><line x1="12" y1="15.5" x2="12" y2="15.6"/>`,
  info: `<circle cx="12" cy="12" r="9"/><line x1="12" y1="16" x2="12" y2="11.5"/><line x1="12" y1="8" x2="12" y2="8.1"/>`,
  chevronDown: `<polyline points="6 9 12 15 18 9"/>`,
  chevronLeft: `<polyline points="15 6 9 12 15 18"/>`,
  building: `<rect x="4" y="3" width="16" height="18" rx="1"/><line x1="9" y1="7.5" x2="9" y2="7.51"/><line x1="15" y1="7.5" x2="15" y2="7.51"/><line x1="9" y1="11.5" x2="9" y2="11.51"/><line x1="15" y1="11.5" x2="15" y2="11.51"/><line x1="9" y1="15.5" x2="9" y2="15.51"/><line x1="15" y1="15.5" x2="15" y2="15.51"/>`,
  send: `<line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>`,
} as const;

export type IconName = keyof typeof ICONS;

export function Icon({ name, size = 20 }: { name: IconName; size?: number }) {
  return (
    <svg
      className="sv-icon"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      dangerouslySetInnerHTML={{ __html: ICONS[name] }}
    />
  );
}
