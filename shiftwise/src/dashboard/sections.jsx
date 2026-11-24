import { useEffect, useState } from 'react';
import { CalendarCheck, Clock, Sun, Hourglass, ChevronLeft, ChevronRight, Play, Square, Plus } from 'lucide-react';
import { TODAY, TYPES, addDays, monday, key, fmt, MY_SHIFTS } from './data';
import { Pill, Modal, Empty, ShiftCard } from './ui';

const D = { weekday: 'short', day: 'numeric', month: 'short' };
const lbl = (s) => `${fmt(s.date, D)} · ${TYPES[s.type].label} ${TYPES[s.type].s}–${TYPES[s.type].e}`;
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
              {list.length ? list.map((x) => <span key={x.id} className={`chip t-${TYPES[x.type].c}`}>{TYPES[x.type].s}–{TYPES[x.type].e}<em>{TYPES[x.type].label}</em></span>) : <span className="off">Off</span>}
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
  const hours = s.shifts.filter((x) => x.date >= wk && x.date < addDays(wk, 7)).length * 8;
  const pend = s.swaps.filter((x) => x.dir === 'mine' && x.status === 'Pending').length + s.leaves.filter((x) => x.status === 'Pending').length;
  const used = s.leaves.filter((l) => l.type === 'Annual leave' && l.status === 'Approved').reduce((n, l) => n + Math.round((l.to - l.from) / 864e5) + 1, 0);
  const cards = [[CalendarCheck, 'Upcoming shifts', up.length, 'next 14 days', 'a'], [Clock, 'Hours this week', hours, 'scheduled', 'b'], [Sun, 'Leave balance', 21 - used, 'days remaining', 'c'], [Hourglass, 'Pending requests', pend, 'awaiting approval', 'd']];
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
  const [req, setReq] = useState([]);
  const depts = ['All', ...new Set(s.open.map((x) => x.dept))];
  const k = s.q.trim().toLowerCase();
  const list = s.open.filter((x) => (dept === 'All' || x.dept === dept) && (!k || (x.dept + x.loc).toLowerCase().includes(k)));
  const ask = (x) => { setReq([...req, x.id]); s.toast('Shift requested. Awaiting manager approval.'); s.addNotif('Shift request sent', lbl(x)); };
  return (
    <section className="card">
      <div className="ch"><h2>Open shifts</h2>
        <select value={dept} onChange={(e) => setDept(e.target.value)} aria-label="Filter by department">{depts.map((d) => <option key={d}>{d}</option>)}</select></div>
      <div className="list">{list.length ? list.map((x) => {
        const done = req.includes(x.id);
        return <ShiftCard key={x.id} s={done ? { ...x, status: 'Requested' } : x} action={<button className="btn p" disabled={done} onClick={() => ask(x)}>{done ? 'Requested' : 'Request This Shift'}</button>} />;
      }) : <Empty text="No open shifts match your filters." />}</div>
    </section>
  );
}

export function Swaps({ s }) {
  const [tab, setTab] = useState('mine');
  const [m, setM] = useState(false);
  const [f, setF] = useState({ shift: '', who: 'Omar T.' });
  const mine = (id) => MY_SHIFTS.find((x) => x.id === id);
  const set = (id, status, msg) => { s.setSwaps(s.swaps.map((x) => (x.id === id ? { ...x, status } : x))); s.toast(msg); };
  const rows = s.swaps.filter((x) => x.dir === tab);
  const submit = (e) => {
    e.preventDefault();
    if (!f.shift) return;
    s.setSwaps([{ id: 'w' + Math.random(), dir: 'mine', who: f.who, mine: f.shift, theirs: 'Colleague’s shift (to be agreed)', status: 'Pending' }, ...s.swaps]);
    s.toast('Swap request sent.'); setM(false); setTab('mine');
  };
  return (
    <section className="card">
      <div className="ch"><div className="tabs">{[['mine', 'My requests'], ['in', 'Incoming']].map(([k, l]) => <button key={k} className={tab === k ? 'on' : ''} onClick={() => setTab(k)}>{l}</button>)}</div>
        <button className="btn p" onClick={() => setM(true)}><Plus size={15} />New swap</button></div>
      <div className="list">{rows.length ? rows.map((x) => (
        <article key={x.id} className="swap">
          <span className="av">{x.who.split(' ').map((p) => p[0]).join('')}</span>
          <div><h4>{x.who}</h4><p>{tab === 'mine' ? 'Your shift' : 'Their ask for your shift'}: {lbl(mine(x.mine))}</p><p>Requested: {x.theirs}</p></div>
          <div className="end"><Pill s={x.status} />
            {x.status === 'Pending' && tab === 'mine' && <button className="btn" onClick={() => set(x.id, 'Rejected', 'Swap request cancelled.')}>Cancel</button>}
            {x.status === 'Pending' && tab === 'in' && <div className="row"><button className="btn p" onClick={() => set(x.id, 'Approved', 'Swap accepted.')}>Accept</button><button className="btn" onClick={() => set(x.id, 'Rejected', 'Swap declined.')}>Decline</button></div>}</div>
        </article>)) : <Empty text="No swap requests here." />}</div>
      {m && <Modal title="New swap request" onClose={() => setM(false)}>
        <form onSubmit={submit} noValidate>
          <label>Your shift<select value={f.shift} onChange={(e) => setF({ ...f, shift: e.target.value })}><option value="">Select a shift</option>{upcoming(s).map((x) => <option key={x.id} value={x.id}>{lbl(x)}</option>)}</select></label>
          <label>Swap with<select value={f.who} onChange={(e) => setF({ ...f, who: e.target.value })}>{['Omar T.', 'Maya R.', 'Jon L.', 'Aisha K.'].map((n) => <option key={n}>{n}</option>)}</select></label>
          {!f.shift && <p className="err">Please choose a shift.</p>}
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
  const submit = (e) => {
    e.preventDefault();
    const x = {};
    if (!f.from) x.from = 'Choose a start date.';
    else if (f.from < key(TODAY)) x.from = 'Start date cannot be in the past.';
    if (!f.to) x.to = 'Choose an end date.';
    else if (f.from && f.to < f.from) x.to = 'End date must be after the start date.';
    if (f.reason.trim().length < 5) x.reason = 'Please add a reason (5+ characters).';
    setEr(x);
    if (Object.keys(x).length) return;
    s.setLeaves([{ id: 'l' + Math.random(), type: f.type, from: new Date(f.from + 'T00:00'), to: new Date(f.to + 'T00:00'), reason: f.reason.trim(), status: 'Pending' }, ...s.leaves]);
    s.toast('Leave request submitted.'); close();
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
  const [inAt, setIn] = useState(null);
  const [now, setNow] = useState(0);
  useEffect(() => {
    if (!inAt) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [inAt]);
  const hm = (d) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  const toggle = () => {
    if (!inAt) { setIn(Date.now()); setNow(Date.now()); s.toast('Clocked in. Have a great shift!'); return; }
const a = new Date(inAt);
const b = new Date();

s.setAtt([{
  id: 'a' + inAt,
  date: TODAY,
  in: hm(a),
  out: hm(b),
  inSeconds: Math.floor(inAt / 1000),
  outSeconds: Math.floor(b.getTime() / 1000),
  late: a.getHours() > 7 || (a.getHours() === 7 && a.getMinutes() > 10)
}, ...s.att]);
    setIn(null); s.toast('Clocked out. Record saved to this session.');
  };
  const el = inAt ? Math.max(0, Math.floor((now - inAt) / 1000)) : 0;
const totalSeconds = s.att.reduce((total, a) => {
  if (a.inSeconds != null && a.outSeconds != null) {
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
  const flip = (id) => s.setNotifs(s.notifs.map((n) => (n.id === id ? { ...n, read: true } : n)));
  return (
    <section className="card">
      <div className="ch"><div className="tabs"><button className={!only ? 'on' : ''} onClick={() => setOnly(false)}>All</button><button className={only ? 'on' : ''} onClick={() => setOnly(true)}>Unread</button></div>
        <button className="lnk" onClick={() => { s.setNotifs(s.notifs.map((n) => ({ ...n, read: true }))); s.toast('All notifications marked as read.'); }}>Mark all as read</button></div>
      {list.length ? list.map((n) => (
        <div key={n.id} className={`nrow big${n.read ? '' : ' un'}`}><div><b>{n.title}</b><p>{n.body}</p><span>{n.time}</span></div>{!n.read && <button className="btn" onClick={() => flip(n.id)}>Mark as read</button>}</div>
      )) : <Empty text="You’re all caught up." />}
    </section>
  );
}


export function Profile() {
  const user = JSON.parse(
    localStorage.getItem("shiftwiseUser") || "{}"
  );

  const name = user.name || "Employee";
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
        <p>Employee · ShiftWise</p>

        <dl>
          <dt>Email</dt>
          <dd>{email}</dd>

          <dt>Employee ID</dt>
          <dd>Not assigned</dd>

          <dt>Manager</dt>
          <dd>Not assigned</dd>

          <dt>Contract</dt>
          <dd>Not assigned</dd>
        </dl>
      </div>
    </section>
  );
}


export function Prefs({ s }) {
  const [p, setP] = useState({ 'Shift reminders': true, 'Swap request alerts': true, 'Weekly schedule email': false });
  return (
    <section className="card"><div className="ch"><h2>Preferences</h2></div>
      {Object.keys(p).map((k) => (
        <label key={k} className="tog"><span>{k}</span><input type="checkbox" checked={p[k]} onChange={() => { setP({ ...p, [k]: !p[k] }); s.toast(`${k} ${p[k] ? 'off' : 'on'}.`); }} /><i /></label>
      ))}</section>
  );
}
