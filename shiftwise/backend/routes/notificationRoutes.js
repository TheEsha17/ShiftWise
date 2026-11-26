const router = require("express").Router();
const { body } = require("express-validator");
const { authenticate, authorize } = require("../middleware/auth");
const validate = require("../middleware/validate");
const controller = require("../controllers/notificationController");

router.use(authenticate);

router.get("/", controller.list);
router.post(
  "/",
  authorize("Admin"),
  [
    body("recipient").isMongoId(),
    body("title").isString().trim().isLength({ min: 1, max: 160 }),
    body("message").isString().trim().isLength({ min: 1, max: 2000 }),
    body("type").optional().isIn(["Shift", "Request", "Attendance", "Leave", "System"]),
  ],
  validate,
  controller.create
);
router.patch("/read-all", controller.markAllRead);
router.patch("/:id/read", controller.markRead);

module.exports = router;
