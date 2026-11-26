require("dotenv").config();

const assert = require("node:assert/strict");
const mongoose = require("mongoose");
const { app } = require("../server");
const User = require("../models/User");

const databaseName = `shiftwise_swap_test_${Date.now()}`;
let server;

const listen = () => new Promise((resolve, reject) => {
  server = app.listen(0, "127.0.0.1", () => resolve(server.address().port));
  server.once("error", reject);
});
const closeServer = () => new Promise((resolve, reject) => {
  if (!server) return resolve();
  server.close((error) => error ? reject(error) : resolve());
  server = null;
});
const request = async (port, path, { token, method = "GET", body } = {}) => {
  const response = await fetch(`http://127.0.0.1:${port}/api${path}`, {
    method,
    headers: {
      ...(body ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  return { status: response.status, data: await response.json() };
};
const requireStatus = (result, expected, label) => {
  assert.equal(result.status, expected, `${label}: ${result.data.message || "unexpected response"}`);
};

async function run() {
  if (!process.env.MONGODB_URI || !process.env.JWT_SECRET) {
    throw new Error("MONGODB_URI and JWT_SECRET are required for the live swap badge check.");
  }
  await mongoose.connect(process.env.MONGODB_URI, { dbName: databaseName, serverSelectionTimeoutMS: 10000 });
  if (mongoose.connection.name !== databaseName) throw new Error("MongoDB did not connect to the isolated test database.");

  const suffix = `${Date.now()}${Math.floor(Math.random() * 10000)}`;
  const password = `ShiftWise-Swap-${suffix}-Password`;
  const emails = [`swap.admin.${suffix}@example.com`, `swap.a.${suffix}@example.com`, `swap.b.${suffix}@example.com`];
  await User.create([
    { fullName: "Swap Test Admin", email: emails[0], password, role: "Admin", employmentStatus: "Active" },
    { fullName: "Swap Test A", email: emails[1], password, role: "Employee", employmentStatus: "Active" },
    { fullName: "Swap Test B", email: emails[2], password, role: "Employee", employmentStatus: "Active" },
  ]);

  let port = await listen();
  const login = async (email, role) => {
    const result = await request(port, "/auth/login", { method: "POST", body: { email, password, role } });
    requireStatus(result, 200, `${role} login`);
    return result.data;
  };
  const admin = await login(emails[0], "Admin");
  const employeeA = await login(emails[1], "Employee");
  const employeeB = await login(emails[2], "Employee");

  const createShift = async (date, name, employeeId) => {
    const shift = await request(port, "/shifts", {
      token: admin.token,
      method: "POST",
      body: {
        name,
        type: "Early",
        startTime: "07:00",
        endTime: "15:00",
        department: `Swap QA ${suffix}`,
        location: `Swap-${suffix}`,
        staffRequired: 1,
        shiftDate: date,
      },
    });
    requireStatus(shift, 201, "create swap test shift");
    const assignment = await request(port, "/assignments", {
      token: admin.token,
      method: "POST",
      body: { employee: employeeId, shift: shift.data.shift._id, assignedDate: date },
    });
    requireStatus(assignment, 201, "assign swap test shift");
    return assignment.data.assignment._id;
  };

  let assignmentA = await createShift("2026-12-10", "Swap A shift", employeeA.user._id);
  let assignmentB = await createShift("2026-12-11", "Swap B shift", employeeB.user._id);

  const submit = async (requesterAssignment, targetAssignment) => {
    const result = await request(port, "/swaps", {
      token: employeeA.token,
      method: "POST",
      body: { requesterAssignment, targetAssignment },
    });
    requireStatus(result, 201, "submit swap request");
    return result.data.request._id;
  };
  const getSwaps = async (token) => {
    const result = await request(port, "/swaps", { token });
    requireStatus(result, 200, "swap request history");
    return result.data.requests;
  };
  const getNotifications = async (token) => {
    const result = await request(port, "/notifications", { token });
    requireStatus(result, 200, "notification list");
    return result.data.notifications;
  };
  const linkedNotification = (items, requestId, direction) => items.find((item) =>
    String(item.relatedSwapRequest) === String(requestId) && item.swapDirection === direction
  );

  const pendingId = await submit(assignmentA, assignmentB);
  let bNotifications = await getNotifications(employeeB.token);
  let incoming = linkedNotification(bNotifications, pendingId, "incoming");
  assert(incoming, "incoming notification is saved for Employee B and linked to the request");
  assert.equal(String(incoming.recipient), String(employeeB.user._id));
  assert.equal(incoming.read, false);
  let aNotifications = await getNotifications(employeeA.token);
  assert(linkedNotification(aNotifications, pendingId, "outgoing"), "Employee A receives an outgoing request notification");
  assert.equal((await getSwaps(employeeB.token)).find((item) => String(item._id) === String(pendingId)).status, "Pending");

  const markRead = await request(port, `/notifications/${incoming._id}/read`, { token: employeeB.token, method: "PATCH" });
  requireStatus(markRead, 200, "mark incoming notification read");
  assert.equal((await getSwaps(employeeB.token)).find((item) => String(item._id) === String(pendingId)).status, "Pending");
  assert(linkedNotification(await getNotifications(employeeB.token), pendingId, "incoming"), "read notification remains stored");

  const reject = await request(port, `/swaps/${pendingId}`, { token: employeeB.token, method: "PATCH", body: { status: "Rejected" } });
  requireStatus(reject, 200, "reject swap request");
  assert.equal((await getSwaps(employeeB.token)).find((item) => String(item._id) === String(pendingId)).status, "Rejected");

  const acceptedId = await submit(assignmentA, assignmentB);
  const accept = await request(port, `/swaps/${acceptedId}`, { token: employeeB.token, method: "PATCH", body: { status: "Accepted" } });
  requireStatus(accept, 200, "accept swap request");
  bNotifications = await getNotifications(employeeB.token);
  incoming = linkedNotification(bNotifications, acceptedId, "incoming");
  assert(incoming && incoming.read === false, "resolved notification remains unread in MongoDB");
  assert.equal((await getSwaps(employeeB.token)).find((item) => String(item._id) === String(acceptedId)).status, "Accepted");

  const aAssignments = await request(port, "/assignments", { token: employeeA.token });
  const bAssignments = await request(port, "/assignments", { token: employeeB.token });
  requireStatus(aAssignments, 200, "Employee A assignments after accepted swap");
  requireStatus(bAssignments, 200, "Employee B assignments after accepted swap");
  assignmentA = aAssignments.data.assignments[0]._id;
  assignmentB = bAssignments.data.assignments[0]._id;
  const rejectedId = await submit(assignmentA, assignmentB);
  const rejectAgain = await request(port, `/swaps/${rejectedId}`, { token: employeeB.token, method: "PATCH", body: { status: "Rejected" } });
  requireStatus(rejectAgain, 200, "reject another swap request");
  assert(linkedNotification(await getNotifications(employeeB.token), rejectedId, "incoming"), "rejected notification remains available");
  assert.equal((await getSwaps(employeeB.token)).find((item) => String(item._id) === String(rejectedId)).status, "Rejected");

  await closeServer();
  await mongoose.disconnect();
  await mongoose.connect(process.env.MONGODB_URI, { dbName: databaseName, serverSelectionTimeoutMS: 10000 });
  port = await listen();
  const employeeBAfterLogin = await login(emails[2], "Employee");
  const persistedRequests = await getSwaps(employeeBAfterLogin.token);
  assert.equal(persistedRequests.find((item) => String(item._id) === String(acceptedId)).status, "Accepted");
  assert.equal(persistedRequests.find((item) => String(item._id) === String(rejectedId)).status, "Rejected");
  const persistedNotifications = await getNotifications(employeeBAfterLogin.token);
  assert(linkedNotification(persistedNotifications, acceptedId, "incoming"));
  assert(linkedNotification(persistedNotifications, rejectedId, "incoming"));

  console.log("Live swap badge flow passed: linked notifications, read/status separation, resolved request history, reconnect, and re-login.");
}

run()
  .catch((error) => {
    console.error(`Live swap badge flow failed: ${error.message}`);
    process.exitCode = 1;
  })
  .finally(async () => {
    await closeServer().catch(() => {});
    if (mongoose.connection.readyState === 1 && mongoose.connection.name === databaseName) {
      await mongoose.connection.dropDatabase().catch((error) => {
        console.error(`Could not remove isolated test database: ${error.message}`);
        process.exitCode = 1;
      });
    }
    await mongoose.disconnect().catch(() => {});
  });
