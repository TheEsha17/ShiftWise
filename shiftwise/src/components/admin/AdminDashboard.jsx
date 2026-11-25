import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { LayoutDashboard, Users, CalendarDays, UserCheck, Repeat, Sun, Clock, BarChart3, Bell, Settings as SettingsIcon, LogOut, Search, ChevronDown, SunMoon, UserRoundPlus } from "lucide-react";
import "./admin.css";
import { AdminProvider, useAdmin } from "./AdminStore";
import EmployeeManagement from "./EmployeeManagement";
import ShiftPlanner from "./ShiftPlanner";
import Overview from "./Overview";
import ShiftAssignments from "./ShiftAssignments";
import ShiftChangeRequests from "./ShiftChangeRequests";
import LeaveManagement from "./LeaveManagement";
import Attendance from "./Attendance";
import ReportsAnalytics from "./ReportsAnalytics";
import Notifications from "./Notifications";
import Settings from "./Settings";
import AccessRequests from "./AccessRequests";

const NAV = [["overview", "Overview", LayoutDashboard], ["access", "Access Requests", UserRoundPlus], ["employees", "Employee Management", Users], ["planner", "Shift Planner", CalendarDays], ["assign", "Shift Assignments", UserCheck], ["swaps", "Shift Change Requests", Repeat], ["leave", "Leave Management", Sun], ["attend", "Attendance", Clock], ["reports", "Reports & Analytics", BarChart3], ["notifs", "Notifications", Bell], ["settings", "Settings", SettingsIcon]];
const PAGES = { overview: Overview, access: AccessRequests, employees: EmployeeManagement, planner: ShiftPlanner, assign: ShiftAssignments, swaps: ShiftChangeRequests, leave: LeaveManagement, attend: Attendance, reports: ReportsAnalytics, notifs: Notifications, settings: Settings };

function Shell() {
  const { R, L, N, accessRequests, toast } = useAdmin();
  const navigate = useNavigate();
  const [pg, setPg] = useState("overview"), [q, setQ] = useState("");
  const user = JSON.parse(localStorage.getItem("shiftwiseUser") || sessionStorage.getItem("shiftwiseUser") || "{}");
  const name = user.role === "Admin" && user.name ? user.name : "Admin";
  const initials = name.trim().split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase();
  const [theme, setTheme] = useState(() => { try { return localStorage.getItem("sw-theme") || undefined; } catch { return undefined; } });
  const unread = N.filter((n) => !n.rd).length;
  const bd = { access: accessRequests.filter((request) => request.status === "Pending").length, swaps: R.filter((r) => r.st === "Pending").length, leave: L.filter((r) => r.st === "Pending").length, notifs: unread };
  const flip = () => {
    const dark = theme ? theme === "dark" : matchMedia("(prefers-color-scheme:dark)").matches, t = dark ? "light" : "dark";
    setTheme(t); try { localStorage.setItem("sw-theme", t); } catch {}
    toast(dark ? "Light mode on" : "Dark mode on");
  };
  const logout = () => {
    localStorage.removeItem("shiftwiseUser");
    localStorage.removeItem("shiftwiseToken");
    sessionStorage.removeItem("shiftwiseUser");
    sessionStorage.removeItem("shiftwiseToken");
    navigate("/");
  };
  const Page = PAGES[pg], title = NAV.find((n) => n[0] === pg)[1];
  return (
    <div className="sw-admin" data-theme={theme}>
      <aside className="sd">
        <div className="logo"><span className="lg" /><span className="lgt">ShiftWise</span><span className="tag">Admin</span></div>
        {NAV.map(([k, l, Ic]) => (
          <button key={k} className={"nv" + (k === pg ? " on" : "")} title={l} onClick={() => setPg(k)}>
            <Ic /><span className="lb">{l}</span>{bd[k] ? <span className="bd">{bd[k]}</span> : null}
          </button>
        ))}
        <div className="fl" />
        <button className="nv" onClick={logout}><LogOut /><span className="lb">Logout</span></button>
      </aside>
      <main className="mn">
        <header className="tb">
          <div><div className="ser">Good afternoon, {name}</div><small className="mut">{new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</small></div>
          <div className="tr">
            <div className="sb2"><Search /><input className="in gs" placeholder="Search pages or employees" onKeyDown={(e) => { if (e.key === "Enter") { setQ(e.target.value); setPg("employees"); } }} /></div>
            <button className="ib" aria-label="Switch light or dark theme" onClick={flip}><SunMoon /></button>
            <button className="ib" aria-label="Notifications" onClick={() => setPg("notifs")}><Bell />{unread ? <u>{unread}</u> : null}</button>
            <div className="pf"><span className="av">{initials}</span><span className="lb">{name}</span><ChevronDown /></div>
          </div>
        </header>
        <div className="pg">
          {Page ? <Page query={q} go={setPg} /> : <><h1>{title}</h1><p className="sub">This page isn’t added yet.</p></>}
        </div>
      </main>
    </div>
  );
}

export default function AdminDashboard() {
  return <AdminProvider><Shell /></AdminProvider>;
}
