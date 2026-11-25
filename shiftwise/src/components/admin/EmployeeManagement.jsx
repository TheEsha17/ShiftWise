import { useState, useEffect } from "react";
import { Search } from "lucide-react";
import { useAdmin, DP, LC, Pill, Modal, av } from "./AdminStore";
import api from "../../api/axios";

const EF = [["name", "Full name"], ["dept", "Department", 0, DP], ["loc", "Location", 0, LC], ["type", "Contract", 0, ["Full-time", "Part-time", "Casual"]], ["email", "Email", "email"], ["password", "Initial password", "password"], ["status", "Status", 0, ["Active", "On leave", "Inactive"]]];

export default function EmployeeManagement({ query = "" }) {
  const { E, S, reload, log, toast } = useAdmin();
  const [q, setQ] = useState(query), [dept, setDept] = useState("All"), [m, setM] = useState(null); // m = {mode:"add"|"edit"|"view", e}
  useEffect(() => setQ(query), [query]);
  const l = E.filter((e) => (dept === "All" || e.dept === dept) && (e.name + e.code + e.loc + e.email).toLowerCase().includes(q.toLowerCase()));

  const save = async (o) => {
    if (!o.name.trim()) return toast("Enter a name first");
    try {
      const payload = {
        fullName: o.name.trim(),
        department: o.dept,
        location: o.loc,
        contract: o.type,
        email: o.email.trim(),
        employmentStatus: o.status,
      };
      if (o.password) payload.password = o.password;
      if (m.e) {
        await api.patch(`/employees/${m.e.id}`, payload);
        log(`Updated details for ${o.name}`);
        toast("Employee updated");
      } else {
        if (!o.password || o.password.length < 6) return toast("Set an initial password of at least 6 characters.");
        await api.post("/employees", payload);
        log(`${o.name} added to the ${o.dept} team`);
        toast("Employee added");
      }
      await reload();
      setM(null);
    } catch (error) {
      toast(error.response?.data?.message || "Could not save employee.");
    }
  };

  return (
    <>
      <h1>Employee Management</h1>
      <p className="sub">{E.length} people across {new Set(E.map((employee) => employee.loc).filter(Boolean)).size} locations.</p>
      <div className="cd">
        <div className="bar">
          <div className="sb2" style={{ minWidth: 200 }}><Search /><input className="in" placeholder="Search by name, ID or location" value={q} onChange={(e) => setQ(e.target.value)} /></div>
          <select className="in" value={dept} onChange={(e) => setDept(e.target.value)}>{["All", ...DP].map((x) => <option key={x}>{x}</option>)}</select>
          <button className="bt" onClick={() => setM({ mode: "add" })}>+ Add employee</button>
        </div>
        <div className="tw employee-table-wrap">
          <table className="employee-table">
            <thead><tr><th>Employee</th><th>Department</th><th>Location</th><th>Contract</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {l.map((e) => (
                <tr key={e.id}>
                  <td><div className="who"><span className="av">{av(e.name)}</span><div><div className="ser">{e.name}</div><small className="mut">{e.code}</small></div></div></td>
                  <td>{e.dept}</td><td>{e.loc}</td><td>{e.type}</td><td><Pill s={e.status} /></td>
                  <td><div className="ac"><button className="bt o s" onClick={() => setM({ mode: "view", e })}>View</button><button className="bt o s" onClick={() => setM({ mode: "edit", e })}>Edit</button></div></td>
                </tr>
              ))}
              {!l.length && <tr><td colSpan={6} className="mut">No employees match. Try a different search or department.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {m && m.mode !== "view" && (
        <Modal key={m.e?.id ?? "new"} title={m.e ? "Edit employee" : "Add employee"} fields={m.e ? EF.filter(([key]) => key !== "password") : EF} onSave={save} onClose={() => setM(null)}
      init={m.e || { name: "", dept: DP[0], loc: LC[0], type: "Full-time", email: "", password: "", status: "Active" }} />
      )}
      {m && m.mode === "view" && (
        <div className="md" onClick={(ev) => ev.target === ev.currentTarget && setM(null)}>
          <div>
            <div className="who" style={{ marginBottom: 12 }}>
              <span className="av" style={{ width: 56, height: 56, fontSize: 18 }}>{av(m.e.name)}</span>
              <div><h2>{m.e.name}</h2><span className="mut">{m.e.dept} · {m.e.loc}</span></div>
            </div>
            {[["Email", m.e.email], ["Employee ID", m.e.code], ["Contract", m.e.type], ["Status", m.e.status], ["Shifts this week", S.filter((s) => s.wk === 0 && s.as.includes(m.e.id)).length]].map(([k, v]) => (
              <div className="kv" key={k}><span className="mut">{k}</span><span>{v}</span></div>
            ))}
            <div className="fa"><button className="bt o" onClick={() => setM(null)}>Close</button><button className="bt" onClick={() => setM({ mode: "edit", e: m.e })}>Edit</button></div>
          </div>
        </div>
      )}
    </>
  );
}
