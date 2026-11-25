const router = require("express").Router();
const { body, param, query } = require("express-validator");
const validate = require("../middleware/validate");
const { authenticate, authorize } = require("../middleware/auth");
const controller = require("../controllers/swapController");

router.use(authenticate);
router.get("/", authorize("Employee", "Admin"), controller.list);
router.get("/options",
  authorize("Employee"),
  [query("requesterAssignment").isMongoId()],
  validate,
  controller.options
);
router.post("/",
  authorize("Employee"),
  [
    body("requesterAssignment").isMongoId(),
    body("targetAssignment").isMongoId(),
  ],
  validate,
  controller.create
);
router.delete("/:id",
  authorize("Employee"),
  [param("id").isMongoId()],
  validate,
  controller.cancel
);
router.patch("/:id",
  authorize("Employee"),
  [
    param("id").isMongoId(),
    body("status").isIn(["Accepted", "Rejected"]),
  ],
  validate,
  controller.respond
);

module.exports = router;
