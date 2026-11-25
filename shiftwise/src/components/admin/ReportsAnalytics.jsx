import { Users, CalendarCheck, Clock, UserCheck } from "lucide-react";
import { useAdmin, Bars, hrs, D, T, DP, COL } from "./AdminStore";

export default function ReportsAnalytics() {
  const { E, S, L, A } = useAdmin(), ws = S.filter((s) => s.wk === 0);
  const need = ws.reduce((a, s) => a + s.need, 0), fill = ws.reduce((a, s) => a + s.as.length, 0), hr = ws.reduce((a, s) => a + s.as.length * hrs(s), 0);
  const ty = Object.keys(T).map((k) => [k, ws.filter((s) => s.type === k).reduce((a, s) => a + s.as.length, 0), T[k][2]]), tot = ty.reduce((a, x) => a + x[1], 0) || 1;
  let c = 0; const cg = ty.map((x) => { const a = c; c += (x[1] / tot) * 100; return `${x[2]} ${a}% ${c}%`; }).join(",");
  const lt = {}; L.filter((l) => l.st === "Approved").forEach((l) => (lt[l.t] = (lt[l.t] || 0) + l.d));
  const now = new Date();
  const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - ((now.getDay() + 6) % 7));
  const weekRecords = A.filter((record) => {
    const date = new Date(record.date);
    return date >= monday && date < new Date(monday.getTime() + 7 * 864e5);
  });
  const weekdayCounts = D.map((_, day) => {
    const records = weekRecords.filter((record) => (new Date(record.date).getUTCDay() + 6) % 7 === day);
    const attended = records.filter((record) => ["Present", "Late"].includes(record.status)).length;
    return [records.length ? Math.round((attended / records.length) * 100) : 0, records.length];
  });
  const WEEKDAY = weekdayCounts.map(([percentage]) => percentage);
  const averageAttendance = weekRecords.length
    ? Math.round((weekRecords.filter((record) => ["Present", "Late"].includes(record.status)).length / weekRecords.length) * 100)
    : 0;
  const stats = [[Users, "var(--lime)", "Headcount", E.length, "active and on leave"], [CalendarCheck, "var(--sand)", "Shift fill rate", `${need ? Math.round((fill / need) * 100) : 0}%`, `${Math.max(0, need - fill)} slots open`], [Clock, "var(--lav)", "Scheduled hours", hr, "this week"], [UserCheck, "var(--coral)", "Avg attendance", `${averageAttendance}%`, "this week"]];
  return (
    <div className="reports-page">
      <h1>Reports & Analytics</h1><p className="sub">This week at a glance ({monday.toLocaleDateString("en-GB", { day: "numeric", month: "short" })}–{new Date(monday.getTime() + 6 * 864e5).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}).</p>
      <div className="report-stats">{stats.map(([Ic, bg, l, n, s]) => <div className="cd report-stat" key={l}><span className="ic" style={{ background: bg }}><Ic /></span><small>{l}</small><b>{n}</b><small>{s}</small></div>)}</div>
      <div className="report-grid">
        <div className="cd"><h2 style={{ marginBottom: 14 }}>Attendance by day</h2><div className="attendance-chart" role="img" aria-label={`Attendance by day: ${WEEKDAY.map((v, i) => `${D[i]} ${v}%`).join(", ")}`}>{WEEKDAY.map((v, i) => <div className="attendance-day" key={i}><b>{v}%</b><div className="attendance-track"><i style={{ height: `${v}%` }} /></div><small>{D[i]}</small></div>)}</div></div>
        <div className="cd"><h2 style={{ marginBottom: 14 }}>Shift distribution</h2>
          <div className="lgd"><div className="don" style={{ background: `radial-gradient(circle,var(--card) 55%,transparent 56%),conic-gradient(${cg})` }} /><div>{ty.map((x) => <small key={x[0]}><s style={{ background: x[2] }} />{x[0]} · {x[1]} assigned ({Math.round((x[1] / tot) * 100)}%)</small>)}</div></div>
        </div>
      </div>
      <div className="report-grid">
        <div className="cd"><h2>Headcount by department</h2><Bars data={DP.map((d, i) => [d, E.filter((e) => e.dept === d).length, COL[i]])} /></div>
        <div className="cd"><h2>Approved leave days</h2><Bars data={Object.entries(lt).map(([k, v], i) => [k, v, COL[(i + 2) % 3]])} /></div>
      </div>
    </div>
  );
}
