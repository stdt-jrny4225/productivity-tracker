const router = require("express").Router();
const controller = require("../controllers/categories.controller");

router.get("/", controller.getCategories);
router.post("/", controller.saveCategory);

module.exports = router;
