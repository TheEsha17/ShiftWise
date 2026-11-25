import { useEffect, useState } from 'react';
import { CalendarCheck, Clock, Sun, Hourglass, ChevronLeft, ChevronRight, Play, Square, Plus } from 'lucide-react';
import { TODAY, TYPES, addDays, monday, key, fmt } from './data';
import { Pill, Modal, Empty, ShiftCard } from './ui';
import api from '../api/axios';

const D = { weekday: 'short', day: 'numeric', month: 'short' };
const lbl = (s) => s
  ? `${fmt(s.date, D)} · ${TYPES[s.type].label} ${s.startTime || TYPES[s.type].s}–${s.endTime || TYPES[s.type].e}`
  : 'Shift no longer available';
const upcoming = (s) => s.shifts.filter((x) => x.date >= TODAY).sort((a, b) => a.date - b.date);

function Cal({ s }) {
  const [w, setW] = useState(0);
  const start = addDays(monday(TODAY), w * 7);
  const days = Array.from({ length: 7 }, (_, i) => addDays(start, i));
  return (
    <section className="card">
      <div className="ch"><h2>Weekly schedule</h2>
        <div className="wn"><button className="ib" aria-label="Previous week" onClick={() => setW(w - 1)}><ChevronLeft size={18} /></button>
          <span>{fmt(days[0], { day: 'numeric', month: 'short' })} – {fmt(days[6], { day: 'numeric', month: 'short' })}</span>
          <button className="ib" aria-label="Next week" onClick={() => setW(w + 1)}><ChevronRight size={18} /></button>
          {w !== 0 && <button className="lnk" onClick={() => setW(0)}>Today</button>}</div></div>
      <div className="cal">
        {days.map((d) => {
          const list = s.shifts.filter((x) => key(x.date) === key(d));
          return (
            <div key={key(d)} className={`day${key(d) === key(TODAY) ? ' today' : ''}`}>
              <small>{fmt(d, { weekday: 'short' })}</small><b>{d.getDate()}</b>
              {list.length ? list.map((x) => <span key={x.id} className={`chip t-${TYPES[x.type].c}`}>{x.startTime || TYPES[x.type].s}–{x.endTime || TYPES[x.type].e}<em>{TYPES[x.type].label}</em></span>) : <span className="off">Off</span>}
            </div>
          );
        })}
      </div>
      <div className="legend">{Object.values(TYPES).map((t) => <span key={t.label}><i className={`t-${t.c}`} />{t.label}</span>)}</div>
    </section>
  );
}

export function Overview({ s }) {
  const up = upcoming(s);
  const wk = monday(TODAY);
  const hours = s.shifts.filter((x) => x.date >= wk && x.date < addDays(wk, 7)).reduce((total, shift) => {
    const start = shift.startTime || TYPES[shift.type].s;
    const end = shift.endTime || TYPES[shift.type].e;
    return total + Math.max(0, (Number(end.slice(0, 2)) * 60 + Number(end.slice(3, 5)) - Number(start.slice(0, 2)) * 60 - Number(start.slice(3, 5)) - (shift.breakDuration || 0)) / 60);
  }, 0);
  const pend = s.swaps.filter((x) => x.dir === 'mine' && x.status === 'Pending').length + s.leaves.filter((x) => x.status === 'Pending').length;
  const used = s.leaves.filter((l) => l.type === 'Annual leave' && l.status === 'Approved').reduce((n, l) => n + Math.round((l.to - l.from) / 864e5) + 1, 0);
  const remaining = Math.max(0, (s.profile?.leaveBalance ?? 21) - used);
  const cards = [[CalendarCheck, 'Upcoming shifts', up.length, 'next 14 days', 'a'], [Clock, 'Hours this week', hours, 'scheduled', 'b'], [Sun, 'Leave balance', remaining, 'days remaining', 'c'], [Hourglass, 'Pending requests', pend, 'awaiting approval', 'd']];
  return (
    <>
      <p className="lead">Here’s what’s happening with your work week.</p>
      <div className="stats">{cards.map(([I, t, v, n, c], i) => <div key={t} className={`stat c-${c}`} style={{ '--i': i }}><I size={18} /><small>{t}</small><b>{v}</b><span>{n}</span></div>)}</div>
      <section className="card">
        <div className="ch"><h2>Upcoming shifts</h2><button className="lnk" onClick={() => s.nav('/employee/schedule')}>View Full Schedule →</button></div>
        <div className="list">{up.slice(0, 3).map((x) => <ShiftCard key={x.id} s={x} />)}</div>
      </section>
      <Cal s={s} />
    </>
  );
}

export function Schedule({ s }) {
  const [f, setF] = useState('All');
  const list = upcoming(s).filter((x) => f === 'All' || TYPES[x.type].label === f);
  return (
    <>
      <Cal s={s} />
      <section className="card">
        <div className="ch"><h2>All upcoming shifts</h2>
          <select value={f} onChange={(e) => setF(e.target.value)} aria-label="Filter by type"><option>All</option>{Object.values(TYPES).map((t) => <option key={t.label}>{t.label}</option>)}</select></div>
        <div className="list">{list.length ? list.map((x) => <ShiftCard key={x.id} s={x} />) : <Empty text="No shifts match this filter." />}</div>
      </section>
    </>
  );
}

export function Available({ s }) {
  const [dept, setDept] = useState('All');
  const depts = ['All', ...new Set(s.open.map((x) => x.dept))];
  const k = s.q.trim().toLowerCase();
  const list = s.open.filter((x) => (dept === 'All' || x.dept === dept) && (!k || (x.dept + x.loc).toLowerCase().includes(k)));
  const ask = async (x) => {
    try {
      await api.post('/assignments', { shift: x.shiftId, assignedDate: x.date.toISOString() });
      await s.reload();
      s.toast('Shift requested. Awaiting manager approval.');
    } catch (error) {
      s.toast(error.response?.data?.message || 'Could not request this shift.');
    }
  };
  return (
    <section className="card">
      <div className="ch"><h2>Open shifts</h2>
        <select value={dept} onChange={(e) => setDept(e.target.value)} aria-label="Filter by department">{depts.map((d) => <option key={d}>{d}</option>)}</select></div>
      <div className="list">{list.length ? list.map((x) => {
        return <ShiftCard key={x.id} s={x} action={<button className="btn p" onClick={() => ask(x)}>Request This Shift</button>} />;
      }) : <Empty text="No open shifts match your filters." />}</div>
    </section>
  );
}

export function Swaps({ s }) {
  const [tab, setTab] = useState('mine');
  const [m, setM] = useState(false);
  const [f, setF] = useState({ shift: '', target: '' });
  const [targetOptions, setTargetOptions] = useState({ shift: '', assignments: [], loading: false });
  const [formError, setFormError] = useState('');
  const mine = (id) => s.shifts.find((x) => String(x.shiftId) === String(id));
  const shiftLabel = (assignment, colleague) => {
    if (!assignment?.shift || !assignment.assignedDate) return 'Shift details unavailable';
    const date = new Date(`${String(assignment.assignedDate).slice(0, 10)}T12:00:00`);
    const shift = assignment.shift;
    return [
      colleague,
      fmt(date, D),
      `${shift.startTime}–${shift.endTime}`,
    ].filter(Boolean).join(' · ');
  };
  const set = async (row, status, msg) => {
    try {
      if (row.kind === 'swap') {
        if (status === 'Cancelled') await api.delete(`/swaps/${row.id}`);
        else await api.patch(`/swaps/${row.id}`, { status });
      } else if (status === 'Cancelled') {
        await api.delete(`/requests/changes/${row.id}`);
      } else {
        await api.patch(`/requests/changes/${row.id}`, { status });
      }
      await s.reload();
      s.toast(msg);
    } catch (error) {
      s.toast(error.response?.data?.message || 'Could not update shift request.');
    }
  };
  const rows = s.swaps.filter((x) => x.dir === tab);
  const selectShift = async (shift) => {
    setF({ shift, target: '' });
    setFormError('');
    setTargetOptions({ shift, assignments: [], loading: Boolean(shift) });
    if (!shift) return;
    try {
      const { data } = await api.get(`/swaps/options?requesterAssignment=${encodeURIComponent(shift)}`);
      setTargetOptions((current) => current.shift === shift
        ? { shift, assignments: data.assignments, loading: false }
        : current);
    } catch (error) {
      setTargetOptions((current) => current.shift === shift
        ? { ...current, loading: false }
        : current);
      s.toast(error.response?.data?.message || 'Could not load eligible colleague shifts.');
    }
  };
  const submit = async (e) => {
    e.preventDefault();
    if (!f.shift || !f.target) {
      setFormError('Choose both of the shifts to submit a swap request.');
      return;
    }
    try {
      await api.post('/swaps', {
        requesterAssignment: f.shift,
        targetAssignment: f.target,
      });
      await s.reload();
      s.toast('Swap request sent.');
      setM(false);
      setF({ shift: '', target: '' });
      setTab('mine');
      setFormError('');
    } catch (error) {
      s.toast(error.response?.data?.message || 'Could not submit shift request.');
    }
  };
  return (
    <section className="card">
      <div className="ch"><div className="tabs">{[['mine', 'My requests'], ['in', 'Incoming']].map(([k, l]) => <button key={k} className={tab === k ? 'on' : ''} onClick={() => setTab(k)}>{l}</button>)}</div>
        <button className="btn p" onClick={() => {
          setF({ shift: '', target: '' });
          setTargetOptions({ shift: '', assignments: [], loading: false });
          setFormError('');
          setM(true);
        }}><Plus size={15} />New swap</button></div>
      <div className="list">{rows.length ? rows.map((x) => (
        <article key={x.id} className="swap">
          <span className="av">{x.who.split(' ').map((p) => p[0]).join('')}</span>
          <div><h4>{x.who}</h4>
            {x.kind === 'swap' ? <>
              <p>{tab === 'mine' ? 'Your shift' : 'Their shift'}: {shiftLabel(x.requesterAssignment, tab === 'in' ? x.who : '')}</p>
              <p>{tab === 'mine' ? 'Requested shift' : 'Your shift'}: {shiftLabel(x.targetAssignment, tab === 'mine' ? x.who : '')}</p>
            </> : <>
              <p>{tab === 'mine' ? 'Your shift' : 'Their ask for your shift'}: {lbl(mine(x.mine))}</p>
              <p>Requested: {x.theirs}</p>
            </>}
          </div>
          <div className="end"><Pill s={x.status} />
            {x.status === 'Pending' && tab === 'mine' && <button className="btn" onClick={() => set(x, 'Cancelled', 'Swap request cancelled.')}>Cancel</button>}
            {x.status === 'Pending' && tab === 'in' && <div className="row"><button className="btn p" onClick={() => set(x, 'Accepted', 'Swap accepted; shifts exchanged.')}>Accept</button><button className="btn" onClick={() => set(x, 'Rejected', 'Swap declined.')}>Decline</button></div>}</div>
        </article>)) : <Empty text="No swap requests here." />}</div>
      {m && <Modal title="New swap request" onClose={() => setM(false)}>
        <form onSubmit={submit} noValidate>
          <label>Your shift<select value={f.shift} onChange={(e) => selectShift(e.target.value)}>
            <option value="">Select a shift</option>
            {s.swapData.myAssignments.map((assignment) => (
              <option key={assignment._id} value={assignment._id} disabled={assignment.swapPending}>
                {shiftLabel(assignment)}{assignment.swapPending ? ' · Swap pending' : ''}
              </option>
            ))}
          </select></label>
          <label>Swap with<select value={f.target} onChange={(e) => { setF({ ...f, target: e.target.value }); setFormError(''); }} disabled={!f.shift || targetOptions.loading}>
            <option value="">{targetOptions.loading ? 'Loading eligible shifts…' : 'Select a colleague’s shift'}</option>
            {targetOptions.shift === f.shift && targetOptions.assignments.map((assignment) => (
              <option key={assignment._id} value={assignment._id}>
                {shiftLabel(assignment, assignment.employee?.fullName)}
              </option>
            ))}
          </select></label>
          {f.shift && !targetOptions.loading && targetOptions.shift === f.shift && !targetOptions.assignments.length && <p className="err">No eligible colleague shifts are available for this shift.</p>}
          {!s.swapData.myAssignments.length && <p className="err">You have no upcoming confirmed shifts to swap.</p>}
          {formError && <p className="err">{formError}</p>}
          <button className="btn p wide" type="submit">Send request</button>
        </form></Modal>}
    </section>
  );
}

const TOTAL = 21;
export function Leave({ s }) {
  const [m, setM] = useState(false);
  const [f, setF] = useState({ type: 'Annual leave', from: '', to: '', reason: '' });
  const [er, setEr] = useState({});
  const used = s.leaves.filter((l) => l.type === 'Annual leave' && l.status === 'Approved').reduce((n, l) => n + Math.round((l.to - l.from) / 864e5) + 1, 0);
  const upc = s.leaves.filter((l) => l.status === 'Approved' && l.to >= TODAY);
  const close = () => { setM(false); setEr({}); setF({ type: 'Annual leave', from: '', to: '', reason: '' }); };
  const submit = async (e) => {
    e.preventDefault();
    const x = {};
    if (!f.from) x.from = 'Choose a start date.';
    else if (f.from < key(TODAY)) x.from = 'Start date cannot be in the past.';
    if (!f.to) x.to = 'Choose an end date.';
    else if (f.from && f.to < f.from) x.to = 'End date must be after the start date.';
    if (f.reason.trim().length < 5) x.reason = 'Please add a reason (5+ characters).';
    setEr(x);
    if (Object.keys(x).length) return;
    try {
      await api.post('/leaves', {
        leaveType: f.type,
        startDate: f.from,
        endDate: f.to,
        reason: f.reason.trim(),
      });
      await s.reload();
      s.toast('Leave request submitted.');
      close();
    } catch (error) {
      s.toast(error.response?.data?.message || 'Could not submit leave request.');
    }
  };
  const row = (l) => <div key={l.id} className="lrow"><div><b>{l.type}</b><span>{fmt(l.from, D)}{+l.from !== +l.to && ` – ${fmt(l.to, D)}`} · {l.reason}</span></div><Pill s={l.status} /></div>;
  return (
    <>
      <div className="two">
        <section className="card bal"><small>Remaining leave</small><b>{TOTAL - used}<span> / {TOTAL} days</span></b>
          <div className="bar"><i style={{ width: `${((TOTAL - used) / TOTAL) * 100}%` }} /></div>
          <button className="btn p" onClick={() => setM(true)}><Plus size={15} />Apply for leave</button></section>
        <section className="card"><div className="ch"><h2>Upcoming approved</h2></div>{upc.length ? upc.map(row) : <Empty text="No approved leave coming up." />}</section>
      </div>
      <section className="card"><div className="ch"><h2>Leave history</h2></div>{s.leaves.map(row)}</section>
      {m && <Modal title="Apply for leave" onClose={close}>
        <form onSubmit={submit} noValidate>
          <label>Leave type<select value={f.type} onChange={(e) => setF({ ...f, type: e.target.value })}>{['Annual leave', 'Sick leave', 'Personal', 'Unpaid'].map((t) => <option key={t}>{t}</option>)}</select></label>
          <div className="row2"><label>Start date<input type="date" value={f.from} onChange={(e) => setF({ ...f, from: e.target.value })} />{er.from && <p className="err">{er.from}</p>}</label>
            <label>End date<input type="date" value={f.to} onChange={(e) => setF({ ...f, to: e.target.value })} />{er.to && <p className="err">{er.to}</p>}</label></div>
          <label>Reason<textarea rows="3" value={f.reason} onChange={(e) => setF({ ...f, reason: e.target.value })} />{er.reason && <p className="err">{er.reason}</p>}</label>
          <button className="btn p wide" type="submit">Submit request</button>
        </form></Modal>}
    </>
  );
}

const pad = (n) => String(n).padStart(2, '0');
export function Attendance({ s }) {
  const [now, setNow] = useState(0);
  const activeRecord = s.att.find((record) =>
    new Date(record.date).toDateString() === TODAY.toDateString() &&
    record.checkInTime &&
    !record.checkOutTime
  );
  const inAt = activeRecord ? new Date(activeRecord.checkInTime).getTime() : null;
  useEffect(() => {
    if (!inAt) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [inAt]);
  const toggle = async () => {
    try {
      if (!inAt) {
        await api.post('/attendance/check-in', { date: key(TODAY) });
        await s.reload();
        s.toast('Clocked in. Have a great shift!');
        return;
      }
      await api.post('/attendance/check-out', { date: key(TODAY) });
      await s.reload();
      s.toast('Clocked out. Attendance record saved.');
    } catch (error) {
      s.toast(error.response?.data?.message || 'Could not update attendance.');
    }
  };
  const el = inAt ? Math.max(0, Math.floor((now - inAt) / 1000)) : 0;
const totalSeconds = s.att.reduce((total, a) => {
  if (a.inSeconds != null && a.outSeconds != null && a.date >= addDays(TODAY, -6)) {
    return total + (a.outSeconds - a.inSeconds);
  }
  return total;
}, 0);

const hours = Math.floor(totalSeconds / 3600);
const minutes = Math.floor((totalSeconds % 3600) / 60);
const workedHours = `${hours}h ${minutes}m`;


  const late = s.att.filter((a) => a.late).length;
  return (
    <>
      <div className="two">
        <section className="card clock"><small>{inAt ? 'On shift' : 'Not clocked in'}</small><b>{pad(Math.floor(el / 3600))}:{pad(Math.floor(el / 60) % 60)}:{pad(el % 60)}</b>
          <button className={`btn ${inAt ? '' : 'p'}`} onClick={toggle}>{inAt ? <><Square size={14} />Clock out</> : <><Play size={14} />Clock in</>}</button></section>
        <section className="stats mini">
         <div className="stat c-a">
  <small>Hours worked</small>
  <b>{workedHours}</b>
  <span>last 7 days</span>
</div>
          <div className="stat c-b"><small>Days attended</small><b>{s.att.length}</b><span>recent records</span></div>
          <div className="stat c-d"><small>Late arrivals</small><b>{late}</b><span>{late ? 'needs attention' : 'all on time'}</span></div>
        </section>
      </div>
      <section className="card"><div className="ch"><h2>Recent records</h2></div>
        <div className="tw"><table><thead><tr><th>Date</th><th>Clock in</th><th>Clock out</th><th>Status</th></tr></thead>
          <tbody>{s.att.map((a) => <tr key={a.id}><td>{fmt(a.date, D)}</td><td>{a.in}</td><td>{a.out}</td><td>{a.late ? <span className="pill hot">Late</span> : <span className="pill ok">On time</span>}</td></tr>)}</tbody></table></div></section>
    </>
  );
}

export function Notifications({ s }) {
  const [only, setOnly] = useState(false);
  const list = s.notifs.filter((n) => !only || !n.read);
  const flip = async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      await s.reload();
    } catch (error) {
      s.toast(error.response?.data?.message || 'Could not update notification.');
    }
  };
  const markAllRead = async () => {
    try {
      await api.patch('/notifications/read-all');
      await s.reload();
      s.toast('All notifications marked as read.');
    } catch (error) {
      s.toast(error.response?.data?.message || 'Could not update notifications.');
    }
  };
  return (
    <section className="card">
      <div className="ch"><div className="tabs"><button className={!only ? 'on' : ''} onClick={() => setOnly(false)}>All</button><button className={only ? 'on' : ''} onClick={() => setOnly(true)}>Unread</button></div>
        <button className="lnk" onClick={markAllRead}>Mark all as read</button></div>
      {list.length ? list.map((n) => (
        <div key={n.id} className={`nrow big${n.read ? '' : ' un'}`}><div><b>{n.title}</b><p>{n.body}</p><span>{n.time}</span></div>{!n.read && <button className="btn" onClick={() => flip(n.id)}>Mark as read</button>}</div>
      )) : <Empty text="You’re all caught up." />}
    </section>
  );
}


export function Profile({ s }) {
  const user = s.profile || {};
  const name = user.fullName || "Employee";
  const email = user.email || "No email available";

  const initials = name
    .trim()
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <section className="card prof">
      <span className="av xl">{initials}</span>

      <div>
        <h2>{name}</h2>
        <p>{user.designation || "Employee"} · ShiftWise</p>

        <dl>
          <dt>Email</dt>
          <dd>{email}</dd>

          <dt>Employee ID</dt>
          <dd>{user.employeeId || "Not assigned"}</dd>

          <dt>Manager</dt>
          <dd>{user.managerName || "Not assigned"}</dd>

          <dt>Contract</dt>
          <dd>{user.contract || "Not assigned"}</dd>
        </dl>
      </div>
    </section>
  );
}


export function Prefs({ s }) {
  const defaults = { 'Shift reminders': true, 'Swap request alerts': true, 'Weekly schedule email': false };
  const p = { ...defaults, ...(s.preferences || {}) };
  const flip = async (key) => {
    const next = { ...p, [key]: !p[key] };
    try {
      await api.put('/settings/employeePreferences', { scope: 'Employee', value: next });
      s.setPreferences(next);
      s.toast(`${key} ${p[key] ? 'off' : 'on'}.`);
    } catch (error) {
      s.toast(error.response?.data?.message || 'Could not save preference.');
    }
  };
  return (
    <section className="card"><div className="ch"><h2>Preferences</h2></div>
      {Object.keys(p).map((k) => (
        <label key={k} className="tog"><span>{k}</span><input type="checkbox" checked={p[k]} onChange={() => flip(k)} /><i /></label>
      ))}</section>
  );
}
