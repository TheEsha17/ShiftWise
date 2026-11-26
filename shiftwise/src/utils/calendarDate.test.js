import { test } from 'node:test';
import assert from 'node:assert/strict';
import { dateKeyForWeekday, displayedWeekdayDateKey, fullDateLabel, localDateKey, weekOffsetForDateKey } from './calendarDate.js';

const thursday = new Date(2026, 10, 26, 12);

test('passed weekdays roll to their next calendar date while upcoming weekdays stay this week', () => {
  assert.equal(dateKeyForWeekday(1, thursday), '2026-12-01');
  assert.equal(dateKeyForWeekday(4, thursday), '2026-11-27');
  assert.equal(dateKeyForWeekday(0, thursday), '2026-11-30');
});

test('planner weekday options avoid past dates and show a complete localized date', () => {
  const tuesday = displayedWeekdayDateKey(0, 1, thursday);
  const friday = displayedWeekdayDateKey(0, 4, thursday);
  const monday = displayedWeekdayDateKey(0, 0, thursday);
  assert.deepEqual([tuesday, friday, monday], ['2026-12-01', '2026-11-27', '2026-11-30']);
  assert.equal(fullDateLabel(tuesday), 'Tuesday, 1 December 2026');
  assert.equal(fullDateLabel(friday), 'Friday, 27 November 2026');
});

test('date arithmetic crosses month and year boundaries and computes planner weeks', () => {
  const yearEnd = new Date(2026, 11, 31, 12);
  assert.equal(localDateKey(yearEnd), '2026-12-31');
  assert.equal(dateKeyForWeekday(0, yearEnd), '2027-01-04');
  assert.equal(weekOffsetForDateKey('2026-12-01', '2026-11-26'), 1);
});
