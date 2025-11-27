const router = require("express").Router();
const controller = require("../controllers/logs.controller");

router.post("/bulk", controller.bulkUpsertLogs);
router.get("/summary", controller.getSummary);
router.get("/weekly-report", controller.getWeeklyReport);

module.exports = router;
