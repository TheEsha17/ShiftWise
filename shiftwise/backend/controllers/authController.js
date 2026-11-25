const User = require("../models/User");
const { signToken } = require("../utils/tokens");
const asyncHandler = require("../utils/asyncHandler");

exports.login = asyncHandler(async (req, res) => {
  const { email, password, role } = req.body;
  const user = await User.findOne({ email: email.toLowerCase() }).select("+password");
  if (!user || !(await user.comparePassword(password))) {
    return res.status(401).json({ message: "Invalid email or password" });
  }
  if (role) {
    const requestedRole = role.charAt(0).toUpperCase() + role.slice(1).toLowerCase();
    if (requestedRole !== user.role) {
      return res.status(403).json({ message: `This account is not registered as ${role}` });
    }
  }
  if (user.employmentStatus !== "Active") {
    return res.status(403).json({ message: "This account is inactive" });
  }

  const token = signToken(user);
  const safeUser = await User.findById(user._id).select("-password");
  res.json({ token, user: safeUser });
});

exports.me = asyncHandler(async (req, res) => {
  res.json({ user: req.user });
});
