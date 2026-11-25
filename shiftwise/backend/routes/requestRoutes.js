const router = require("express").Router();
const { body } = require("express-validator");
const validate = require("../middleware/validate");
const { authenticate, authorize } = require("../middleware/auth");
const controller = require("../controllers/requestController");

router.use(authenticate);

router.get("/changes", controller.listChanges);
router.post("/changes",
  [
    body("currentShift").isMongoId(),
    body("reason").trim().isLength({ min: 5 }),
  ],
  validate,
  controller.createChange
);
router.delete("/changes/:id", authorize("Employee"), controller.cancelChange);
router.patch("/changes/:id", authorize("Admin"), controller.decideChange);

module.exports = router;
