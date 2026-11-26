const { test, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const ownerId = "aaaaaaaaaaaaaaaaaaaaaaaa";
const otherId = "bbbbbbbbbbbbbbbbbbbbbbbb";
let records;
let shiftChangeRequests;
let swapRequests;

const matches = (record, filter) => Object.entries(filter).every(([key, value]) => record[key] === value);
const fakeNotification = {
  find(filter) {
    return {
      sort() {
        return Promise.resolve(records.filter((record) => matches(record, filter)).map((record) => ({ ...record })));
      },
    };
  },
  async findOneAndUpdate(filter, update) {
    const record = records.find((item) => matches(item, filter));
    if (!record) return null;
    Object.assign(record, update.$set);
    return { ...record };
  },
  async updateMany(filter, update) {
    let modifiedCount = 0;
    for (const record of records) {
      if (matches(record, filter)) {
        Object.assign(record, update.$set);
        modifiedCount += 1;
      }
    }
    return { modifiedCount };
  },
  async create(data) {
    const record = { _id: `notification-${records.length + 1}`, ...data };
    records.push(record);
    return record;
  },
};

const notificationModelPath = require.resolve("../models/Notification");
require.cache[notificationModelPath] = {
  id: notificationModelPath,
  filename: notificationModelPath,
  loaded: true,
  exports: fakeNotification,
  children: [],
  paths: [],
};
const controller = require("../controllers/notificationController");

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
  records = [
    { _id: "change-notification", recipient: ownerId, title: "Shift change", read: false },
    { _id: "swap-notification", recipient: ownerId, title: "Shift swap", read: false },
    { _id: "other-user-notification", recipient: otherId, title: "Private", read: false },
  ];
  shiftChangeRequests = [{ _id: "change-request", status: "Pending" }];
  swapRequests = [
    { _id: "incoming-swap", dir: "incoming", status: "Pending" },
    { _id: "outgoing-swap", dir: "outgoing", status: "Pending" },
  ];
});

test("read notifications remain in All and are excluded from Unread for their owner", async () => {
  const initialCount = records.length;
  await invoke(controller.markRead, {
    params: { id: "change-notification" },
    user: { _id: ownerId },
  });

  const all = await invoke(controller.list, { user: { _id: ownerId, role: "Admin" }, query: {} });
  const unread = await invoke(controller.list, { user: { _id: ownerId, role: "Admin" }, query: { read: "false" } });
  assert.deepEqual(all.payload.notifications.map((item) => item._id), ["change-notification", "swap-notification"]);
  assert.equal(all.payload.notifications.find((item) => item._id === "change-notification").read, true);
  assert.deepEqual(unread.payload.notifications.map((item) => item._id), ["swap-notification"]);
  assert.equal(records.length, initialCount, "marking a notification read must not add or delete records");
});

test("reading a notification cannot update shift change or incoming/outgoing swap requests", async () => {
  await invoke(controller.markRead, {
    params: { id: "swap-notification" },
    user: { _id: ownerId },
  });
  const all = await invoke(controller.list, { user: { _id: ownerId, role: "Employee" }, query: {} });
  const unread = await invoke(controller.list, { user: { _id: ownerId, role: "Employee" }, query: { read: "false" } });
  assert.deepEqual(all.payload.notifications.map((item) => item._id), ["change-notification", "swap-notification"]);
  assert.deepEqual(unread.payload.notifications.map((item) => item._id), ["change-notification"]);
  assert.deepEqual(shiftChangeRequests, [{ _id: "change-request", status: "Pending" }]);
  assert.deepEqual(swapRequests.map((request) => request.status), ["Pending", "Pending"]);
});

test("read updates are recipient-scoped, including mark all", async () => {
  const nonOwner = await invoke(controller.markRead, {
    params: { id: "other-user-notification" },
    user: { _id: ownerId },
  });
  assert.equal(nonOwner.statusCode, 404);

  await invoke(controller.markAllRead, { user: { _id: ownerId } });
  assert.equal(records.find((record) => record.recipient === ownerId && record._id === "change-notification").read, true);
  assert.equal(records.find((record) => record.recipient === ownerId && record._id === "swap-notification").read, true);
  assert.equal(records.find((record) => record.recipient === otherId).read, false);
  const all = await invoke(controller.list, { user: { _id: ownerId, role: "Employee" }, query: {} });
  const unread = await invoke(controller.list, { user: { _id: ownerId, role: "Employee" }, query: { read: "false" } });
  assert.equal(all.payload.notifications.length, 2);
  assert.equal(unread.payload.notifications.length, 0);
  assert.deepEqual(shiftChangeRequests.map((request) => request.status), ["Pending"]);
  assert.deepEqual(swapRequests.map((request) => request.status), ["Pending", "Pending"]);
});

test("Admin notification listing stays scoped to the signed-in Admin", async () => {
  const result = await invoke(controller.list, {
    user: { _id: ownerId, role: "Admin" },
    query: { recipient: otherId },
  });
  assert.deepEqual(result.payload.notifications.map((item) => item.recipient), [ownerId, ownerId]);
});

