import { createContext, useContext, useEffect, useState } from "react";
import api from "../../api/axios";
import { dateFromKey, dateKeyFromValue, fullDateLabel, legacyShiftDateKey, weekdayIndexForDateKey, weekOffsetForDateKey } from "../../utils/calendarDate";

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
export const dd = (d, o = 0) => {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() - ((date.getDay() + 6) % 7) + d + o * 7);
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
};
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
              <select className="in" value={v[k]} onChange={(e) => set(k, e.target.value)}>{o.map((x) => {
                const value = typeof x === "string" ? x : x.value;
                const label = typeof x === "string" ? x : x.label;
                return <option key={value} value={value}>{label}</option>;
              })}</select>
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

const shiftLabel = (shift) => shift
  ? `${shift.startTime}–${shift.endTime} · ${shift.type} · ${shift.department} · ${shift.location}`
  : "Shift details unavailable";
const assignmentLabel = (assignment) => assignment
  ? `${fullDateLabel(dateKeyFromValue(assignment.assignedDate))} · ${shiftLabel(assignment.shift)}`
  : "Shift details unavailable";

const Ctx = createContext(null);
export const useAdmin = () => useContext(Ctx);

export function AdminProvider({ children }) {
  const [E, setE] = useState([]), [S, setS] = useState([]), [R, setR] = useState([]), [L, setL] = useState([]), [N, setN] = useState([]), [A, setA] = useState([]), [assignments, setAssignments] = useState([]), [accessRequests, setAccessRequests] = useState([]), [ACT, setACT] = useState([]), [loading, setLoading] = useState(true), [toasts, setToasts] = useState([]);
  const log = (t) => setACT((a) => [[t, "Just now", "activity"], ...a].slice(0, 8));
  const toast = (t) => {
    const id = Date.now() + Math.random();
    setToasts((x) => [...x, { id, t }]);
    setTimeout(() => setToasts((x) => x.filter((y) => y.id !== id)), 2400);
  };
  const reload = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const [employees, shifts, assignments, changes, swapRequests, leaves, notifications, attendance, accessRequestResponse] = await Promise.all([
        api.get("/employees"),
        api.get("/shifts"),
        api.get("/assignments"),
        api.get("/requests/changes"),
        api.get("/swaps"),
        api.get("/leaves"),
        api.get("/notifications"),
        api.get("/attendance"),
        api.get("/access-requests"),
      ]);
      const employeeRows = employees.data.employees.map((employee) => ({
        ...employee,
        id: employee._id,
        code: employee.employeeId || "",
        name: employee.fullName,
        dept: employee.department,
        loc: employee.location,
        type: employee.contract,
        status: employee.employmentStatus,
      }));
      const assignmentRows = assignments.data.assignments;
      setAssignments(assignmentRows);
      const shiftRows = shifts.data.shifts.map((shift) => {
        const actualDate = dateKeyFromValue(shift.shiftDate) || legacyShiftDateKey(shift.weekOffset, shift.dayIndex);
        const weekOffset = weekOffsetForDateKey(actualDate);
        const day = weekdayIndexForDateKey(actualDate);
        const assigned = assignmentRows.filter((assignment) =>
          assignment.shift?._id === shift._id &&
          assignment.status !== "Cancelled" &&
          dateKeyFromValue(assignment.assignedDate) === actualDate
        );
        return {
          ...shift,
          id: shift._id,
          dateKey: actualDate,
          date: dateFromKey(actualDate),
          dateLabel: fullDateLabel(actualDate),
          wk: weekOffset,
          day,
          type: shift.type,
          s: shift.startTime,
          e: shift.endTime,
          dept: shift.department,
          loc: shift.location,
          need: shift.staffRequired,
          as: assigned.map((assignment) => assignment.employee?._id).filter(Boolean),
        };
      });
      setE(employeeRows);
      setS(shiftRows);
      const changeRows = changes.data.requests.map((request) => ({
        ...request,
        kind: "employee-change",
        id: request._id,
        n: request.employee?.fullName || "Employee",
        a: `Current: ${shiftLabel(request.currentShift)}`,
        b: `Requested: ${typeof request.requestedShift === "string" ? request.requestedShift : request.requestedShift?.label || "Shift change requested"}`,
        st: request.status,
      }));
      const swapRows = swapRequests.data.requests.map((request) => ({
        ...request,
        kind: "employee-swap",
        id: request._id,
        n: request.requester?.fullName || "Employee",
        targetName: request.targetEmployee?.fullName || "colleague",
        a: `Their shift: ${assignmentLabel(request.requesterAssignment)}`,
        b: `Swap with ${request.targetEmployee?.fullName || "colleague"}: ${assignmentLabel(request.targetAssignment)}`,
        st: request.status,
      }));
      setR([...changeRows, ...swapRows]);
      setL(leaves.data.requests.map((request) => ({
        ...request,
        id: request._id,
        n: request.employee?.fullName || "Employee",
        t: request.leaveType,
        from: new Date(request.startDate),
        to: new Date(request.endDate),
        d: Math.round((new Date(request.endDate) - new Date(request.startDate)) / 864e5) + 1,
        a: `${request.leaveType} · ${new Date(request.startDate).toLocaleDateString("en-GB")} – ${new Date(request.endDate).toLocaleDateString("en-GB")}`,
        b: `Reason: ${request.reason}`,
        st: request.status,
      })));
      setN(notifications.data.notifications.map((notification) => ({
        ...notification,
        id: notification._id,
        t: notification.title,
        x: notification.message,
        w: new Date(notification.timestamp).toLocaleString(),
        rd: notification.read,
      })));
      setA(attendance.data.records);
      setAccessRequests(accessRequestResponse.data.requests);
    } catch (error) {
      toast(error.response?.data?.message || "Could not load dashboard data.");
    } finally {
      if (showLoading) setLoading(false);
    }
  };
  useEffect(() => {
    reload();
    const refresh = () => {
      if (document.visibilityState === "visible") reload(false);
    };
    const interval = setInterval(refresh, 15000);
    window.addEventListener("focus", refresh);
    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", refresh);
    };
  }, []);
  return (
    <Ctx.Provider value={{ E, setE, S, setS, R, setR, L, setL, N, setN, A, assignments, accessRequests, ACT, log, toast, reload, loading }}>
      {children}
      <div className="tsw">{toasts.map((x) => <div key={x.id} className="ts">✓ {x.t}</div>)}</div>
    </Ctx.Provider>
  );
}

// ---------- extra shared pieces used by the remaining pages ----------
export const COL = ["var(--lime)", "var(--coral)", "var(--lav)"];
const tm = (t) => +t.slice(0, 2) * 60 + +t.slice(3);
export const hrs = (s) => (tm(s.e) - tm(s.s)) / 60;
export const attendance = (records) => records.map((record) => ({
  ...record,
  id: record.employee?._id,
  employeeName: record.employee?.fullName || "Employee",
  in: record.checkInTime ? new Date(record.checkInTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—",
  out: record.checkOutTime ? new Date(record.checkOutTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—",
  st: record.status,
}));

export const Bars = ({ data }) => {
  const m = Math.max(...data.map((x) => x[1]), 1);
  return data.map((x) => <div className="br" key={x[0]}><span>{x[0]}</span><i style={{ width: (x[1] / m) * 100 + "%", background: x[2] }} /><b>{x[1]}</b></div>);
};
export function useDecide() {
  const { R, L, reload, log, toast } = useAdmin();
  return async (k, id, v) => {
    try {
      await api.patch(k === "swaps" ? `/requests/changes/${id}` : `/leaves/${id}`, { status: v });
      const r = (k === "swaps" ? R : L).find((x) => x.id === id);
      await reload();
      log(`${v} ${k === "swaps" ? "shift change" : "leave request"} for ${r?.n || "employee"}`);
      toast(`${v}${r?.n ? `: ${r.n}` : ""}`);
    } catch (error) {
      toast(error.response?.data?.message || "Could not update request.");
    }
  };
}
export const RequestRow = ({ r, k, onDecide, full }) => (
  <div className="rw">
    <span className="av">{av(r.n)}</span>
    <div className="f1"><div className="ser">{r.n}</div><small>{r.a}</small><br /><small>{r.b}</small></div>
    <div className="ac">
      {r.kind === "employee-swap" ? <>
        <Pill s={r.st} />
        {r.st === "Pending" && <small className="mut">Waiting for {r.targetName} to respond</small>}
      </> : <>
        {(full || r.st !== "Pending") && <Pill s={r.st} />}
        {r.st === "Pending" && <><button className="bt l s" onClick={() => onDecide(k, r.id, "Approved")}>Approve</button><button className="bt o s" onClick={() => onDecide(k, r.id, "Rejected")}>Reject</button></>}
      </>}
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
        <div className="hd"><h2>{l.length} request{l.length === 1 ? "" : "s"}</h2><Tabs opts={["Pending", "Approved", "Accepted", "Rejected", "Cancelled", "All"]} cur={f} on={setF} /></div>
        {l.map((r) => <RequestRow key={r.id} r={r} k={k} onDecide={decide} full />)}
        {!l.length && <p className="mut">No {f.toLowerCase()} requests.</p>}
      </div>
    </>
  );
}
