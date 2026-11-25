const router = require("express").Router();
const { authenticate, authorize } = require("../middleware/auth");
const controller = require("../controllers/notificationController");

router.use(authenticate);

router.get("/", controller.list);
router.post("/", authorize("Admin"), controller.create);
router.patch("/read-all", controller.markAllRead);
router.patch("/:id/read", controller.markRead);

module.exports = router;
