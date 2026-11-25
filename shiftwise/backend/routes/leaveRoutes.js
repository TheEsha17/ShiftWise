const router = require("express").Router();
const { body } = require("express-validator");
const validate = require("../middleware/validate");
const { authenticate, authorize } = require("../middleware/auth");
const controller = require("../controllers/leaveController");

router.use(authenticate);

router.get("/", controller.list);
router.post("/",
  [
    body("leaveType").isIn(["Annual leave", "Sick leave", "Personal", "Unpaid"]),
    body("startDate").isISO8601(),
    body("endDate").isISO8601(),
    body("reason").trim().isLength({ min: 5 }),
  ],
  validate,
  controller.create
);
router.patch("/:id", authorize("Admin"), controller.decide);

module.exports = router;
