import { useState } from "react";
import { Users, UserCheck, CalendarCheck, Hourglass, UserPlus, CalendarDays, Check, X, Activity } from "lucide-react";
import { useAdmin, useDecide, RequestRow, Pill, Tabs, Bars, st, DP, T, COL } from "./AdminStore";

const IC = { "user-plus": UserPlus, "calendar-days": CalendarDays, "user-check": UserCheck, check: Check, x: X, activity: Activity };

export default function Overview({ go }) {
  const { E, S, R, L, ACT } = useAdmin(), decide = useDecide(), [wf, setWf] = useState("Department");
  const ts = S.filter((s) => s.wk === 0 && s.day === 1), present = ts.flatMap((s) => s.as).length - 1; // 1 absent in sample data
  const pend = R.filter((r) => r.st === "Pending"), pn = pend.length + L.filter((r) => r.st === "Pending").length;
  const wfd = wf === "Department" ? DP.map((d, i) => [d, E.filter((e) => e.dept === d).length, COL[i]]) : Object.keys(T).map((k) => [k + " shift", ts.filter((s) => s.type === k).reduce((a, s) => a + s.as.length, 0), T[k][2]]);
  const stats = [[Users, "var(--lime)", "Total employees", E.length, "across 3 locations"], [UserCheck, "var(--sand)", "Present today", present, `of ${ts.flatMap((s) => s.as).length} scheduled`], [CalendarCheck, "var(--lav)", "Active shifts", ts.length, `${ts.filter((s) => st(s) !== "Confirmed").length} need attention`], [Hourglass, "var(--coral)", "Pending requests", pn, "awaiting review"]];
  return (
    <>
      <h1>Overview</h1><p className="sub">Here’s what’s happening across your workforce today.</p>
      <div className="g4">{stats.map(([Ic, bg, l, n, s]) => <div className="cd sc" key={l}><span className="ic" style={{ background: bg }}><Ic /></span><small>{l}</small><b>{n}</b><small>{s}</small></div>)}</div>
      <div className="cd">
        <div className="hd"><h2>Today’s shifts</h2><button className="bt o s" onClick={() => go("planner")}>Open planner</button></div>
        {ts.map((s) => (
          <div className="rw" key={s.id} style={{ "--c": T[s.type][2] }}>
            <div className="f1"><div className="ser">{s.s} – {s.e}</div><small>{s.type} shift · {s.dept} · {s.loc}</small></div>
            <small>{s.as.length ? s.as.map((i) => E.find((e) => e.id === i).name.replace(/ (\w).*/, " $1.")).join(", ") : "No one assigned"}</small>
            <Pill s={st(s)} />
          </div>
        ))}
      </div>
      <div className="g2">
        <div className="cd"><div className="hd"><h2>Workforce overview</h2><Tabs opts={["Department", "Shift"]} cur={wf} on={setWf} /></div><Bars data={wfd} /><small className="mut">{wf === "Department" ? "Employees by department" : "Staff assigned today by shift"}</small></div>
        <div className="cd">
          <div className="hd"><h2>Pending requests</h2><button className="bt o s" onClick={() => go("swaps")}>View all</button></div>
          {pend.slice(0, 3).map((r) => <RequestRow key={r.id} r={r} k="swaps" onDecide={decide} />)}
          {!pend.length && <p className="mut">All caught up. No shift changes waiting.</p>}
        </div>
      </div>
      <div className="cd">
        <h2 style={{ marginBottom: 12 }}>Recent activity</h2>
        {ACT.slice(0, 6).map((a, i) => { const Ic = IC[a[2]] || Activity; return <div className="rw" key={i}><span className="ic" style={{ background: "var(--sand)", margin: 0 }}><Ic /></span><div className="f1">{a[0]}</div><small>{a[1]}</small></div>; })}
      </div>
    </>
  );
}