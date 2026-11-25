const mongoose = require("mongoose");
const ShiftAssignment = require("../models/ShiftAssignment");
const ShiftSwapRequest = require("../models/ShiftSwapRequest");
const User = require("../models/User");
const LeaveRequest = require("../models/LeaveRequest");
const Notification = require("../models/Notification");
const notifyAdmins = require("../utils/notifyAdmins");
const asyncHandler = require("../utils/asyncHandler");

const DAY = 24 * 60 * 60 * 1000;
const todayUtc = () => {
  const date = new Date();
  date.setUTCHours(0, 0, 0, 0);
  return date;
};
const dayStart = (value) => {
  const date = new Date(value);
  date.setUTCHours(0, 0, 0, 0);
  return date;
};
const minutes = (value) => {
  const [hours, mins] = value.split(":").map(Number);
  return hours * 60 + mins;
};
const interval = (assignment) => {
  const start = dayStart(assignment.assignedDate).getTime() + minutes(assignment.shift.startTime) * 60 * 1000;
  let end = dayStart(assignment.assignedDate).getTime() + minutes(assignment.shift.endTime) * 60 * 1000;
  if (end <= start) end += DAY;
  return { start, end };
};
const overlaps = (first, second) => {
  const a = interval(first);
  const b = interval(second);
  return a.start < b.end && b.start < a.end;
};
const assignmentOwner = (assignment) => assignment.employee?._id || assignment.employee;
const fail = (status, message) => {
  const error = new Error(message);
  error.status = status;
  throw error;
};
const populateRequest = (query) => query
  .populate("requester", "fullName employeeId")
  .populate("targetEmployee", "fullName employeeId")
  .populate({ path: "requesterAssignment", populate: { path: "shift" } })
  .populate({ path: "targetAssignment", populate: { path: "shift" } });

const isUpcoming = (assignment) => dayStart(assignment.assignedDate) >= todayUtc();
const isActiveAssignment = (assignment) =>
  assignment &&
  assignment.status === "Confirmed" &&
  assignment.shift &&
  assignment.shift.status === "Active" &&
  isUpcoming(assignment);

async function assertPairCanSwap(requesterAssignment, targetAssignment, session) {
  const requesterId = assignmentOwner(requesterAssignment);
  const targetId = assignmentOwner(targetAssignment);
  const requesterDate = dayStart(requesterAssignment.assignedDate);
  const targetDate = dayStart(targetAssignment.assignedDate);
  const start = new Date(Math.min(requesterDate.getTime(), targetDate.getTime()) - DAY);
  const end = new Date(Math.max(requesterDate.getTime(), targetDate.getTime()) + 2 * DAY);
  const excluded = [requesterAssignment._id, targetAssignment._id];
  const existing = await ShiftAssignment.find({
    employee: { $in: [requesterId, targetId] },
    status: { $ne: "Cancelled" },
    assignedDate: { $gte: start, $lt: end },
    _id: { $nin: excluded },
  }).populate("shift").session(session);

  for (const assignment of existing) {
    if (!assignment.shift || assignment.shift.status !== "Active") continue;
    if (
      String(assignment.employee) === String(requesterId) &&
      overlaps(assignment, targetAssignment)
    ) {
      fail(409, "The colleague's shift overlaps another shift assigned to you.");
    }
    if (
      String(assignment.employee) === String(targetId) &&
      overlaps(assignment, requesterAssignment)
    ) {
      fail(409, "Your shift overlaps another shift assigned to the colleague.");
    }
  }

  const requesterInterval = interval(targetAssignment);
  const targetInterval = interval(requesterAssignment);
  const requesterLeaveEnd = new Date(requesterInterval.end - 1);
  const targetLeaveEnd = new Date(targetInterval.end - 1);
  requesterLeaveEnd.setUTCHours(23, 59, 59, 999);
  targetLeaveEnd.setUTCHours(23, 59, 59, 999);
  const requesterLeave = await LeaveRequest.findOne({
    employee: requesterId,
    status: "Approved",
    startDate: { $lte: requesterLeaveEnd },
    endDate: { $gte: dayStart(new Date(requesterInterval.start)) },
  }).session(session);
  const targetLeave = await LeaveRequest.findOne({
    employee: targetId,
    status: "Approved",
    startDate: { $lte: targetLeaveEnd },
    endDate: { $gte: dayStart(new Date(targetInterval.start)) },
  }).session(session);
  if (requesterLeave) fail(409, "The colleague's shift falls during your approved leave.");
  if (targetLeave) fail(409, "Your shift falls during the colleague's approved leave.");
}

async function loadPair(requesterAssignmentId, targetAssignmentId, requesterId, session) {
  if (String(requesterAssignmentId) === String(targetAssignmentId)) {
    fail(422, "Choose two different shift assignments.");
  }

  const requesterAssignment = await ShiftAssignment.findOne({
    _id: requesterAssignmentId,
    employee: requesterId,
    status: "Confirmed",
  }).populate("shift").session(session);
  const targetAssignment = await ShiftAssignment.findOne({
    _id: targetAssignmentId,
    status: "Confirmed",
  }).populate("shift").populate("employee", "fullName role employmentStatus").session(session);

  if (!requesterAssignment) fail(404, "Your confirmed shift assignment was not found.");
  if (!targetAssignment) fail(404, "The colleague's confirmed shift assignment was not found.");
  if (String(targetAssignment.employee?._id) === String(requesterId)) {
    fail(422, "You cannot request a swap with your own shift.");
  }
  if (requesterAssignment.swapRequest || targetAssignment.swapRequest) {
    fail(409, "One of these shifts already has a pending swap request.");
  }
  if (!isActiveAssignment(requesterAssignment) || !isActiveAssignment(targetAssignment)) {
    fail(409, "Only upcoming confirmed assignments on active shifts can be swapped.");
  }
  if (
    !targetAssignment.employee ||
    targetAssignment.employee.role !== "Employee" ||
    targetAssignment.employee.employmentStatus !== "Active"
  ) {
    fail(409, "The colleague is no longer eligible for a shift swap.");
  }
  if (
    String(requesterAssignment.shift._id) === String(targetAssignment.shift._id) &&
    dayStart(requesterAssignment.assignedDate).getTime() === dayStart(targetAssignment.assignedDate).getTime()
  ) {
    fail(422, "These assignments are the same shift occurrence and cannot be swapped.");
  }

  await assertPairCanSwap(requesterAssignment, targetAssignment, session);
  return { requesterAssignment, targetAssignment };
}

exports.list = asyncHandler(async (req, res) => {
  const isAdmin = req.user.role === "Admin";
  const from = todayUtc();
  const myAssignments = isAdmin ? [] : await ShiftAssignment.find({
      employee: req.user._id,
      status: "Confirmed",
      assignedDate: { $gte: from },
    }).populate("shift").sort({ assignedDate: 1 });
  const requestFilter = isAdmin
    ? {}
    : { $or: [{ requester: req.user._id }, { targetEmployee: req.user._id }] };
  const requests = await populateRequest(ShiftSwapRequest.find(requestFilter).sort({ createdAt: -1 }));

  res.json({
    myAssignments: myAssignments
      .filter((assignment) => assignment.shift?.status === "Active")
      .map((assignment) => ({
        ...assignment.toObject(),
        swapPending: Boolean(assignment.swapRequest),
      })),
    requests,
  });
});

exports.options = asyncHandler(async (req, res) => {
  const { requesterAssignment: assignmentId } = req.query;
  if (!mongoose.isValidObjectId(assignmentId)) {
    return res.status(422).json({ message: "Choose a valid shift assignment first." });
  }

  const requesterAssignment = await ShiftAssignment.findOne({
    _id: assignmentId,
    employee: req.user._id,
    status: "Confirmed",
    swapRequest: null,
  }).populate("shift");
  if (!requesterAssignment || !isActiveAssignment(requesterAssignment)) {
    return res.status(409).json({ message: "This shift is no longer eligible for a swap." });
  }

  const employees = await User.find({
    role: "Employee",
    employmentStatus: "Active",
    _id: { $ne: req.user._id },
  }).select("_id");
  const employeeIds = employees.map((employee) => employee._id);
  if (!employeeIds.length) return res.json({ assignments: [] });

  const candidates = await ShiftAssignment.find({
    employee: { $in: employeeIds },
    status: "Confirmed",
    swapRequest: null,
    assignedDate: { $gte: todayUtc() },
  }).populate("shift").populate("employee", "fullName employeeId role employmentStatus")
    .sort({ assignedDate: 1 });
  const available = [];
  for (const candidate of candidates) {
    if (!isActiveAssignment(candidate) || !candidate.employee || candidate.employee.employmentStatus !== "Active") continue;
    if (String(candidate.shift._id) === String(requesterAssignment.shift._id) &&
      dayStart(candidate.assignedDate).getTime() === dayStart(requesterAssignment.assignedDate).getTime()) continue;
    try {
      await assertPairCanSwap(requesterAssignment, candidate, null);
      available.push(candidate);
    } catch (error) {
      if (error.status !== 409) throw error;
    }
  }
  res.json({ assignments: available });
});

exports.create = asyncHandler(async (req, res) => {
  const session = await mongoose.startSession();
  let requestId;
  try {
    await session.withTransaction(async () => {
      const { requesterAssignment, targetAssignment } = await loadPair(
        req.body.requesterAssignment,
        req.body.targetAssignment,
        req.user._id,
        session
      );
      const request = new ShiftSwapRequest({
        requester: req.user._id,
        requesterAssignment: requesterAssignment._id,
        targetEmployee: targetAssignment.employee._id,
        targetAssignment: targetAssignment._id,
      });
      await request.save({ session });

      const requesterLock = await ShiftAssignment.updateOne(
        { _id: requesterAssignment._id, employee: req.user._id, status: "Confirmed", swapRequest: null },
        { $set: { swapRequest: request._id } },
        { session }
      );
      const targetLock = await ShiftAssignment.updateOne(
        { _id: targetAssignment._id, employee: targetAssignment.employee._id, status: "Confirmed", swapRequest: null },
        { $set: { swapRequest: request._id } },
        { session }
      );
      if (requesterLock.modifiedCount !== 1 || targetLock.modifiedCount !== 1) {
        fail(409, "One of these shifts has already been requested for a swap.");
      }

      await Notification.create([{
        recipient: targetAssignment.employee._id,
        title: "Incoming shift swap request",
        message: `${req.user.fullName} requested to swap a shift with you.`,
        type: "Request",
      }], { session });
      const shiftDescription = (assignment) =>
        `${assignment.shift.type} shift on ${dayStart(assignment.assignedDate).toISOString().slice(0, 10)} (${assignment.shift.startTime}–${assignment.shift.endTime})`;
      await notifyAdmins({
        title: "New shift swap request",
        message: `${req.user.fullName} requested to swap ${shiftDescription(requesterAssignment)} with ${targetAssignment.employee.fullName}'s ${shiftDescription(targetAssignment)}.`,
        type: "Request",
        session,
      });
      requestId = request._id;
    });
  } finally {
    await session.endSession();
  }
  const request = await populateRequest(ShiftSwapRequest.findById(requestId));
  res.status(201).json({ request });
});

exports.cancel = asyncHandler(async (req, res) => {
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      const request = await ShiftSwapRequest.findById(req.params.id).session(session);
      if (!request) fail(404, "Shift swap request not found.");
      if (String(request.requester) !== String(req.user._id)) {
        fail(403, "Only the requester can cancel this swap.");
      }
      if (request.status !== "Pending") fail(409, "Only pending swap requests can be cancelled.");

      request.status = "Cancelled";
      request.respondedAt = new Date();
      await request.save({ session });
      await ShiftAssignment.updateMany(
        { _id: { $in: [request.requesterAssignment, request.targetAssignment] }, swapRequest: request._id },
        { $unset: { swapRequest: 1 } },
        { session }
      );
    });
  } finally {
    await session.endSession();
  }
  res.json({ message: "Shift swap request cancelled." });
});

exports.respond = asyncHandler(async (req, res) => {
  const { status } = req.body;
  if (!["Accepted", "Rejected"].includes(status)) {
    return res.status(422).json({ message: "Status must be Accepted or Rejected." });
  }

  const session = await mongoose.startSession();
  let requestId;
  try {
    await session.withTransaction(async () => {
      const request = await ShiftSwapRequest.findById(req.params.id).session(session);
      if (!request) fail(404, "Shift swap request not found.");
      if (String(request.targetEmployee) !== String(req.user._id)) {
        fail(403, "Only the colleague receiving this request can respond.");
      }
      if (request.status !== "Pending") fail(409, "This shift swap request is no longer pending.");

      const requesterAssignment = await ShiftAssignment.findOne({
        _id: request.requesterAssignment,
        employee: request.requester,
        status: "Confirmed",
        swapRequest: request._id,
      }).populate("shift").session(session);
      const targetAssignment = await ShiftAssignment.findOne({
        _id: request.targetAssignment,
        employee: request.targetEmployee,
        status: "Confirmed",
        swapRequest: request._id,
      }).populate("shift").session(session);
      if (!requesterAssignment || !targetAssignment) {
        fail(409, "One of the assignments is no longer eligible for this swap.");
      }
      if (!isActiveAssignment(requesterAssignment) || !isActiveAssignment(targetAssignment)) {
        fail(409, "Only upcoming confirmed assignments on active shifts can be swapped.");
      }

      if (status === "Accepted") {
        await assertPairCanSwap(requesterAssignment, targetAssignment, session);
        const requesterUpdate = await ShiftAssignment.updateOne(
          { _id: requesterAssignment._id, employee: request.requester, swapRequest: request._id },
          { $set: { employee: request.targetEmployee }, $unset: { swapRequest: 1 } },
          { session }
        );
        const targetUpdate = await ShiftAssignment.updateOne(
          { _id: targetAssignment._id, employee: request.targetEmployee, swapRequest: request._id },
          { $set: { employee: request.requester }, $unset: { swapRequest: 1 } },
          { session }
        );
        if (requesterUpdate.modifiedCount !== 1 || targetUpdate.modifiedCount !== 1) {
          fail(409, "The assignments changed before the swap could be completed.");
        }
      } else {
        await ShiftAssignment.updateMany(
          { _id: { $in: [request.requesterAssignment, request.targetAssignment] }, swapRequest: request._id },
          { $unset: { swapRequest: 1 } },
          { session }
        );
      }

      request.status = status;
      request.respondedAt = new Date();
      await request.save({ session });
      await Notification.create([{
        recipient: request.requester,
        title: `Shift swap ${status.toLowerCase()}`,
        message: status === "Accepted"
          ? `${req.user.fullName} accepted your request and the shifts were exchanged.`
          : `${req.user.fullName} declined your shift swap request.`,
        type: "Request",
      }], { session });
      requestId = request._id;
    });
  } finally {
    await session.endSession();
  }
  const request = await populateRequest(ShiftSwapRequest.findById(requestId));
  res.json({ request });
});
