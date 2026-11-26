const { test, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const { weekFieldsForDate } = require("../utils/shiftDate");

let shiftRecords;
let duplicate;
let created;
let assignmentCountFilters;

const fakeShift = {
  find() { return Promise.resolve(shiftRecords); },
  async findOne() { return duplicate; },
  async create(payload) {
    created = payload;
    return { _id: "created-shift", ...payload };
  },
};
const fakeAssignment = {
  async countDocuments(filter) {
    assignmentCountFilters.push(filter);
    return 1;
  },
};

for (const [relativePath, exports] of [
  ["../models/Shift", fakeShift],
  ["../models/ShiftAssignment", fakeAssignment],
]) {
  const id = require.resolve(relativePath);
  require.cache[id] = { id, filename: id, loaded: true, exports, children: [], paths: [] };
}
const controller = require("../controllers/shiftController");

const response = () => ({
  statusCode: 200,
  status(code) { this.statusCode = code; return this; },
  json(payload) { this.payload = payload; return this; },
});
const invoke = async (handler, req, res = response()) => {
  await handler(req, res, (error) => { throw error; });
  return res;
};

beforeEach(() => {
  shiftRecords = [{
    _id: "shift-1",
    shiftDate: new Date("2026-11-27T00:00:00.000Z"),
    weekOffset: -40,
    dayIndex: 1,
    startTime: "07:00",
    staffRequired: 2,
    toObject() {
      return { _id: this._id, shiftDate: this.shiftDate, weekOffset: this.weekOffset, dayIndex: this.dayIndex, startTime: this.startTime, staffRequired: this.staffRequired };
    },
  }];
  duplicate = null;
  created = null;
  assignmentCountFilters = [];
});

test("shift listing returns stored calendar dates and counts assignments on that exact date", async () => {
  const result = await invoke(controller.list, { query: {} });
  assert.equal(result.payload.shifts[0].shiftDate, "2026-11-27");
  assert.equal(result.payload.shifts[0].dayIndex, 4);
  assert.equal(result.payload.shifts[0].assignedCount, 1);
  assert.equal(result.payload.shifts[0].openSlots, 1);
  assert.equal(assignmentCountFilters[0].assignedDate.toISOString(), "2026-11-27T00:00:00.000Z");
});

test("shift creation persists the submitted date and derives weekday metadata from it", async () => {
  const result = await invoke(controller.create, {
    body: {
      name: "Early shift",
      type: "Early",
      startTime: "07:00",
      endTime: "15:00",
      department: "Bar",
      location: "Downtown",
      staffRequired: 2,
      shiftDate: "2026-11-27",
      dayIndex: 1,
      weekOffset: -40,
    },
  });
  assert.equal(result.statusCode, 201);
  assert.equal(created.shiftDate.toISOString(), "2026-11-27T00:00:00.000Z");
  assert.deepEqual(
    { weekOffset: created.weekOffset, dayIndex: created.dayIndex },
    weekFieldsForDate(created.shiftDate)
  );
});

test("shift creation preserves a selected date across a month and planner-week boundary", async () => {
  const result = await invoke(controller.create, {
    body: {
      name: "Mid shift",
      type: "Mid",
      startTime: "11:00",
      endTime: "19:00",
      department: "Bar",
      location: "Downtown",
      staffRequired: 1,
      shiftDate: "2026-12-01",
    },
  });
  assert.equal(result.statusCode, 201);
  assert.equal(created.shiftDate.toISOString(), "2026-12-01T00:00:00.000Z");
  assert.deepEqual(
    { weekOffset: created.weekOffset, dayIndex: created.dayIndex },
    weekFieldsForDate(created.shiftDate)
  );
  assert.equal(created.dayIndex, 1);
});

test("identical shifts on the same date are rejected before creating another record", async () => {
  duplicate = { _id: "existing-shift" };
  const result = await invoke(controller.create, {
    body: {
      name: "Early shift",
      type: "Early",
      startTime: "07:00",
      endTime: "15:00",
      department: "Bar",
      location: "Downtown",
      staffRequired: 2,
      shiftDate: "2026-11-27",
    },
  });
  assert.equal(result.statusCode, 409);
  assert.equal(created, null);
});
