const nodemailer = require("nodemailer");

const createTransporter = () => {
  const { MAIL_HOST, MAIL_FROM, CLIENT_URL } = process.env;
  const port = Number(process.env.MAIL_PORT || 587);
  const username = process.env.MAIL_USER || "";
  const password = process.env.MAIL_PASSWORD || "";

  if (!MAIL_HOST || !MAIL_FROM || !CLIENT_URL || !Number.isInteger(port) || port < 1) {
    const error = new Error("Email delivery is not configured. Set MAIL_HOST, MAIL_FROM, and CLIENT_URL.");
    error.statusCode = 503;
    throw error;
  }
  if (Boolean(username) !== Boolean(password)) {
    const error = new Error("Both MAIL_USER and MAIL_PASSWORD are required when SMTP authentication is enabled.");
    error.statusCode = 503;
    throw error;
  }

  return nodemailer.createTransport({
    host: MAIL_HOST,
    port,
    secure: process.env.MAIL_SECURE === "true",
    ...(username ? { auth: { user: username, pass: password } } : {}),
  });
};

const sendAccessInvitation = async ({ email, fullName, role, token }) => {
  const transporter = createTransporter();
  const invitationUrl = new URL("/set-password", process.env.CLIENT_URL);
  invitationUrl.searchParams.set("token", token);

  await transporter.sendMail({
    from: process.env.MAIL_FROM,
    to: email,
    subject: "Set up your ShiftWise account",
    text: [
      `Hello ${fullName},`,
      "",
      `Your request for ShiftWise ${role} access was approved.`,
      "Use the secure link below to set your password. This link expires in 48 hours and can only be used once.",
      "",
      invitationUrl.toString(),
      "",
      "If you did not request access, you can ignore this email.",
    ].join("\n"),
  });
};

module.exports = { sendAccessInvitation };
