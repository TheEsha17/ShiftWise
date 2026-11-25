const router = require("express").Router();
const { authenticate, authorize } = require("../middleware/auth");
const controller = require("../controllers/attendanceController");

router.use(authenticate);

router.get("/", controller.list);
router.post("/check-in", controller.checkIn);
router.post("/check-out", controller.checkOut);
router.post("/", authorize("Admin"), controller.upsert);

module.exports = router;
