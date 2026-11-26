const { test } = require("node:test");
const assert = require("node:assert/strict");
const { calendarDate, dateKey, legacyShiftDate, weekFieldsForDate } = require("../utils/shiftDate");

test("calendar dates are stored at UTC midnight without shifting the selected day", () => {
  const selected = calendarDate("2026-11-27");
  assert.equal(selected.toISOString(), "2026-11-27T00:00:00.000Z");
  assert.equal(dateKey(selected), "2026-11-27");
});

test("date-only parsing preserves the calendar portion of ISO timestamps", () => {
  assert.equal(dateKey(calendarDate("2026-12-01T00:00:00.000Z")), "2026-12-01");
  assert.throws(() => calendarDate("2026-02-30"), /valid calendar date/);
});

test("legacy week and weekday records remain readable while new offsets derive from actual dates", () => {
  const today = calendarDate("2026-11-26");
  assert.equal(dateKey(legacyShiftDate(0, 4, today)), "2026-11-27");
  assert.deepEqual(weekFieldsForDate(calendarDate("2026-12-01"), today), { weekOffset: 1, dayIndex: 1 });
});
