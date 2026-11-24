import { useState } from "react";
import { useAdmin, Pill, Tabs, st, dd, busy, D, T } from "./AdminStore";

export default function ShiftAssignments() {
  const { E, S, setS, log, toast } = useAdmin(), [f, setF] = useState("All");
  const l = S.filter((s) => s.wk === 0 && (f === "All" || (f === "Filled" ? s.as.length >= s.need : s.as.length < s.need)));
  const nm = (i) => E.find((e) => e.id === i).name;
  const patch = (s, as) => setS(S.map((x) => (x.id === s.id ? { ...x, as } : x)));
  const assign = (s, id) => {
    const e = E.find((x) => x.id === +id);
    if (busy(e, s, S)) return toast(`${e.name} can’t take overlapping shifts`);
    patch(s, [...s.as, e.id]); log(`${e.name} assigned to ${D[s.day]} ${s.type} shift, ${s.loc}`); toast("Assigned " + e.name);
  };
  const remove = (s, id) => { patch(s, s.as.filter((x) => x !== id)); log(`${nm(id)} removed from ${D[s.day]} ${s.type} shift`); toast("Removed " + nm(id)); };
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
              <div className="chips">{s.as.map((i) => <span className="cp" key={i}>{nm(i)}<button aria-label="Remove" onClick={() => remove(s, i)}>×</button></span>)}</div>
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