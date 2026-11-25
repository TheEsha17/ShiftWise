const router = require("express").Router();
const { body } = require("express-validator");
const validate = require("../middleware/validate");
const { authenticate, authorize } = require("../middleware/auth");
const controller = require("../controllers/employeeController");

router.use(authenticate);

router.get("/me", controller.getOwnProfile);
router.get("/", authorize("Admin"), controller.list);
router.post("/",
  authorize("Admin"),
  [
    body("fullName").trim().notEmpty(),
    body("email").isEmail().normalizeEmail(),
    body("password").isLength({ min: 6 }),
  ],
  validate,
  controller.create
);
router.get("/:id", authorize("Admin"), controller.get);
router.patch("/:id", authorize("Admin"), controller.update);
router.delete("/:id", authorize("Admin"), controller.remove);

module.exports = router;
