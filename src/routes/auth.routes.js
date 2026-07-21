const express = require("express");

const {
  register,
  login,
  logout,
  me,
  registerAdmin,
  loginAdmin,
} = require("../controllers/auth.controller");

const { authMiddleware } = require("../middleware/auth.middleware");

const router = express.Router();

router.post("/register", register);
router.post("/login", login);

router.post("/admin/register", registerAdmin);
router.post("/admin/login", loginAdmin);

router.post("/logout", logout);
router.get("/me", authMiddleware, me);

module.exports = router;