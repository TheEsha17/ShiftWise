import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import api from "../api/axios";

export default function RequireAuth({ allowedRole, children }) {
  const location = useLocation();
  const [checking, setChecking] = useState(true);
  const [valid, setValid] = useState(false);
  const token =
    localStorage.getItem("shiftwiseToken") ||
    sessionStorage.getItem("shiftwiseToken");

  let user = null;
  try {
    user = JSON.parse(
      localStorage.getItem("shiftwiseUser") ||
      sessionStorage.getItem("shiftwiseUser") ||
      "null"
    );
  } catch {
    user = null;
  }

  useEffect(() => {
    if (!token || !user) {
      setChecking(false);
      return;
    }
    api.get("/auth/me")
      .then(({ data }) => {
        setValid(data.user.role === allowedRole);
      })
      .catch(() => setValid(false))
      .finally(() => setChecking(false));
  }, [token, allowedRole]);

  if (checking) return null;

  if (!token || !user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (!valid) {
    return <Navigate to={user.role === "Employee" ? "/employee" : "/admin"} replace />;
  }

  return children;
}
