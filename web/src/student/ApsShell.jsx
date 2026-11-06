import { Icon } from '../shared/icons.jsx';

// APSpace chrome: top bar (web) and bottom tab bar (mobile).
// Only Dashboard is live in the prototype; the other tabs belong to APSpace.

const TABS = [
  { id: 'timetable', label: 'Timetable', icon: 'calendar' },
  { id: 'attendance', label: 'Attendance', icon: 'checkCircle' },
  { id: 'dashboard', label: 'Dashboard', icon: 'grid' },
  { id: 'apcard', label: 'APCard', icon: 'card' },
  { id: 'more', label: 'More', icon: 'more' },
];

export function ApsShell({ children }) {
  return (
    <div className="aps">
      <header className="aps-top">
        <a className="aps-wordmark" href="/student"><b>AP</b>Space</a>
        <label className="aps-search">
          <Icon name="search" size={18} />
          <span className="sr-only">Search APSpace</span>
          <input placeholder="(S)earch APSpace" />
        </label>
        <div className="aps-top-spacer" />
        <nav className="aps-tabs" aria-label="APSpace">
          {TABS.map((t) => (
            <button key={t.id} type="button" aria-current={t.id === 'dashboard' ? 'page' : undefined}>
              {t.label}
            </button>
          ))}
        </nav>
      </header>

      {children}

      <button className="aida" type="button" aria-label="Ask AIDA, the APSpace assistant">
        <Icon name="chat" size={26} />
      </button>

      <nav className="aps-bottom" aria-label="APSpace">
        {TABS.map((t) => (
          <button key={t.id} type="button" aria-current={t.id === 'dashboard' ? 'page' : undefined}>
            <Icon name={t.icon} size={22} />
            {t.label}
          </button>
        ))}
      </nav>
    </div>
  );
}
