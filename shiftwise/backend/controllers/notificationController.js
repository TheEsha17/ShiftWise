const Notification = require("../models/Notification");
const asyncHandler = require("../utils/asyncHandler");

exports.list = asyncHandler(async (req, res) => {
  const filter = { recipient: req.user._id };
  if (req.query.read !== undefined) filter.read = req.query.read === "true";
  const notifications = await Notification.find(filter).sort({ timestamp: -1 });
  res.json({ notifications });
});

exports.create = asyncHandler(async (req, res) => {
  const notification = await Notification.create({
    recipient: req.body.recipient,
    title: req.body.title,
    message: req.body.message,
    type: req.body.type || "System",
    read: false,
  });
  res.status(201).json({ notification });
});

exports.markRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: req.params.id, recipient: req.user._id },
    { $set: { read: true } },
    { new: true }
  );
  if (!notification) return res.status(404).json({ message: "Notification not found" });
  res.json({ notification });
});

exports.markAllRead = asyncHandler(async (req, res) => {
  await Notification.updateMany(
    { recipient: req.user._id, read: false },
    { $set: { read: true } }
  );
  res.json({ message: "All notifications marked as read" });
});
