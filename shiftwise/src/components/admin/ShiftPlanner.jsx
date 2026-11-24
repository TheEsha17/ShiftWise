import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useAdmin, D, DP, LC, T, dd, Modal } from "./AdminStore";

const SF = [["day", "Day", 0, D], ["type", "Shift type", 0, Object.keys(T)], ["s", "Start time", "time"], ["e", "End time", "time"], ["dept", "Department", 0, DP], ["loc", "Location", 0, LC], ["need", "Staff required", "number"]];

export default function ShiftPlanner() {
  const { S, setS, log, toast } = useAdmin();
  const [wo, setWo] = useState(0), [m, setM] = useState(null); // m = {sh} (sh undefined = new shift)
  const ws = S.filter((s) => s.wk === wo);

  const save = (o) => {
    if (o.e <= o.s) return toast("End time must be after start time");
    const sh = m.sh, need = Math.max(1, +o.need || 1);
    if (sh && need < sh.as.length) return toast(`${sh.as.length} already assigned. Unassign someone first`);
    const v = { wk: wo, day: D.indexOf(o.day), type: o.type, s: o.s, e: o.e, dept: o.dept, loc: o.loc, need };
    setS(sh ? S.map((x) => (x.id === sh.id ? { ...x, ...v } : x)) : [...S, { id: Math.max(0, ...S.map((x) => x.id)) + 1, as: [], ...v }]);
    log(`Schedule updated: ${o.day} ${o.type} shift ${sh ? "edited" : "created"}`);
    toast(sh ? "Shift updated" : "Shift created");
    setM(null);
  };

  return (
    <>
      <h1>Shift Planner</h1>
      <p className="sub">Plan the week and see where cover is still needed.</p>
      <div className="cd">
        <div className="hd">
          <h2>Weekly schedule</h2>
          <div className="ac">
            <button className="ib" aria-label="Previous week" onClick={() => setWo(wo - 1)}><ChevronLeft /></button>
            <span>{dd(0, wo)} – {dd(6, wo)}</span>
            <button className="ib" aria-label="Next week" onClick={() => setWo(wo + 1)}><ChevronRight /></button>
            <button className="bt" onClick={() => setM({})}>+ New shift</button>
          </div>
        </div>
        <div className="wk">
          {D.map((n, d) => {
            const sh = ws.filter((s) => s.day === d).sort((a, b) => (a.s < b.s ? -1 : 1)), open = sh.reduce((a, s) => a + s.need - s.as.length, 0);
            return (
              <div key={n} className={"dc" + (d === 1 && !wo ? " td" : "")}>
                <small>{n.toUpperCase()}</small><div className="ser">{dd(d, wo).split(" ")[0]}</div>
                {sh.map((s) => (
                  <button key={s.id} className="ch" style={{ "--c": T[s.type][2], "--t": T[s.type][3] }} onClick={() => setM({ sh: s })}>
                    {s.s}–{s.e}<br /><small>{s.dept} · {s.as.length}/{s.need}</small>
                  </button>
                ))}
                {!sh.length && <small>No shifts</small>}
                <small style={{ marginTop: "auto" }}>{sh.length ? open + " open" : ""}</small>
              </div>
            );
          })}
        </div>
        <div className="lgd" style={{ marginTop: 12 }}>
          {Object.keys(T).map((k) => <small key={k}><s style={{ background: T[k][2] }} />{k} {T[k][0]}–{T[k][1]}</small>)}
          <small>Tap a shift to edit. “2/3” means 2 of 3 staff assigned.</small>
        </div>
      </div>
      {m && (
        <Modal key={m.sh?.id ?? "new"} title={m.sh ? "Edit shift" : "Create shift"} fields={SF} onSave={save} onClose={() => setM(null)}
          init={m.sh ? { ...m.sh, day: D[m.sh.day] } : { day: "Tue", type: "Early", s: "07:00", e: "15:00", dept: DP[0], loc: LC[0], need: 2 }} />
      )}
    </>
  );
}
