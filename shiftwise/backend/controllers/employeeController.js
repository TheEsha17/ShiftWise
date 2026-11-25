const User = require("../models/User");
const { nextEmployeeId } = require("../utils/employeeId");
const asyncHandler = require("../utils/asyncHandler");

exports.list = asyncHandler(async (req, res) => {
  const { search, department, status } = req.query;
  const filter = { role: "Employee" };
  if (department && department !== "All") filter.department = department;
  if (status && status !== "All") filter.employmentStatus = status;
  if (search) {
    filter.$or = [
      { fullName: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
      { employeeId: { $regex: search, $options: "i" } },
    ];
  }
  const employees = await User.find(filter).select("-password").sort({ fullName: 1 });
  res.json({ employees });
});

exports.get = asyncHandler(async (req, res) => {
  const employee = await User.findOne({ _id: req.params.id, role: "Employee" }).select("-password");
  if (!employee) return res.status(404).json({ message: "Employee not found" });
  res.json({ employee });
});

exports.getOwnProfile = asyncHandler(async (req, res) => {
  res.json({ employee: req.user });
});

exports.create = asyncHandler(async (req, res) => {
  const employeeId = await nextEmployeeId();
  const employee = await User.create({
    ...req.body,
    employeeId,
    role: "Employee",
  });
  const safeEmployee = await User.findById(employee._id).select("-password");
  res.status(201).json({ employee: safeEmployee });
});

exports.update = asyncHandler(async (req, res) => {
  const allowed = [
    "fullName", "email", "department", "designation", "location",
    "contract", "contactDetails", "joiningDate", "employmentStatus", "leaveBalance", "preferences",
  ];
  const employee = await User.findOne({ _id: req.params.id, role: "Employee" });
  if (!employee) return res.status(404).json({ message: "Employee not found" });
  allowed.forEach((key) => {
    if (req.body[key] !== undefined) employee[key] = req.body[key];
  });
  if (req.body.password) employee.password = req.body.password;
  await employee.save();
  const safeEmployee = await User.findById(employee._id).select("-password");
  res.json({ employee: safeEmployee });
});

exports.remove = asyncHandler(async (req, res) => {
  const employee = await User.findOneAndUpdate(
    { _id: req.params.id, role: "Employee" },
    { employmentStatus: "Inactive" },
    { new: true }
  ).select("-password");
  if (!employee) return res.status(404).json({ message: "Employee not found" });
  res.json({ employee, message: "Employee deactivated" });
});
