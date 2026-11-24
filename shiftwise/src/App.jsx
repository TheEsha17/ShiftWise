
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import ShiftWise from "./components/ShiftWise";
import Login from "./components/Login";
import AdminDashboard from "./components/admin/AdminDashboard";
import EmployeeDashboard from "./dashboard/EmployeeDashboard";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<ShiftWise />} />
        <Route path="/login" element={<Login />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/employee" element={<EmployeeDashboard />} />
        <Route path="/employee/:section" element={<EmployeeDashboard />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
