const express = require("express");
const {
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
} = require("../controllers/user.controller");

const { authMiddleware } = require("../middleware/auth.middleware");
const { roleMiddleware } = require("../middleware/role.middleware");

const router = express.Router();

router.get("/", authMiddleware, roleMiddleware("admin"), getUsers);
router.get("/:id", authMiddleware, roleMiddleware("admin"), getUserById);
router.put("/:id", authMiddleware, updateUser);
router.delete("/:id", authMiddleware, roleMiddleware("admin"), deleteUser);

module.exports = router;