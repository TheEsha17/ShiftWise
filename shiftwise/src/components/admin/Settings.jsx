import { useEffect, useState } from "react";
import { useAdmin } from "./AdminStore";
import api from "../../api/axios";

const DEFAULT_PREFERENCES = [
  ["Pending request alerts", true],
  ["Daily attendance summary", true],
  ["Weekly schedule email", false],
  ["Flag duplicate assignments", true],
];
export default function Settings() {
  const { toast } = useAdmin();
  const [preferences, setPreferences] = useState(DEFAULT_PREFERENCES);
  useEffect(() => {
    api.get("/settings")
      .then(({ data }) => {
        const saved = data.settings.find((setting) => setting.key === "adminPreferences")?.value;
        if (saved && typeof saved === "object") {
          setPreferences(DEFAULT_PREFERENCES.map(([label, fallback]) => [label, typeof saved[label] === "boolean" ? saved[label] : fallback]));
        }
      })
      .catch((error) => toast(error.response?.data?.message || "Could not load preferences."));
  }, []);
  const flip = async (i) => {
    const next = preferences.map(([label, enabled], j) => [label, j === i ? !enabled : enabled]);
    try {
      await api.put("/settings/adminPreferences", {
        scope: "Admin",
        value: Object.fromEntries(next),
      });
      setPreferences(next);
      toast(`${next[i][0]} ${next[i][1] ? "on" : "off"}`);
    } catch (error) {
      toast(error.response?.data?.message || "Could not save preference.");
    }
  };
  return (
    <>
      <h1>Settings</h1><p className="sub">Choose what ShiftWise tells you about.</p>
      <div className="cd">
        <h2 style={{ marginBottom: 8 }}>Preferences</h2>
        {preferences.map(([label, enabled], i) => <div className="rw" key={label}><span className="f1">{label}</span><button type="button" role="switch" aria-label={label} aria-checked={enabled} className={`tg${enabled ? " on" : ""}`} onClick={() => flip(i)} /></div>)}
      </div>
    </>
  );
}
