const calendarDate = (value) => {
  const key = String(value || "").slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(key)) {
    const error = new Error("A valid calendar date is required.");
    error.status = 422;
    throw error;
  }
  const date = new Date(`${key}T00:00:00.000Z`);
  if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== key) {
    const error = new Error("A valid calendar date is required.");
    error.status = 422;
    throw error;
  }
  return date;
};

const dateKey = (date) => new Date(date).toISOString().slice(0, 10);

const mondayUtc = (date = new Date()) => {
  const monday = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  monday.setUTCDate(monday.getUTCDate() - ((monday.getUTCDay() + 6) % 7));
  return monday;
};

const legacyShiftDate = (weekOffset = 0, dayIndex = 0, now = new Date()) => {
  const date = mondayUtc(now);
  date.setUTCDate(date.getUTCDate() + (Number(weekOffset) || 0) * 7 + (Number(dayIndex) || 0));
  return date;
};

const weekFieldsForDate = (date, now = new Date()) => {
  const actual = new Date(date);
  const baseMonday = mondayUtc(now);
  const actualMonday = mondayUtc(actual);
  return {
    weekOffset: Math.round((actualMonday - baseMonday) / 604800000),
    dayIndex: (actual.getUTCDay() + 6) % 7,
  };
};

module.exports = { calendarDate, dateKey, legacyShiftDate, weekFieldsForDate };
