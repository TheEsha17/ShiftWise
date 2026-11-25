import { useState } from "react";
import { Check, Clock, UserX } from "lucide-react";
import { useAdmin, attendance, Pill, Tabs, av } from "./AdminStore";

export default function Attendance() {
  const { A: records, assignments } = useAdmin(), [f, setF] = useState("All"), A = attendance(records);
  const c = (s) => A.filter((a) => a.st === s).length, l = A.filter((a) => f === "All" || a.st === f);
  const assignmentFor = (record) => assignments.find((assignment) =>
    assignment.employee?._id === record.employee?._id &&
    assignment.assignedDate &&
    new Date(assignment.assignedDate).toISOString().slice(0, 10) === new Date(record.date).toISOString().slice(0, 10) &&
    assignment.status !== "Cancelled"
  );
  return (
    <div className="attendance-page">
      <h1>Attendance</h1><p className="sub">{new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</p>
      <div className="attendance-stats">{[[Check, "Present on time", c("Present"), "var(--lime)"], [Clock, "Late arrivals", c("Late"), "var(--coral)"], [UserX, "Absent", c("Absent"), "var(--lav)"]].map(([Ic, l2, n, bg]) => <div className="cd attendance-stat" key={l2}><span className="ic" style={{ background: bg }}><Ic /></span><small>{l2}</small><b>{n}</b></div>)}</div>
      <div className="cd">
        <div className="hd"><h2>Daily attendance</h2><Tabs opts={["All", "Present", "Late", "Absent"]} cur={f} on={setF} /></div>
        <div className="tw"><table>
          <thead><tr><th>Employee</th><th>Shift</th><th>Clock in</th><th>Status</th></tr></thead>
          <tbody>{l.map((a) => {
            const assignment = assignmentFor(a);
            return <tr key={a._id}><td><div className="who"><span className="av">{av(a.employeeName)}</span><span className="ser">{a.employeeName}</span></div></td><td>{assignment?.shift?.startTime || "—"}{assignment ? `–${assignment.shift.endTime} · ${assignment.shift.location}` : ""}</td><td>{a.in}</td><td><Pill s={a.st === "Present" ? "On time" : a.st} /></td></tr>;
          })}</tbody>
        </table></div>
      </div>
    </div>
  );
}
