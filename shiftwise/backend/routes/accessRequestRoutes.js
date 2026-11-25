const router = require("express").Router();
const { body, param } = require("express-validator");
const { rateLimit } = require("express-rate-limit");
const validate = require("../middleware/validate");
const { authenticate, authorize } = require("../middleware/auth");
const controller = require("../controllers/accessRequestController");

const submissionLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { message: "Too many access requests from this network. Please try again later." },
});
const invitationLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { message: "Too many invitation attempts. Please try again later." },
});

router.post(
  "/",
  submissionLimit,
  [
    body("fullName").isString().trim().isLength({ min: 2, max: 100 }),
    body("email").isEmail().normalizeEmail().isLength({ max: 254 }),
    body("requestedRole").isIn(["Employee", "Admin"]),
    body("message").optional().isString().trim().isLength({ max: 1000 }),
  ],
  validate,
  controller.create
);
router.post(
  "/invitation/complete",
  invitationLimit,
  [
    body("token").isString().matches(/^[a-f0-9]{64}$/i),
    body("password").isString().isLength({ min: 12, max: 128 }),
  ],
  validate,
  controller.completeInvitation
);

router.use(authenticate, authorize("Admin"));
router.get("/", controller.list);
router.patch("/:id/approve", [param("id").isMongoId()], validate, controller.approve);
router.patch("/:id/reject", [param("id").isMongoId()], validate, controller.reject);
router.patch("/:id/resend", [param("id").isMongoId()], validate, controller.resendInvitation);

module.exports = router;
