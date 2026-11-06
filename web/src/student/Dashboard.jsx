import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAppData } from '../shared/appData.jsx';
import { Icon } from '../shared/icons.jsx';
import { ApsShell } from './ApsShell.jsx';
import { AttendanceArt, BitesArt, HelpArt, MoodleArt } from './TileArt.jsx';

// S1: APSpace dashboard clone with the APBites Quick Access tile.

function initials(name = '') {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('');
}

function dayLabel(dateStr) {
  const d = new Date(`${dateStr}T12:00:00+08:00`);
  return d.toLocaleDateString('en-MY', { weekday: 'long', day: 'numeric', month: 'short', timeZone: 'Asia/Kuala_Lumpur' });
}

function ClassRow({ c }) {
  return (
    <li className="class-item">
      <div className="class-time">{c.start}<span>{c.end}</span></div>
      <div>
        <p className="class-module">{c.module}</p>
        <p className="class-meta">{c.moduleCode} · {c.room}</p>
      </div>
    </li>
  );
}

function Schedule({ timetable = [], today }) {
  const [tab, setTab] = useState('today');
  const todays = timetable.filter((c) => c.date === today);
  const upcoming = timetable.filter((c) => c.date > today);
  const upcomingDays = [...new Set(upcoming.map((c) => c.date))].slice(0, 3);

  return (
    <section className="card" aria-labelledby="sched-title">
      <h2 className="card-title" id="sched-title">My Schedule</h2>
      <div className="seg" role="group" aria-label="Schedule range">
        <button type="button" aria-pressed={tab === 'today'} onClick={() => setTab('today')}>Today</button>
        <button type="button" aria-pressed={tab === 'upcoming'} onClick={() => setTab('upcoming')}>Upcoming</button>
      </div>
      {tab === 'today' ? (
        todays.length ? (
          <ul className="class-list">{todays.map((c) => <ClassRow key={c.date + c.start} c={c} />)}</ul>
        ) : (
          <p className="muted">No classes today.</p>
        )
      ) : upcomingDays.length ? (
        upcomingDays.map((d) => (
          <div key={d}>
            <p className="class-day">{dayLabel(d)}</p>
            <ul className="class-list">
              {upcoming.filter((c) => c.date === d).map((c) => <ClassRow key={c.date + c.start} c={c} />)}
            </ul>
          </div>
        ))
      ) : (
        <p className="muted">No upcoming classes.</p>
      )}
    </section>
  );
}

export default function Dashboard() {
  const { student, now, loading, error } = useAppData();

  return (
    <ApsShell>
      <main className="aps-main">
        {error && <p className="notice error" role="alert">Can't reach the server. Is the emulator running?</p>}

        <section className="profile-row" aria-label="Profile">
          <div className="avatar" aria-hidden="true">{initials(student?.name || 'SS')}</div>
          <div>
            <p className="profile-name">{student?.name || (loading ? ' ' : 'SAMPLE STUDENT')}</p>
            <p className="profile-sub">{student ? `TP000000 | ${student.intake}` : ' '}</p>
          </div>
          <div className="profile-actions">
          <button className="hotline" type="button">
            <Icon name="phone" size={16} /> Emergency Hotline
          </button>
          <div className="profile-icons">
            <button className="icon-btn" type="button" aria-label="News"><Icon name="news" /></button>
            <button className="icon-btn" type="button" aria-label="Settings"><Icon name="settings" /></button>
            <button className="icon-btn" type="button" aria-label="Notifications, 3 unread">
              <Icon name="bell" /><span className="badge-dot" aria-hidden="true">3</span>
            </button>
            <button className="icon-btn" type="button" aria-label="Log out"><Icon name="logout" /></button>
          </div>
          </div>
        </section>

        <section className="card" aria-labelledby="qa-title">
          <h2 className="card-title" id="qa-title">Quick Access</h2>
          <div className="quick-grid">
            <Link className="tile" to="/student/bites">
              <span className="tile-new">NEW</span>
              <span className="tile-label">APBites</span>
              <BitesArt />
            </Link>
            <button className="tile" type="button">
              <span />
              <span className="tile-label">Sign Attendance</span>
              <AttendanceArt />
            </button>
            <button className="tile" type="button">
              <span />
              <span className="tile-label">Moodle</span>
              <MoodleArt />
            </button>
            <button className="tile" type="button">
              <span />
              <span className="tile-label">Help Centre</span>
              <HelpArt />
            </button>
          </div>
        </section>

        <Schedule timetable={student?.timetable} today={now.date} />
      </main>
    </ApsShell>
  );
}
