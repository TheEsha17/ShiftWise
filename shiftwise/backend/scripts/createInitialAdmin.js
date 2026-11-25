require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });
const connectDB = require("../config/db");
const User = require("../models/User");

const run = async () => {
  await connectDB();

  const existingAdmin = await User.findOne({ role: "Admin" });
  if (existingAdmin) {
    console.log(`Initial admin already exists: ${existingAdmin.email}`);
    return;
  }

  const fullName = String(process.env.INITIAL_ADMIN_NAME || "").trim();
  const email = String(process.env.INITIAL_ADMIN_EMAIL || "").trim().toLowerCase();
  const password = String(process.env.INITIAL_ADMIN_PASSWORD || "");
  if (!fullName || !email || !password) {
    throw new Error("INITIAL_ADMIN_NAME, INITIAL_ADMIN_EMAIL, and INITIAL_ADMIN_PASSWORD are required");
  }
  if (password.length < 6) {
    throw new Error("INITIAL_ADMIN_PASSWORD must contain at least 6 characters");
  }

  const emailUser = await User.findOne({ email });
  if (emailUser) {
    if (emailUser.role === "Admin") {
      console.log(`Initial admin already exists: ${email}`);
      return;
    }
    throw new Error(`The configured email is already used by a non-admin account: ${email}`);
  }

  const admin = await User.create({
    fullName,
    email,
    password,
    role: "Admin",
    department: "Administration",
    employmentStatus: "Active",
  });
  console.log(`Created initial admin: ${admin.email}`);
};

run()
  .catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    const mongoose = require("mongoose");
    await mongoose.disconnect();
  });
