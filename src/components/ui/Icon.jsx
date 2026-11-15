/*
 * Inline SVG icon set (24×24, 1.75 stroke, inherits currentColor).
 * Decorative by default; pass `label` when an icon is the only content.
 */
const PATHS = {
  discover: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path
        d="M12 7.8l1.25 2.6 2.85.38-2.08 1.98.52 2.82L12 14.24l-2.54 1.34.52-2.82-2.08-1.98 2.85-.38z"
        fill="currentColor"
        stroke="none"
      />
    </>
  ),
  explore: (
    <>
      <circle cx="11" cy="11" r="6.5" />
      <path d="M16 16l4.5 4.5" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="6.5" />
      <path d="M16 16l4.5 4.5" />
    </>
  ),
  frequency: <path d="M3 12h4l2.5-6 4 12 2.5-8 1.5 2H21" />,
  universe: <path d="M19.5 14.6A8 8 0 1 1 9.4 4.5a6.4 6.4 0 0 0 10.1 10.1z" />,
  close: <path d="M6.5 6.5l11 11M17.5 6.5l-11 11" />,
  play: <path d="M8 5.8v12.4a.6.6 0 0 0 .9.5l10-6.2a.6.6 0 0 0 0-1L8.9 5.3a.6.6 0 0 0-.9.5z" fill="currentColor" stroke="none" />,
  pause: <path d="M8 6.5v11M16 6.5v11" />,
  skipBack: <path d="M6 5v14M19 6.2v11.6a.6.6 0 0 1-.9.5l-9.5-5.8a.6.6 0 0 1 0-1l9.5-5.8a.6.6 0 0 1 .9.5z" />,
  skipForward: <path d="M18 5v14M5 6.2v11.6a.6.6 0 0 0 .9.5l9.5-5.8a.6.6 0 0 0 0-1L5.9 5.7a.6.6 0 0 0-.9.5z" />,
  visualiser: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="5.5" />
      <circle cx="12" cy="12" r="2" />
    </>
  ),
  headphones: (
    <>
      <path d="M4.5 13v-1a7.5 7.5 0 0 1 15 0v1" />
      <path d="M4.5 13h3v6h-1a2 2 0 0 1-2-2zM19.5 13h-3v6h1a2 2 0 0 0 2-2z" />
    </>
  ),
  plus: <path d="M12 5v14M5 12h14" />,
  check: <path d="M5 12.5l4.5 4.5L19 7.5" />,
  arrowRight: <path d="M5 12h14M13 6l6 6-6 6" />,
};

export default function Icon({ name, size = 20, label, className = '' }) {
  const content = PATHS[name];
  if (!content) return null;

  return (
    <svg
      className={`icon ${className}`}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      focusable="false"
    >
      {content}
    </svg>
  );
}
