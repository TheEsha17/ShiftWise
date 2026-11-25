import { useState } from "react";
import { useAdmin, Pill, Tabs, st, dd, busy, D, T } from "./AdminStore";
import api from "../../api/axios";

export default function ShiftAssignments() {
  const { E, S, assignments, reload, log, toast } = useAdmin(), [f, setF] = useState("All");
  const l = S.filter((s) => s.wk === 0 && (f === "All" || (f === "Filled" ? s.as.length >= s.need : s.as.length < s.need)));
  const nm = (i) => E.find((e) => e.id === i)?.name || "Employee";
  const dateFor = (s) => {
    const now = new Date();
    const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - ((now.getDay() + 6) % 7));
    return new Date(Date.UTC(monday.getFullYear(), monday.getMonth(), monday.getDate() + s.wk * 7 + s.day)).toISOString();
  };
  const assign = async (s, id) => {
    const e = E.find((x) => x.id === id);
    if (!e) return;
    if (busy(e, s, S)) return toast(`${e.name} can’t take overlapping shifts`);
    try {
      await api.post("/assignments", { employee: e.id, shift: s.id, assignedDate: dateFor(s) });
      await reload();
      log(`${e.name} assigned to ${D[s.day]} ${s.type} shift, ${s.loc}`);
      toast("Assigned " + e.name);
    } catch (error) {
      toast(error.response?.data?.message || "Could not assign employee.");
    }
  };
  const remove = async (s, id) => {
    const assignment = assignments.find((row) =>
      row.shift?._id === s.id && row.employee?._id === id && row.status !== "Cancelled"
    );
    if (!assignment) return toast("Assignment record not found. Reload and try again.");
    try {
      await api.delete(`/assignments/${assignment._id}`);
      await reload();
      log(`${nm(id)} removed from ${D[s.day]} ${s.type} shift`);
      toast("Removed " + nm(id));
    } catch (error) {
      toast(error.response?.data?.message || "Could not remove assignment.");
    }
  };
  const confirm = async (assignment) => {
    try {
      await api.patch(`/assignments/${assignment._id}`, { status: "Confirmed" });
      await reload();
      toast("Shift request approved.");
    } catch (error) {
      toast(error.response?.data?.message || "Could not confirm assignment.");
    }
  };
  return (
    <>
      <h1>Shift Assignments</h1><p className="sub">Assign people to shifts. Anyone already working an overlapping shift is greyed out.</p>
      <div className="cd">
        <div className="hd"><h2>{l.length} shift{l.length === 1 ? "" : "s"}</h2><Tabs opts={["All", "Filled", "Open"]} cur={f} on={setF} /></div>
        {l.map((s) => (
          <div className="rw" key={s.id} style={{ "--c": T[s.type][2] }}>
            <div className="dt"><small>{D[s.day].toUpperCase()}</small><div className="ser">{dd(s.day).split(" ")[0]}</div></div>
            <div className="f1">
              <div className="ser">{s.s} – {s.e}</div><small>{s.type} · {s.dept} · {s.loc} · {s.as.length}/{s.need} assigned</small>
              <div className="chips">{s.as.map((i) => {
                const assignment = assignments.find((row) => row.shift?._id === s.id && row.employee?._id === i && row.status !== "Cancelled");
                return <span className="cp" key={i}>{nm(i)}{assignment?.status === "Pending" && <button aria-label="Approve shift request" onClick={() => confirm(assignment)}>Approve</button>}<button aria-label="Remove" onClick={() => remove(s, i)}>×</button></span>;
              })}</div>
            </div>
            <div className="ac">
              <Pill s={st(s)} />
              {s.as.length < s.need && (
                <select className="in" value="" onChange={(e) => assign(s, e.target.value)}>
                  <option value="">Assign…</option>
                  {E.filter((e) => !s.as.includes(e.id)).map((e) => <option key={e.id} value={e.id} disabled={busy(e, s, S)}>{e.name}{busy(e, s, S) ? " (busy)" : ""}</option>)}
                </select>
              )}
            </div>
          </div>
        ))}
        {!l.length && <p className="mut">Nothing here. Create shifts in the planner.</p>}
      </div>
    </>
  );
}