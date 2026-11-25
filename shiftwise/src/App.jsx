
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import ShiftWise from "./components/ShiftWise";
import Login from "./components/Login";
import AccessRequest from "./components/AccessRequest";
import SetPassword from "./components/SetPassword";
import AdminDashboard from "./components/admin/AdminDashboard";
import EmployeeDashboard from "./dashboard/EmployeeDashboard";
import RequireAuth from "./components/RequireAuth";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<ShiftWise />} />
        <Route path="/login" element={<Login />} />
        <Route path="/request-access" element={<AccessRequest />} />
        <Route path="/set-password" element={<SetPassword />} />
        <Route path="/admin" element={<RequireAuth allowedRole="Admin"><AdminDashboard /></RequireAuth>} />
        <Route path="/employee" element={<RequireAuth allowedRole="Employee"><EmployeeDashboard /></RequireAuth>} />
        <Route path="/employee/:section" element={<RequireAuth allowedRole="Employee"><EmployeeDashboard /></RequireAuth>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
