const router = require("express").Router();
const { authenticate, authorize } = require("../middleware/auth");
const controller = require("../controllers/dashboardController");

router.get("/admin", authenticate, authorize("Admin"), controller.admin);
router.get("/employee", authenticate, authorize("Employee"), controller.employee);

module.exports = router;
