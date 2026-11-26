export const localDateKey = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const dateKeyFromValue = (value) => {
  if (typeof value === 'string') return value.slice(0, 10);
  if (value instanceof Date) return localDateKey(value);
  return '';
};

export const dateFromKey = (dateKey) => {
  const [year, month, day] = dateKey.split('-').map(Number);
  return new Date(year, month - 1, day, 12);
};

export const addDateKeyDays = (dateKey, amount) => {
  const [year, month, day] = dateKey.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day + amount)).toISOString().slice(0, 10);
};

export const mondayDateKey = (dateKey) => {
  const [year, month, day] = dateKey.split('-').map(Number);
  const weekday = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
  return addDateKeyDays(dateKey, -((weekday + 6) % 7));
};

export const legacyShiftDateKey = (weekOffset = 0, weekdayIndex = 0, fromDate = new Date()) => (
  addDateKeyDays(mondayDateKey(localDateKey(fromDate)), weekOffset * 7 + weekdayIndex)
);

export const weekdayIndexForDateKey = (dateKey) => {
  const [year, month, day] = dateKey.split('-').map(Number);
  return (new Date(Date.UTC(year, month - 1, day)).getUTCDay() + 6) % 7;
};

export const weekOffsetForDateKey = (dateKey, todayKey = localDateKey()) => (
  (Date.parse(`${mondayDateKey(dateKey)}T00:00:00Z`) - Date.parse(`${mondayDateKey(todayKey)}T00:00:00Z`)) / 604800000
);

export const dateKeyForWeekday = (weekdayIndex, fromDate = new Date()) => {
  const todayKey = localDateKey(fromDate);
  const delta = (weekdayIndex - weekdayIndexForDateKey(todayKey) + 7) % 7;
  const dateKey = addDateKeyDays(todayKey, delta);
  return dateKey < todayKey ? addDateKeyDays(dateKey, 7) : dateKey;
};

export const displayedWeekdayDateKey = (weekOffset, weekdayIndex, fromDate = new Date()) => {
  const todayKey = localDateKey(fromDate);
  const weekKey = addDateKeyDays(mondayDateKey(todayKey), weekOffset * 7);
  let dateKey = addDateKeyDays(weekKey, weekdayIndex);
  while (dateKey < todayKey) dateKey = addDateKeyDays(dateKey, 7);
  return dateKey;
};

export const fullDateLabel = (dateKey, locale = 'en-GB') => dateFromKey(dateKey).toLocaleDateString(locale, {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});
