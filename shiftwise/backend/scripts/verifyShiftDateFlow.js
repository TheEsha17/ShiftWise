require("dotenv").config();

const assert = require("node:assert/strict");
const mongoose = require("mongoose");
const { app } = require("../server");
const User = require("../models/User");

const databaseName = `shiftwise_date_test_${Date.now()}`;
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
  const data = await response.json();
  return { status: response.status, data };
};

const requireStatus = (result, expected, label) => {
  assert.equal(result.status, expected, `${label}: ${result.data.message || "unexpected response"}`);
};

async function run() {
  if (!process.env.MONGODB_URI || !process.env.JWT_SECRET) {
    throw new Error("MONGODB_URI and JWT_SECRET are required for the live date flow check.");
  }
  await mongoose.connect(process.env.MONGODB_URI, {
    dbName: databaseName,
    serverSelectionTimeoutMS: 10000,
  });
  if (mongoose.connection.name !== databaseName) {
    throw new Error("MongoDB did not connect to the isolated test database.");
  }

  const suffix = `${Date.now()}${Math.floor(Math.random() * 10000)}`;
  const adminEmail = `date.admin.${suffix}@example.com`;
  const employeeEmail = `date.employee.${suffix}@example.com`;
  const password = `ShiftWise-Test-${suffix}-Password`;
  await User.create([
    { fullName: "Date Flow Admin", email: adminEmail, password, role: "Admin", employmentStatus: "Active" },
    { fullName: "Date Flow Employee", email: employeeEmail, password, role: "Employee", employmentStatus: "Active" },
  ]);

  let port = await listen();
  const adminLogin = await request(port, "/auth/login", { method: "POST", body: { email: adminEmail, password, role: "Admin" } });
  requireStatus(adminLogin, 200, "temporary Admin login");
  const employeeLogin = await request(port, "/auth/login", { method: "POST", body: { email: employeeEmail, password, role: "Employee" } });
  requireStatus(employeeLogin, 200, "temporary Employee login");
  const adminToken = adminLogin.data.token;
  let employeeToken = employeeLogin.data.token;

  const shiftPayload = {
    name: "Early date verification shift",
    type: "Early",
    startTime: "04:13",
    endTime: "05:13",
    department: `Date QA ${suffix}`,
    location: `QA-${suffix}`,
    staffRequired: 1,
    shiftDate: "2026-11-27",
    weekOffset: -100,
    dayIndex: 1,
  };
  const created = await request(port, "/shifts", { token: adminToken, method: "POST", body: shiftPayload });
  requireStatus(created, 201, "create Friday shift");
  const shiftId = created.data.shift._id;

  const duplicate = await request(port, "/shifts", { token: adminToken, method: "POST", body: shiftPayload });
  requireStatus(duplicate, 409, "duplicate shift protection");

  let shiftList = await request(port, "/shifts?status=Active", { token: adminToken });
  requireStatus(shiftList, 200, "planner shift list");
  let listedShift = shiftList.data.shifts.find((shift) => shift._id === shiftId);
  assert.equal(listedShift.shiftDate, "2026-11-27");
  assert.equal(listedShift.openSlots, 1);

  const assignment = await request(port, "/assignments", {
    token: adminToken,
    method: "POST",
    body: { employee: employeeLogin.data.user._id, shift: shiftId, assignedDate: "2026-11-27" },
  });
  requireStatus(assignment, 201, "assign Friday shift");
  assert.equal(assignment.data.assignment.assignedDate.slice(0, 10), "2026-11-27");

  shiftList = await request(port, "/shifts?status=Active", { token: adminToken });
  listedShift = shiftList.data.shifts.find((shift) => shift._id === shiftId);
  assert.equal(listedShift.openSlots, 0, "planner availability reflects assignment data");

  const adminAssignments = await request(port, "/assignments", { token: adminToken });
  requireStatus(adminAssignments, 200, "Shift Assignments list");
  assert(adminAssignments.data.assignments.some((row) => row.shift?._id === shiftId && row.employee?._id === employeeLogin.data.user._id));

  const employeeAssignments = await request(port, "/assignments", { token: employeeToken });
  requireStatus(employeeAssignments, 200, "Employee schedule");
  assert(employeeAssignments.data.assignments.some((row) => row.shift?._id === shiftId && row.assignedDate.slice(0, 10) === "2026-11-27"));

  await closeServer();
  await mongoose.disconnect();
  await mongoose.connect(process.env.MONGODB_URI, { dbName: databaseName, serverSelectionTimeoutMS: 10000 });
  port = await listen();
  const relogin = await request(port, "/auth/login", { method: "POST", body: { email: employeeEmail, password, role: "Employee" } });
  requireStatus(relogin, 200, "Employee login after reconnect");
  employeeToken = relogin.data.token;
  const persistedAssignments = await request(port, "/assignments", { token: employeeToken });
  requireStatus(persistedAssignments, 200, "persisted Employee schedule");
  assert(persistedAssignments.data.assignments.some((row) => row.shift?._id === shiftId && row.assignedDate.slice(0, 10) === "2026-11-27"));

  console.log("Live ShiftWise date flow passed: create, de-duplicate, planner, assign, employee schedule, reconnect, and re-login.");
}

run()
  .catch((error) => {
    console.error(`Live shift date flow failed: ${error.message}`);
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
