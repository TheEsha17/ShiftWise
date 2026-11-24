import { createContext, useContext, useState } from "react";

// ---------- constants ----------
export const DP = ["Floor Service", "Bar", "Kitchen"];
export const LC = ["Downtown Café", "Harbour Branch", "Airport Kiosk"];
export const D = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
export const T = { // [start, end, colour, text colour]
  Early: ["07:00", "15:00", "var(--lime)", "#1b201c"],
  Mid: ["11:00", "19:00", "var(--coral)", "#fff"],
  Late: ["15:00", "23:00", "var(--lav)", "#1b201c"],
};

// ---------- helpers ----------
export const av = (n) => n.split(" ").map((x) => x[0]).join("");
export const st = (s) => (!s.as.length ? "Unassigned" : s.as.length < s.need ? "Pending" : "Confirmed");
export const dd = (d, o = 0) => new Date(2026, 10, 23 + d + o * 7).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
export const busy = (e, s, S) => e.status === "On leave" || S.some((x) => x.wk === s.wk && x.day === s.day && x.id !== s.id && x.as.includes(e.id) && x.s < s.e && s.s < x.e);

// ---------- small shared UI ----------
const PC = { Pending: "p", "On leave": "p", Rejected: "g", Unassigned: "r", Late: "r", Absent: "r" };
export const Pill = ({ s }) => <span className={"pl " + (PC[s] || "")}>{s}</span>;
export const Tabs = ({ opts, cur, on }) => (
  <div className="tabs">{opts.map((o) => <button key={o} className={o === cur ? "on" : ""} onClick={() => on(o)}>{o}</button>)}</div>
);
// fields: [key, label, inputType, selectOptions?]
export function Modal({ title, fields, init, onSave, onClose }) {
  const [v, setV] = useState(init);
  const set = (k, x) => setV((p) => ({ ...p, [k]: x, ...(k === "type" && T[x] ? { s: T[x][0], e: T[x][1] } : {}) }));
  return (
    <div className="md" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div>
        <h2>{title}</h2>
        {fields.map(([k, l, t, o]) => (
          <label key={k}>{l}
            {o ? (
              <select className="in" value={v[k]} onChange={(e) => set(k, e.target.value)}>{o.map((x) => <option key={x}>{x}</option>)}</select>
            ) : (
              <input className="in" type={t || "text"} value={v[k] ?? ""} onChange={(e) => set(k, e.target.value)} />
            )}
          </label>
        ))}
        <div className="fa"><button className="bt o" onClick={onClose}>Cancel</button><button className="bt" onClick={() => onSave(v)}>Save changes</button></div>
      </div>
    </div>
  );
}

// ---------- sample data (replace with API data later) ----------
const E0 = [["Alex Morgan", 0, 0, "Part-time"], ["Omar Tahir", 1, 0, "Full-time"], ["Jon Lewis", 0, 1, "Full-time"], ["Maya Rossi", 2, 2, "Part-time"], ["Sara Khan", 2, 0, "Full-time"], ["Liam Brooks", 1, 1, "Part-time"], ["Nina Patel", 0, 2, "Full-time"], ["Dev Sharma", 2, 1, "Full-time"], ["Ella Gray", 1, 2, "Part-time"], ["Tom Reyes", 0, 0, "Casual"], ["Zoe Chen", 2, 0, "Part-time"], ["Ravi Singh", 0, 1, "Full-time"]].map((a, i) => ({
  id: i + 1, code: "SW-" + (2041 + i), name: a[0], dept: DP[a[1]], loc: LC[a[2]], type: a[3],
  email: a[0].toLowerCase().replace(" ", ".") + "@shiftwise.example", status: i === 8 ? "On leave" : "Active",
}));
const S0 = [];
{
  let id = 1;
  const add = (day, type, dept, loc, need, as) => S0.push({ id: id++, wk: 0, day, type, s: T[type][0], e: T[type][1], dept, loc, need, as });
  add(1, "Early", "Floor Service", "Downtown Café", 3, [1, 3, 10]); add(1, "Early", "Kitchen", "Downtown Café", 2, [5, 11]);
  add(1, "Mid", "Bar", "Harbour Branch", 2, [6, 2]); add(1, "Mid", "Kitchen", "Airport Kiosk", 2, [4]);
  add(1, "Late", "Floor Service", "Airport Kiosk", 2, [7, 12]); add(1, "Late", "Bar", "Downtown Café", 2, []);
  for (let d = 0; d < 7; d++) {
    if (d === 1) continue;
    const r = [...Array(12)].map((_, i) => ((i + d * 2) % 12) + 1), f = [2, 2, d % 3 ? 1 : 2];
    add(d, "Early", "Floor Service", "Downtown Café", 2, r.slice(0, f[0]));
    if (d < 6) { add(d, "Mid", "Bar", "Harbour Branch", 2, r.slice(2, 2 + f[1])); add(d, "Late", "Kitchen", "Airport Kiosk", 2, d === 3 ? [] : r.slice(4, 4 + f[2])); }
  }
}
const R0 = [["Omar Tahir", "Fri 27 Nov · Late 15:00–23:00", "Sat 28 Nov · Mid 11:00–19:00", "Pending"], ["Jon Lewis", "Tue 24 Nov · Early 07:00–15:00", "Wed 25 Nov · Early 07:00–15:00", "Pending"], ["Maya Rossi", "Tue 1 Dec · Late 15:00–23:00", "Mon 30 Nov · Mid 11:00–19:00", "Pending"], ["Liam Brooks", "Thu 26 Nov · Mid 11:00–19:00", "Fri 27 Nov · Mid 11:00–19:00", "Approved"], ["Dev Sharma", "Sat 28 Nov · Early 07:00–15:00", "Sun 29 Nov · Mid 11:00–19:00", "Rejected"]].map((a, i) => ({ id: i, n: a[0], a: "Current: " + a[1], b: "Requested: " + a[2], st: a[3] }));
const L0 = [["Alex Morgan", "Annual leave", "14–18 Dec", 5, "Family trip", "Pending"], ["Sara Khan", "Sick leave", "23–24 Nov", 2, "Flu", "Approved"], ["Ella Gray", "Annual leave", "1–5 Dec", 5, "Holiday", "Approved"], ["Tom Reyes", "Personal", "27 Nov", 1, "Appointment", "Pending"], ["Ravi Singh", "Annual leave", "22–26 Dec", 5, "Holiday travel", "Pending"], ["Nina Patel", "Personal", "15 Nov", 1, "Short notice during peak", "Rejected"]].map((a, i) => ({ id: i, n: a[0], t: a[1], d: a[3], a: `${a[1]} · ${a[2]} · ${a[3]} day${a[3] > 1 ? "s" : ""}`, b: "Reason: " + a[4], st: a[5] }));
const N0 = [["New shift change request", "Omar Tahir asked to swap Fri 27 Nov Late for Sat Mid.", "10 min ago", 0], ["Leave application", "Alex Morgan applied for 5 days of annual leave.", "1 h ago", 0], ["Unassigned shift", "Thu 26 Nov Late at Airport Kiosk has no staff.", "3 h ago", 0], ["Late arrival", "Tom Reyes clocked in 22 min late.", "Today", 1], ["Weekly report ready", "Last week’s attendance summary is ready.", "Yesterday", 1]].map((a, i) => ({ id: i, t: a[0], x: a[1], w: a[2], rd: a[3] }));
const ACT0 = [["Zoe Chen added to the Kitchen team", "20 min ago", "user-plus"], ["Schedule updated: Thu 26 Nov Late shift needs staff", "1 h ago", "calendar-days"], ["Nina Patel assigned to Late shift, Airport Kiosk", "2 h ago", "user-check"], ["Shift change approved for Liam Brooks", "Yesterday", "check"], ["Leave request rejected for Nina Patel", "Yesterday", "x"]];

// ---------- shared state (employees, shifts, requests, leave, notifications, activity) ----------
const Ctx = createContext(null);
export const useAdmin = () => useContext(Ctx);

export function AdminProvider({ children }) {
  const [E, setE] = useState(E0), [S, setS] = useState(S0), [R, setR] = useState(R0), [L, setL] = useState(L0), [N, setN] = useState(N0), [ACT, setACT] = useState(ACT0), [toasts, setToasts] = useState([]);
  const log = (t) => setACT((a) => [[t, "Just now", "activity"], ...a].slice(0, 8));
  const toast = (t) => {
    const id = Date.now() + Math.random();
    setToasts((x) => [...x, { id, t }]);
    setTimeout(() => setToasts((x) => x.filter((y) => y.id !== id)), 2400);
  };
  return (
    <Ctx.Provider value={{ E, setE, S, setS, R, setR, L, setL, N, setN, ACT, log, toast }}>
      {children}
      <div className="tsw">{toasts.map((x) => <div key={x.id} className="ts">✓ {x.t}</div>)}</div>
    </Ctx.Provider>
  );
}

// ---------- extra shared pieces used by the remaining pages ----------
export const COL = ["var(--lime)", "var(--coral)", "var(--lav)"];
const tm = (t) => +t.slice(0, 2) * 60 + +t.slice(3), hm = (m) => String(Math.floor(m / 60)).padStart(2, "0") + ":" + String(m % 60).padStart(2, "0");
export const hrs = (s) => (tm(s.e) - tm(s.s)) / 60;
const LATE = { 10: 22, 6: 18 }, ABS = [11];
// Today's attendance, derived from today's shifts (replace with real clock-in data later)
export const attendance = (S) => S.filter((s) => s.wk === 0 && s.day === 1).flatMap((s) => s.as.map((e) => ({ id: e, sh: s, in: ABS.includes(e) ? "—" : hm(tm(s.s) + (LATE[e] || -((e * 3) % 9 + 1))), st: ABS.includes(e) ? "Absent" : LATE[e] ? "Late" : "Present" })));

export const Bars = ({ data }) => {
  const m = Math.max(...data.map((x) => x[1]), 1);
  return data.map((x) => <div className="br" key={x[0]}><span>{x[0]}</span><i style={{ width: (x[1] / m) * 100 + "%", background: x[2] }} /><b>{x[1]}</b></div>);
};
export function useDecide() {
  const { R, setR, L, setL, log, toast } = useAdmin();
  return (k, id, v) => {
    const [list, set] = k === "swaps" ? [R, setR] : [L, setL], r = list.find((x) => x.id === id);
    set(list.map((x) => (x.id === id ? { ...x, st: v } : x)));
    log(`${v} ${k === "swaps" ? "shift change" : "leave request"} for ${r.n}`); toast(`${v}: ${r.n}`);
  };
}
export const RequestRow = ({ r, k, onDecide, full }) => (
  <div className="rw">
    <span className="av">{av(r.n)}</span>
    <div className="f1"><div className="ser">{r.n}</div><small>{r.a}</small><br /><small>{r.b}</small></div>
    <div className="ac">
      {(full || r.st !== "Pending") && <Pill s={r.st} />}
      {r.st === "Pending" && <><button className="bt l s" onClick={() => onDecide(k, r.id, "Approved")}>Approve</button><button className="bt o s" onClick={() => onDecide(k, r.id, "Rejected")}>Reject</button></>}
    </div>
  </div>
);
export function RequestPage({ k, title, sub }) {
  const { R, L } = useAdmin(), decide = useDecide(), [f, setF] = useState("Pending");
  const l = (k === "swaps" ? R : L).filter((r) => f === "All" || r.st === f);
  return (
    <>
      <h1>{title}</h1><p className="sub">{sub}</p>
      <div className="cd">
        <div className="hd"><h2>{l.length} request{l.length === 1 ? "" : "s"}</h2><Tabs opts={["Pending", "Approved", "Rejected", "All"]} cur={f} on={setF} /></div>
        {l.map((r) => <RequestRow key={r.id} r={r} k={k} onDecide={decide} full />)}
        {!l.length && <p className="mut">No {f.toLowerCase()} requests.</p>}
      </div>
    </>
  );
}
