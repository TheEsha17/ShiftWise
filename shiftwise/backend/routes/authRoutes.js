const router = require("express").Router();
const { body } = require("express-validator");
const validate = require("../middleware/validate");
const { authenticate } = require("../middleware/auth");
const authController = require("../controllers/authController");

router.post("/login",
  [
    body("email").isEmail().normalizeEmail().withMessage("A valid email is required"),
    body("password").isLength({ min: 6 }).withMessage("Password must contain at least 6 characters"),
  ],
  validate,
  authController.login
);
router.get("/me", authenticate, authController.me);

module.exports = router;
