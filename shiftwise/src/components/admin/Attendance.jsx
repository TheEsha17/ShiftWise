import { useState } from "react";
import { Check, Clock, UserX } from "lucide-react";
import { useAdmin, attendance, Pill, Tabs, av } from "./AdminStore";

export default function Attendance() {
  const { E, S } = useAdmin(), [f, setF] = useState("All"), A = attendance(S);
  const c = (s) => A.filter((a) => a.st === s).length, l = A.filter((a) => f === "All" || a.st === f), nm = (i) => E.find((e) => e.id === i).name;
  return (
    <div className="attendance-page">
      <h1>Attendance</h1><p className="sub">Tuesday, 24 November 2026</p>
      <div className="attendance-stats">{[[Check, "Present on time", c("Present"), "var(--lime)"], [Clock, "Late arrivals", c("Late"), "var(--coral)"], [UserX, "Absent", c("Absent"), "var(--lav)"]].map(([Ic, l2, n, bg]) => <div className="cd attendance-stat" key={l2}><span className="ic" style={{ background: bg }}><Ic /></span><small>{l2}</small><b>{n}</b></div>)}</div>
      <div className="cd">
        <div className="hd"><h2>Daily attendance</h2><Tabs opts={["All", "Present", "Late", "Absent"]} cur={f} on={setF} /></div>
        <div className="tw"><table>
          <thead><tr><th>Employee</th><th>Shift</th><th>Clock in</th><th>Status</th></tr></thead>
          <tbody>{l.map((a) => <tr key={a.id}><td><div className="who"><span className="av">{av(nm(a.id))}</span><span className="ser">{nm(a.id)}</span></div></td><td>{a.sh.s}–{a.sh.e} · {a.sh.loc}</td><td>{a.in}</td><td><Pill s={a.st === "Present" ? "On time" : a.st} /></td></tr>)}</tbody>
        </table></div>
      </div>
    </div>
  );
}
