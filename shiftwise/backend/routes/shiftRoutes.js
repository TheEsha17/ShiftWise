const router = require("express").Router();
const { body } = require("express-validator");
const validate = require("../middleware/validate");
const { authenticate, authorize } = require("../middleware/auth");
const controller = require("../controllers/shiftController");

router.use(authenticate);
router.get("/", controller.list);
router.get("/:id", controller.get);
router.post("/",
  authorize("Admin"),
  [
    body("name").trim().notEmpty(),
    body("type").isIn(["Early", "Mid", "Late"]),
    body("startTime").matches(/^\d{2}:\d{2}$/),
    body("endTime").matches(/^\d{2}:\d{2}$/),
    body("department").trim().notEmpty(),
    body("location").trim().notEmpty(),
  ],
  validate,
  controller.create
);
router.patch("/:id", authorize("Admin"), controller.update);
router.delete("/:id", authorize("Admin"), controller.remove);

module.exports = router;
