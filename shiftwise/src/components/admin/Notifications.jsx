import { useState } from "react";
import { useAdmin, Tabs } from "./AdminStore";

export default function Notifications() {
  const { N, setN, toast } = useAdmin(), [f, setF] = useState("All"), l = N.filter((n) => f === "All" || !n.rd);
  return (
    <>
      <h1>Notifications</h1><p className="sub">Updates that need your attention.</p>
      <div className="cd">
        <div className="hd"><Tabs opts={["All", "Unread"]} cur={f} on={setF} /><button className="bt o s" onClick={() => { setN(N.map((n) => ({ ...n, rd: 1 }))); toast("All marked as read"); }}>Mark all as read</button></div>
        {l.map((n) => (
          <div key={n.id} className={"rw nt" + (n.rd ? " rd" : "")}>
            <div className="f1"><b>{n.t}</b><br /><small>{n.x}</small><br /><small>{n.w}</small></div>
            {!n.rd && <button className="bt o s" onClick={() => setN(N.map((x) => (x.id === n.id ? { ...x, rd: 1 } : x)))}>Mark as read</button>}
          </div>
        ))}
        {!l.length && <p className="mut">You’re all caught up.</p>}
      </div>
    </>
  );
}
