
import { useCallback, useEffect, useMemo, useState } from 'react';
import { NavLink, useNavigate, useParams } from 'react-router-dom';
import {
  LayoutDashboard, CalendarDays, CalendarPlus, ArrowLeftRight,
  Sun, Clock, Bell, User, Settings, LogOut, Search, Menu,
  ChevronDown, Check
} from 'lucide-react';

import './employeedashboard.css';

import {
  TODAY, fmt
} from './data';
import api from '../api/axios';
import { dateFromKey, dateKeyFromValue, localDateKey } from '../utils/calendarDate';
import { unreadSwapNotificationCounts } from './notificationCounts';

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

const mapSwapRequests = (requests, employeeId) => requests.map((request) => {
  const isRequester = String(request.requester?._id) === String(employeeId);
  return {
    id: String(request._id),
    kind: 'swap',
    dir: isRequester ? 'mine' : 'in',
    who: isRequester ? request.targetEmployee?.fullName : request.requester?.fullName,
    requesterAssignment: request.requesterAssignment,
    targetAssignment: request.targetAssignment,
    status: request.status,
  };
});

const hour = new Date().getHours();

const GREET =
  hour < 12 ? 'Good morning' :
  hour < 18 ? 'Good afternoon' :
  'Good evening';

const normalizeType = (type) => String(type || 'early').toLowerCase();
const displayTime = (value) => value
  ? new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  : '—';

export default function EmployeeDashboard() {
  const { section = 'overview' } = useParams();
  const nav = useNavigate();

  const [loading, setLoading] = useState(true);
  const [side, setSide] = useState(false);
  const [menu, setMenu] = useState(null);
  const [q, setQ] = useState('');
  const [toasts, setToasts] = useState([]);

  const user = (() => {
    try {
      return JSON.parse(
        localStorage.getItem('shiftwiseUser') ||
        sessionStorage.getItem('shiftwiseUser') ||
        '{}'
      );
    } catch {
      return {};
    }
  })();

  const NAME = user.name || 'Employee';
  const INITIALS = NAME
    .trim()
    .split(/\s+/)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const [shifts, setShifts] = useState([]);
  const [open, setOpen] = useState([]);
  const [swaps, setSwaps] = useState([]);
  const [swapData, setSwapData] = useState({ myAssignments: [] });
  const [leaves, setLeaves] = useState([]);
  const [notifs, setNotifs] = useState([]);
  const [att, setAtt] = useState([]);
  const [profile, setProfile] = useState(null);
  const [preferences, setPreferences] = useState({});
  const [dataError, setDataError] = useState('');
  const toast = (msg) => {
    const id = Math.random();
    setToasts((t) => [...t, { id, msg }]);
    setTimeout(
      () => setToasts((t) => t.filter((x) => x.id !== id)),
      3200
    );
  };

  const loadData = useCallback(async (showLoading = false) => {
    if (showLoading) setLoading(true);
    try {
      const [profileRes, shiftsRes, assignmentsRes, changesRes, swapRes, leavesRes, attendanceRes, notificationsRes, settingsRes] = await Promise.all([
        api.get('/employees/me'),
        api.get('/shifts?status=Active'),
        api.get('/assignments'),
        api.get('/requests/changes'),
        api.get('/swaps'),
        api.get('/leaves'),
        api.get('/attendance'),
        api.get('/notifications'),
        api.get('/settings')
      ]);
      const employeeProfile = profileRes.data.employee;
      const assigned = assignmentsRes.data.assignments;
      const assignedShifts = assigned.filter((item) => item.shift).map((item) => ({
        id: item._id,
        assignmentId: item._id,
        shiftId: item.shift._id,
        date: dateFromKey(dateKeyFromValue(item.assignedDate)),
        type: normalizeType(item.shift.type),
        startTime: item.shift.startTime,
        endTime: item.shift.endTime,
        breakDuration: item.shift.breakDuration,
        dept: item.shift.department,
        loc: item.shift.location,
        status: item.status,
      }));
      const myShiftIds = new Set(assigned.map((item) => String(item.shift?._id)));
      const openShifts = shiftsRes.data.shifts
        .filter((shift) => shift.status === 'Active' && shift.openSlots > 0 && !myShiftIds.has(String(shift._id)))
        .map((shift) => {
          const shiftDate = dateKeyFromValue(shift.shiftDate);
          return {
            id: `${shift._id}-${shiftDate}`,
            shiftId: shift._id,
            date: dateFromKey(shiftDate),
            dateKey: shiftDate,
            type: normalizeType(shift.type),
            startTime: shift.startTime,
            endTime: shift.endTime,
            breakDuration: shift.breakDuration,
            dept: shift.department,
            loc: shift.location,
            status: 'Open',
            openSlots: shift.openSlots,
          };
        })
        .filter((shift) => shift.dateKey >= localDateKey(TODAY));
      const leaveRows = leavesRes.data.requests.map((request) => ({
        id: request._id,
        type: request.leaveType,
        from: new Date(request.startDate),
        to: new Date(request.endDate),
        reason: request.reason,
        status: request.status,
      }));
      const changeRows = changesRes.data.requests.map((request) => ({
        id: request._id,
        kind: 'change',
        dir: 'mine',
        who: employeeProfile.fullName,
        mine: request.currentShift?._id,
        mineShift: request.currentShift,
        theirs: typeof request.requestedShift === 'string'
          ? request.requestedShift
          : request.requestedShift?.label || 'Shift change requested',
        status: request.status,
      }));
      const swapRows = mapSwapRequests(swapRes.data.requests, employeeProfile._id);
      const attendanceRows = attendanceRes.data.records.map((record) => ({
        ...record,
        id: record._id,
        date: new Date(record.date),
        in: displayTime(record.checkInTime),
        out: displayTime(record.checkOutTime),
        inSeconds: record.checkInTime ? Math.floor(new Date(record.checkInTime).getTime() / 1000) : null,
        outSeconds: record.checkOutTime ? Math.floor(new Date(record.checkOutTime).getTime() / 1000) : null,
        late: record.status === 'Late',
      }));
      const preferencesSetting = settingsRes.data.settings.find((setting) => setting.key === 'employeePreferences');

      setProfile(employeeProfile);
      setShifts(assignedShifts);
      setOpen(openShifts);
      setSwaps([...changeRows, ...swapRows]);
      setSwapData({ myAssignments: swapRes.data.myAssignments });
      setLeaves(leaveRows);
      setAtt(attendanceRows);
      setNotifs(notificationsRes.data.notifications.map((notification) => ({
        id: notification._id,
        title: notification.title,
        body: notification.message,
        time: new Date(notification.timestamp).toLocaleString(),
        read: notification.read,
        relatedSwapRequest: notification.relatedSwapRequest ? String(notification.relatedSwapRequest) : null,
        swapDirection: notification.swapDirection || null,
      })));
      setPreferences(preferencesSetting?.value || {});
      setDataError('');
    } catch (error) {
      setDataError(error.response?.data?.message || 'Could not load employee data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    document.title = 'Dashboard · ShiftWise';
    loadData(true);
  }, [loadData]);
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [section]);

  const refreshNotifications = useCallback(async () => {
    try {
      const [notificationResponse, swapResponse] = await Promise.all([
        api.get('/notifications'),
        api.get('/swaps'),
      ]);
      setNotifs(notificationResponse.data.notifications.map((notification) => ({
        id: notification._id,
        title: notification.title,
        body: notification.message,
        time: new Date(notification.timestamp).toLocaleString(),
        read: notification.read,
        relatedSwapRequest: notification.relatedSwapRequest ? String(notification.relatedSwapRequest) : null,
        swapDirection: notification.swapDirection || null,
      })));
      const currentSwapRows = mapSwapRequests(swapResponse.data.requests, user.id);
      setSwaps((current) => [...current.filter((request) => request.kind !== 'swap'), ...currentSwapRows]);
    } catch {
      // Keep the last known request and badge state when a background refresh fails.
    }
  }, [user.id]);

  useEffect(() => {
    const refreshWhenVisible = () => {
      if (document.visibilityState === 'visible') refreshNotifications();
    };
    const interval = setInterval(refreshWhenVisible, 15000);
    window.addEventListener('focus', refreshWhenVisible);
    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', refreshWhenVisible);
    };
  }, [refreshNotifications]);

  const logout = () => {
    localStorage.removeItem('shiftwiseUser');
    localStorage.removeItem('shiftwiseToken');
    sessionStorage.removeItem('shiftwiseUser');
    sessionStorage.removeItem('shiftwiseToken');
    nav('/login');
  };
  const unread = notifs.filter((n) => !n.read).length;
  const markAllNotificationsRead = async () => {
    try {
      await api.patch('/notifications/read-all');
      await loadData(false);
    } catch (error) {
      toast(error.response?.data?.message || 'Could not update notifications.');
    }
  };

  const s = {
    shifts, setShifts, swapData,
    open, setOpen,
    swaps, setSwaps,
    leaves, setLeaves,
    notifs, setNotifs,
    att, setAtt,
    profile, preferences, setPreferences,
    toast, nav, q, reload: () => loadData(false), dataError
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
  const incomingSwapUnread = unreadSwapNotificationCounts(notifs, swaps).incoming;

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
              {k === 'swaps' && incomingSwapUnread > 0 && (
                <em aria-label={`${incomingSwapUnread} unread pending incoming swap requests`}>{incomingSwapUnread}</em>
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
                    onClick={markAllNotificationsRead}
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
          {loading ? <Skeleton /> : <>{dataError && <p className="err" role="alert">{dataError}</p>}<Page s={s} /></>}
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
