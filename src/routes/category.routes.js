const express = require("express");
const {
  createCategory,
  getCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
} = require("../controllers/category.controller");

const { authMiddleware } = require("../middleware/auth.middleware");
const { roleMiddleware } = require("../middleware/role.middleware");

const router = express.Router();

router.get("/", getCategories);
router.get("/:id", getCategoryById);

router.post("/", authMiddleware, roleMiddleware("admin"), createCategory);
router.put("/:id", authMiddleware, roleMiddleware("admin"), updateCategory);
router.delete("/:id", authMiddleware, roleMiddleware("admin"), deleteCategory);

module.exports = router;