// Simple illustrations for the Quick Access tiles (decorative).

const common = { viewBox: '0 0 96 96', fill: 'none', 'aria-hidden': 'true', className: 'tile-art' };

export function BitesArt() {
  return (
    <svg {...common}>
      <ellipse cx="50" cy="78" rx="34" ry="6" fill="#000" opacity=".18" />
      <path d="M14 46h72c0 18-15 30-36 30S14 64 14 46z" fill="#fff" />
      <path d="M14 46h72" stroke="#c9bdfb" strokeWidth="4" strokeLinecap="round" />
      <path d="M30 56c6 6 34 6 40 0" stroke="#6d54d4" strokeWidth="3.5" strokeLinecap="round" />
      <path d="M38 36c-4-6 4-8 0-15M50 34c-4-6 4-8 0-15M62 36c-4-6 4-8 0-15" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" opacity=".85" />
      <path d="M66 14l14 30" stroke="#ffd27a" strokeWidth="4" strokeLinecap="round" />
      <path d="M74 12l10 30" stroke="#ffd27a" strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}

export function AttendanceArt() {
  return (
    <svg {...common}>
      <rect x="22" y="14" width="52" height="68" rx="8" fill="#fff" />
      <rect x="32" y="8" width="32" height="12" rx="5" fill="#c9bdfb" />
      <path d="M34 48l9 9 19-20" stroke="#6d54d4" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function MoodleArt() {
  return (
    <svg {...common}>
      <path d="M12 30l36-14 36 14-36 14z" fill="#fff" />
      <path d="M26 36v20c0 7 10 12 22 12s22-5 22-12V36L48 44z" fill="#c9bdfb" />
      <path d="M84 30v24" stroke="#fff" strokeWidth="4" strokeLinecap="round" />
      <circle cx="84" cy="58" r="4" fill="#ffd27a" />
    </svg>
  );
}

export function HelpArt() {
  return (
    <svg {...common}>
      <circle cx="50" cy="50" r="32" fill="#fff" />
      <circle cx="50" cy="50" r="14" fill="#6d54d4" />
      <path d="M50 18v18M50 64v18M18 50h18M64 50h18" stroke="#ff8a8a" strokeWidth="9" />
    </svg>
  );
}
