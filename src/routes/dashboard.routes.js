const express = require("express");
const {
  adminDashboard,
  organizerDashboard,
  userDashboard,
} = require("../controllers/dashboard.controller");

const { authMiddleware } = require("../middleware/auth.middleware");
const { roleMiddleware } = require("../middleware/role.middleware");

const router = express.Router();

router.get("/admin", authMiddleware, roleMiddleware("admin"), adminDashboard);
router.get("/organizer/:organizerId", authMiddleware, roleMiddleware("organizer", "admin"), organizerDashboard);
router.get("/user/:userId", authMiddleware, userDashboard);

module.exports = router;