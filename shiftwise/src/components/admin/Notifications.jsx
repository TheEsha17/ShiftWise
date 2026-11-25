import { useState } from "react";
import { useAdmin, Tabs } from "./AdminStore";
import api from "../../api/axios";

export default function Notifications() {
  const { N, reload, toast } = useAdmin(), [f, setF] = useState("All"), l = N.filter((n) => f === "All" || !n.rd);
  const markRead = async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      await reload();
    } catch (error) {
      toast(error.response?.data?.message || "Could not update notification.");
    }
  };
  const markAllRead = async () => {
    try {
      await api.patch("/notifications/read-all");
      await reload();
      toast("All marked as read");
    } catch (error) {
      toast(error.response?.data?.message || "Could not update notifications.");
    }
  };
  return (
    <>
      <h1>Notifications</h1><p className="sub">Updates that need your attention.</p>
      <div className="cd">
        <div className="hd"><Tabs opts={["All", "Unread"]} cur={f} on={setF} /><button className="bt o s" onClick={markAllRead}>Mark all as read</button></div>
        {l.map((n) => (
          <div key={n.id} className={"rw nt" + (n.rd ? " rd" : "")}>
            <div className="f1"><b>{n.t}</b><br /><small>{n.x}</small><br /><small>{n.w}</small></div>
            {!n.rd && <button className="bt o s" onClick={() => markRead(n.id)}>Mark as read</button>}
          </div>
        ))}
        {!l.length && <p className="mut">You’re all caught up.</p>}
      </div>
    </>
  );
}
