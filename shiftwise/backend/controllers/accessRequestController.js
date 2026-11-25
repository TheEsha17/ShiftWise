const { createHash, randomBytes } = require("crypto");
const bcrypt = require("bcryptjs");
const AccessRequest = require("../models/AccessRequest");
const User = require("../models/User");
const { nextEmployeeId } = require("../utils/employeeId");
const { sendAccessInvitation } = require("../utils/sendAccessInvitation");
const asyncHandler = require("../utils/asyncHandler");

const hashToken = (token) => createHash("sha256").update(token).digest("hex");
const inviteExpiry = () => new Date(Date.now() + 48 * 60 * 60 * 1000);

const releaseProcessing = (requestId, processingAt) => AccessRequest.updateOne(
  { _id: requestId, status: "Pending", processingAt },
  { $unset: { processingAt: 1 } }
);

exports.create = asyncHandler(async (req, res) => {
  const email = String(req.body.email || "").trim().toLowerCase();
  if (await User.exists({ email })) {
    return res.status(409).json({ message: "An account already exists for this email." });
  }

  try {
    const request = await AccessRequest.create({
      fullName: req.body.fullName,
      email,
      requestedRole: req.body.requestedRole,
      message: req.body.message || "",
    });
    return res.status(201).json({
      requestId: request._id,
      message: "Your access request was submitted. An administrator will review it.",
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: "A pending access request already exists for this email." });
    }
    throw error;
  }
});

exports.list = asyncHandler(async (req, res) => {
  const requests = await AccessRequest.find()
    .sort({ createdAt: -1 })
    .limit(200)
    .populate({ path: "invitedUser", select: "employmentStatus" });

  res.json({
    requests: requests.map((request) => ({
      _id: request._id,
      fullName: request.fullName,
      email: request.email,
      requestedRole: request.requestedRole,
      message: request.message,
      status: request.status,
      createdAt: request.createdAt,
      reviewedAt: request.reviewedAt,
      invitationPending: request.invitedUser?.employmentStatus === "Inactive",
    })),
  });
});

exports.approve = asyncHandler(async (req, res) => {
  const processingAt = new Date();
  const request = await AccessRequest.findOneAndUpdate(
    {
      _id: req.params.id,
      status: "Pending",
      $or: [{ processingAt: null }, { processingAt: { $lt: new Date(Date.now() - 10 * 60 * 1000) } }],
    },
    { $set: { processingAt } },
    { new: true }
  );
  if (!request) {
    const existing = await AccessRequest.findById(req.params.id);
    return res.status(existing ? 409 : 404).json({
      message: existing ? "This request is already being reviewed or has been decided." : "Access request not found.",
    });
  }

  let existingUser;
  try {
    existingUser = await User.findOne({ email: request.email });
  } catch (error) {
    await releaseProcessing(request._id, processingAt);
    throw error;
  }
  if (existingUser) {
    await releaseProcessing(request._id, processingAt);
    return res.status(409).json({ message: "An account already exists for this request email." });
  }

  let employeeId;
  try {
    if (request.requestedRole === "Employee") employeeId = await nextEmployeeId();
  } catch (error) {
    await releaseProcessing(request._id, processingAt);
    throw error;
  }
  const rawToken = randomBytes(32).toString("hex");
  const user = new User({
    fullName: request.fullName,
    email: request.email,
    password: randomBytes(48).toString("hex"),
    role: request.requestedRole,
    ...(employeeId ? { employeeId } : {}),
    employmentStatus: "Inactive",
    invitationTokenHash: hashToken(rawToken),
    invitationExpiresAt: inviteExpiry(),
  });

  try {
    await user.save();
  } catch (error) {
    await releaseProcessing(request._id, processingAt);
    if (error.code === 11000) {
      return res.status(409).json({ message: "An account already exists for this request email." });
    }
    throw error;
  }

  let approvedRequest;
  try {
    approvedRequest = await AccessRequest.findOneAndUpdate(
      { _id: request._id, status: "Pending", processingAt },
      {
        $set: {
          status: "Approved",
          reviewedBy: req.user._id,
          reviewedAt: new Date(),
          invitedUser: user._id,
        },
        $unset: { processingAt: 1 },
      },
      { new: true }
    );
  } catch (error) {
    await User.findByIdAndDelete(user._id);
    await releaseProcessing(request._id, processingAt);
    throw error;
  }
  if (!approvedRequest) {
    await User.findByIdAndDelete(user._id);
    await releaseProcessing(request._id, processingAt);
    return res.status(409).json({ message: "This request could not be approved. Please refresh and try again." });
  }

  try {
    await sendAccessInvitation({
      email: request.email,
      fullName: request.fullName,
      role: request.requestedRole,
      token: rawToken,
    });
  } catch (error) {
    await User.findByIdAndDelete(user._id);
    await AccessRequest.updateOne(
      { _id: request._id, status: "Approved", invitedUser: user._id },
      {
        $set: { status: "Pending" },
        $unset: { reviewedBy: 1, reviewedAt: 1, invitedUser: 1, processingAt: 1 },
      }
    );
    if (error.statusCode === 503) {
      return res.status(503).json({ message: error.message });
    }
    console.error("Access invitation delivery failed:", error.message);
    return res.status(502).json({
      message: "The invitation could not be delivered. No account was approved; you can retry.",
    });
  }

  res.json({ message: "Access approved and invitation sent. The applicant must set a password before signing in." });
});

exports.reject = asyncHandler(async (req, res) => {
  const request = await AccessRequest.findOneAndUpdate(
    { _id: req.params.id, status: "Pending", processingAt: null },
    { $set: { status: "Rejected", reviewedBy: req.user._id, reviewedAt: new Date() } },
    { new: true }
  );
  if (!request) {
    const existing = await AccessRequest.findById(req.params.id);
    return res.status(existing ? 409 : 404).json({
      message: existing ? "This request is already being reviewed or has been decided." : "Access request not found.",
    });
  }
  res.json({ message: "Access request rejected." });
});

exports.completeInvitation = asyncHandler(async (req, res) => {
  const tokenHash = hashToken(req.body.token);
  const user = await User.findOne({
    invitationTokenHash: tokenHash,
    invitationExpiresAt: { $gt: new Date() },
    employmentStatus: "Inactive",
  }).select("+invitationTokenHash +invitationExpiresAt");
  if (!user) {
    return res.status(400).json({ message: "This invitation link is invalid, expired, or already used." });
  }

  const passwordHash = await bcrypt.hash(req.body.password, 12);
  const result = await User.updateOne(
    {
      _id: user._id,
      invitationTokenHash: tokenHash,
      invitationExpiresAt: { $gt: new Date() },
      employmentStatus: "Inactive",
    },
    {
      $set: { password: passwordHash, employmentStatus: "Active" },
      $unset: { invitationTokenHash: 1, invitationExpiresAt: 1 },
    }
  );
  if (result.modifiedCount !== 1) {
    return res.status(400).json({ message: "This invitation link is invalid, expired, or already used." });
  }

  res.json({ message: "Password set successfully. You can now sign in." });
});

exports.resendInvitation = asyncHandler(async (req, res) => {
  const request = await AccessRequest.findOne({ _id: req.params.id, status: "Approved" });
  if (!request || !request.invitedUser) {
    return res.status(404).json({ message: "Approved invitation not found." });
  }
  const user = await User.findOne({
    _id: request.invitedUser,
    email: request.email,
    role: request.requestedRole,
    employmentStatus: "Inactive",
  }).select("+invitationTokenHash +invitationExpiresAt");
  if (!user) {
    return res.status(409).json({ message: "This account is already active or cannot be reinvited." });
  }

  const previousTokenHash = user.invitationTokenHash;
  const previousExpiry = user.invitationExpiresAt;
  const rawToken = randomBytes(32).toString("hex");
  user.invitationTokenHash = hashToken(rawToken);
  user.invitationExpiresAt = inviteExpiry();
  await user.save();

  try {
    await sendAccessInvitation({
      email: request.email,
      fullName: request.fullName,
      role: request.requestedRole,
      token: rawToken,
    });
  } catch (error) {
    user.invitationTokenHash = previousTokenHash;
    user.invitationExpiresAt = previousExpiry;
    await user.save();
    if (error.statusCode === 503) {
      return res.status(503).json({ message: error.message });
    }
    console.error("Access invitation resend failed:", error.message);
    return res.status(502).json({ message: "The invitation could not be delivered. Please try again." });
  }

  res.json({ message: "A new invitation was sent." });
});
