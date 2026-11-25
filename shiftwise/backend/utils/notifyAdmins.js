const User = require("../models/User");
const Notification = require("../models/Notification");

const notifyAdmins = async ({ title, message, type, session }) => {
  const adminQuery = User.find({ role: "Admin", employmentStatus: "Active" }).select("_id");
  if (session) adminQuery.session(session);
  const admins = await adminQuery;
  if (!admins.length) return;
  const notifications = admins.map(({ _id }) => ({
    recipient: _id,
    title,
    message,
    type,
  }));
  await Notification.insertMany(notifications, session ? { session } : {});
};

module.exports = notifyAdmins;
