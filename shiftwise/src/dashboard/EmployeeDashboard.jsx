
import { useEffect, useMemo, useState } from 'react';
import { NavLink, useNavigate, useParams } from 'react-router-dom';
import {
  LayoutDashboard, CalendarDays, CalendarPlus, ArrowLeftRight,
  Sun, Clock, Bell, User, Settings, LogOut, Search, Menu,
  ChevronDown, Check
} from 'lucide-react';

import './employeedashboard.css';

import {
  MY_SHIFTS, OPEN_SHIFTS, SWAPS, LEAVES,
  NOTIFS, ATT, TODAY, fmt
} from './data';

import { Skeleton } from './ui';

import {
  Overview, Schedule, Available, Swaps, Leave,
  Attendance, Notifications, Profile, Prefs
} from './sections';

const NAV = [
  ['overview', 'Overview', LayoutDashboard],
  ['schedule', 'My Schedule', CalendarDays],
  ['available', 'Available Shifts', CalendarPlus],
  ['swaps', 'Shift Swap Requests', ArrowLeftRight],
  ['leave', 'Leave & Time Off', Sun],
  ['attendance', 'Attendance', Clock],
  ['notifications', 'Notifications', Bell],
  ['profile', 'My Profile', User],
  ['settings', 'Settings', Settings],
];

const PAGES = {
  overview: Overview,
  schedule: Schedule,
  available: Available,
  swaps: Swaps,
  leave: Leave,
  attendance: Attendance,
  notifications: Notifications,
  profile: Profile,
  settings: Prefs
};

const hour = new Date().getHours();

const GREET =
  hour < 12 ? 'Good morning' :
  hour < 18 ? 'Good afternoon' :
  'Good evening';

export default function EmployeeDashboard() {
  const { section = 'overview' } = useParams();
  const nav = useNavigate();

  const [loading, setLoading] = useState(true);
  const [side, setSide] = useState(false);
  const [menu, setMenu] = useState(null);
  const [q, setQ] = useState('');
  const [toasts, setToasts] = useState([]);

  const user = JSON.parse(
    localStorage.getItem('shiftwiseUser') || '{}'
  );

  const NAME = user.name || 'Employee';
  const EMAIL = user.email || '';
  const INITIALS = NAME
    .trim()
    .split(/\s+/)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const [shifts, setShifts] = useState(MY_SHIFTS);
  const [open, setOpen] = useState(OPEN_SHIFTS);
  const [swaps, setSwaps] = useState(SWAPS);
  const [leaves, setLeaves] = useState(LEAVES);
  const [notifs, setNotifs] = useState(NOTIFS);
  const [att, setAtt] = useState(ATT);

  useEffect(() => {
    document.title = 'Dashboard · ShiftWise';
    const t = setTimeout(() => setLoading(false), 650);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [section]);

  const logout = () => {
    localStorage.removeItem('shiftwiseUser');
    nav('/login');
  };

  const toast = (msg) => {
    const id = Math.random();
    setToasts((t) => [...t, { id, msg }]);
    setTimeout(
      () => setToasts((t) => t.filter((x) => x.id !== id)),
      3200
    );
  };

  const addNotif = (title, body) =>
    setNotifs((n) => [
      {
        id: String(Math.random()),
        title,
        body,
        time: 'Just now',
        read: false
      },
      ...n
    ]);

  const unread = notifs.filter((n) => !n.read).length;

  const s = {
    shifts, setShifts,
    open, setOpen,
    swaps, setSwaps,
    leaves, setLeaves,
    notifs, setNotifs,
    att, setAtt,
    toast, addNotif, nav, q
  };

  const hits = useMemo(() => {
    const k = q.trim().toLowerCase();
    if (!k) return [];

    const p = NAV
      .filter((n) => n[1].toLowerCase().includes(k))
      .map((n) => ({ t: n[1], to: n[0] }));

    const o = open
      .filter((x) =>
        (x.dept + x.loc).toLowerCase().includes(k)
      )
      .map((x) => ({
        t: `${x.dept} · ${fmt(x.date, {
          weekday: 'short',
          day: 'numeric',
          month: 'short'
        })}`,
        to: 'available'
      }));

    return [...p, ...o].slice(0, 6);
  }, [q, open]);

  const Page = PAGES[section] || Overview;
  const cur = NAV.find((n) => n[0] === section) || NAV[0];

  return (
    <div className="sw" onClick={() => setMenu(null)}>
      <aside className={`side${side ? ' on' : ''}`} aria-label="Sidebar">
        <a className="logo" href="/">
          <i />ShiftWise
        </a>

        <nav onClick={() => setSide(false)}>
          {NAV.map(([k, label, Icon]) => (
            <NavLink
              key={k}
              to={k === 'overview' ? '/employee' : `/employee/${k}`}
              end
              className={() => `ni${section === k ? ' act' : ''}`}
            >
              <Icon size={18} />
              {label}
              {k === 'notifications' && unread > 0 && (
                <em>{unread}</em>
              )}
            </NavLink>
          ))}
        </nav>

        <button className="ni out" onClick={logout}>
          <LogOut size={18} />Logout
        </button>
      </aside>

      {side && (
        <div className="scrim" onClick={() => setSide(false)} />
      )}

      <div className="main">
        <header className="top" onClick={(e) => e.stopPropagation()}>
          <button
            className="ib burger"
            aria-label="Open menu"
            onClick={() => setSide(true)}
          >
            <Menu size={20} />
          </button>

          <div className="hello">
            <b>{GREET}, {NAME}</b>
            <span>
              {fmt(TODAY, {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric'
              })}
            </span>
          </div>

          <div className="search">
            <Search size={16} />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search pages or shifts"
              aria-label="Search"
            />

            {q && (
              <div className="drop sr">
                {hits.length ? hits.map((h) => (
                  <button
                    key={h.t}
                    onClick={() => {
                      nav(`/employee/${h.to}`);
                      setQ('');
                    }}
                  >
                    {h.t}
                  </button>
                )) : <p>No results</p>}
              </div>
            )}
          </div>

          <div className="rel">
            <button
              className="ib"
              aria-label="Notifications"
              onClick={() =>
                setMenu(menu === 'bell' ? null : 'bell')
              }
            >
              <Bell size={19} />
              {unread > 0 && <i className="dot" />}
            </button>

            {menu === 'bell' && (
              <div className="drop bell">
                <div className="dh">
                  <b>Notifications</b>
                  <button
                    onClick={() => {
                      setNotifs(
                        notifs.map((n) => ({ ...n, read: true }))
                      );
                    }}
                  >
                    Mark all read
                  </button>
                </div>

                {notifs.slice(0, 4).map((n) => (
                  <div
                    key={n.id}
                    className={`nrow${n.read ? '' : ' un'}`}
                  >
                    <b>{n.title}</b>
                    <span>{n.time}</span>
                  </div>
                ))}

                <button
                  className="all"
                  onClick={() => {
                    setMenu(null);
                    nav('/employee/notifications');
                  }}
                >
                  View all
                </button>
              </div>
            )}
          </div>

          <div className="rel">
            <button
              className="me"
              onClick={() =>
                setMenu(menu === 'user' ? null : 'user')
              }
            >
              <span className="av">{INITIALS}</span>
              <span className="nm">{NAME}</span>
              <ChevronDown size={14} />
            </button>

            {menu === 'user' && (
              <div
                className="drop usr"
                onClick={() => setMenu(null)}
              >
                <button onClick={() => nav('/employee/profile')}>
                  <User size={15} />My Profile
                </button>

                <button onClick={() => nav('/employee/settings')}>
                  <Settings size={15} />Settings
                </button>

                <button onClick={logout}>
                  <LogOut size={15} />Logout
                </button>
              </div>
            )}
          </div>
        </header>

        <main className="page" key={section}>
          <h1 className="pt">{cur[1]}</h1>
          {loading ? <Skeleton /> : <Page s={s} />}
        </main>
      </div>

      <div className="toasts" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className="toast">
            <Check size={16} />{t.msg}
          </div>
        ))}
      </div>
    </div>
  );
}
