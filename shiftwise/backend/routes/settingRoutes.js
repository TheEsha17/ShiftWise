const router = require("express").Router();
const { authenticate } = require("../middleware/auth");
const controller = require("../controllers/settingController");

router.use(authenticate);
router.get("/", controller.get);
router.put("/:key", controller.set);

module.exports = router;
