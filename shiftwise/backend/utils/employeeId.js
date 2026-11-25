const User = require("../models/User");

const nextEmployeeId = async () => {
  const count = await User.countDocuments({ role: "Employee" });
  return `SW-${2041 + count}`;
};

module.exports = { nextEmployeeId };
