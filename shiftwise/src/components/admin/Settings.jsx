import { useState } from "react";
import { useAdmin } from "./AdminStore";

const DEFAULT_PREFERENCES = [
  ["Pending request alerts", true],
  ["Daily attendance summary", true],
  ["Weekly schedule email", false],
  ["Flag duplicate assignments", true],
];
const PREFERENCES_KEY = "shiftwisePreferences";

function readPreferences() {
  try {
    const saved = JSON.parse(localStorage.getItem(PREFERENCES_KEY));
    if (Array.isArray(saved)) {
      return DEFAULT_PREFERENCES.map(([label, fallback], i) => [label, typeof saved[i] === "boolean" ? saved[i] : fallback]);
    }
  } catch {}
  return DEFAULT_PREFERENCES;
}

export default function Settings() {
  const { toast } = useAdmin();
  const [preferences, setPreferences] = useState(readPreferences);
  const flip = (i) => {
    const next = preferences.map(([label, enabled], j) => [label, j === i ? !enabled : enabled]);
    setPreferences(next);
    try { localStorage.setItem(PREFERENCES_KEY, JSON.stringify(next.map(([, enabled]) => enabled))); } catch {}
    toast(`${next[i][0]} ${next[i][1] ? "on" : "off"}`);
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
