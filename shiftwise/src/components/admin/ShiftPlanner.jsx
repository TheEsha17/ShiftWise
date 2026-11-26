import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useAdmin, D, DP, LC, T, dd, Modal } from "./AdminStore";
import api from "../../api/axios";
import { addDateKeyDays, displayedWeekdayDateKey, fullDateLabel, localDateKey, mondayDateKey, weekdayIndexForDateKey, weekOffsetForDateKey } from "../../utils/calendarDate";

const SF = [["shiftDate", "Day and date", 0, []], ["type", "Shift type", 0, Object.keys(T)], ["s", "Start time", "time"], ["e", "End time", "time"], ["dept", "Department", 0, DP], ["loc", "Location", 0, LC], ["need", "Staff required", "number"]];

export default function ShiftPlanner() {
  const { S, reload, log, toast } = useAdmin();
  const [wo, setWo] = useState(0), [m, setM] = useState(null); // m = {sh} (sh undefined = new shift)
  const ws = S.filter((s) => s.wk === wo);
  const todayKey = localDateKey();
  const dateOptions = D.map((_, dayIndex) => {
    const value = displayedWeekdayDateKey(wo, dayIndex);
    return { value, label: fullDateLabel(value) };
  });
  if (m?.sh?.dateKey && !dateOptions.some((option) => option.value === m.sh.dateKey)) {
    dateOptions.push({ value: m.sh.dateKey, label: fullDateLabel(m.sh.dateKey) });
  }
  const defaultDate = dateOptions.find((option) => option.value === todayKey)?.value || dateOptions[0]?.value;

  const save = async (o) => {
    if (o.e <= o.s) return toast("End time must be after start time");
    const sh = m.sh, need = Math.max(1, +o.need || 1);
    if (sh && need < sh.as.length) return toast(`${sh.as.length} already assigned. Unassign someone first`);
    if (!o.shiftDate) return toast("Choose a valid shift date");
    const weekOffset = weekOffsetForDateKey(o.shiftDate);
    const payload = {
      name: `${o.type} shift`,
      type: o.type,
      startTime: o.s,
      endTime: o.e,
      department: o.dept,
      location: o.loc,
      staffRequired: need,
      shiftDate: o.shiftDate,
      weekOffset,
      dayIndex: weekdayIndexForDateKey(o.shiftDate),
    };
    try {
      if (sh) await api.patch(`/shifts/${sh.id}`, payload);
      else await api.post("/shifts", payload);
      await reload();
      setWo(weekOffset);
      log(`Schedule updated: ${fullDateLabel(o.shiftDate)} ${o.type} shift ${sh ? "edited" : "created"}`);
      toast(sh ? "Shift updated" : "Shift created");
      setM(null);
    } catch (error) {
      const response = error.response?.data;
      const details = Array.isArray(response?.errors)
        ? response.errors.map(({ field, message }) => `${field}: ${message}`).join("; ")
        : "";
      toast(details
        ? `${response.message || "Could not save shift."}: ${details}`
        : response?.message || "Could not save shift.");
    }
  };

  return (
    <>
      <h1>Shift Planner</h1>
      <p className="sub">Plan the week and see where cover is still needed.</p>
      <div className="cd">
        <div className="hd">
          <h2>Weekly schedule</h2>
          <div className="ac">
            <button className="ib" aria-label="Previous week" onClick={() => setWo(wo - 1)}><ChevronLeft /></button>
            <span>{dd(0, wo)} – {dd(6, wo)}</span>
            <button className="ib" aria-label="Next week" onClick={() => setWo(wo + 1)}><ChevronRight /></button>
            <button className="bt" onClick={() => setM({})}>+ New shift</button>
          </div>
        </div>
        <div className="wk">
          {D.map((n, d) => {
            const sh = ws.filter((s) => s.day === d).sort((a, b) => (a.s < b.s ? -1 : 1)), open = sh.reduce((a, s) => a + s.need - s.as.length, 0);
            const calendarDate = addDateKeyDays(mondayDateKey(todayKey), wo * 7 + d);
            return (
              <div key={n} className={"dc" + (calendarDate === todayKey ? " td" : "")}>
                <small>{fullDateLabel(calendarDate)}</small>
                {sh.map((s) => (
                  <button key={s.id} className="ch" style={{ "--c": T[s.type][2], "--t": T[s.type][3] }} onClick={() => setM({ sh: s })}>
                    {s.s}–{s.e}<br /><small>{s.dept} · {s.as.length}/{s.need}</small>
                  </button>
                ))}
                {!sh.length && <small>No shifts</small>}
                <small style={{ marginTop: "auto" }}>{sh.length ? open + " open" : ""}</small>
              </div>
            );
          })}
        </div>
        <div className="lgd" style={{ marginTop: 12 }}>
          {Object.keys(T).map((k) => <small key={k}><s style={{ background: T[k][2] }} />{k} {T[k][0]}–{T[k][1]}</small>)}
          <small>Tap a shift to edit. “2/3” means 2 of 3 staff assigned.</small>
        </div>
      </div>
      {m && (
        <Modal key={m.sh?.id ?? "new"} title={m.sh ? "Edit shift" : "Create shift"} onSave={save} onClose={() => setM(null)}
          init={m.sh ? { ...m.sh, shiftDate: m.sh.dateKey } : { shiftDate: defaultDate, type: "Early", s: "07:00", e: "15:00", dept: DP[0], loc: LC[0], need: 2 }}
          fields={SF.map(([key, label, inputType, options]) => [key, label, inputType, key === "shiftDate" ? dateOptions : options])} />
      )}
    </>
  );
}
