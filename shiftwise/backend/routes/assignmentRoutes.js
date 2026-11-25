const router = require("express").Router();
const { body } = require("express-validator");
const validate = require("../middleware/validate");
const { authenticate, authorize } = require("../middleware/auth");
const controller = require("../controllers/assignmentController");

router.use(authenticate);
router.get("/", controller.list);
router.post("/",
  authorize("Admin", "Employee"),
  [
    body("employee").if((value, { req }) => req.user.role === "Admin").isMongoId(),
    body("shift").isMongoId(),
    body("assignedDate").isISO8601(),
  ],
  validate,
  controller.create
);
router.patch("/:id", authorize("Admin"), controller.update);
router.delete("/:id", authorize("Admin"), controller.remove);

module.exports = router;
