const express = require("express");
const {
  createOrganizer,
  getOrganizers,
  getMyOrganizer,
  getOrganizerById,
  updateOrganizer,
  deleteOrganizer,
  verifyOrganizer,
  getOrganizerOrders,
  updateOrderByOrganizer,
} = require("../controllers/organizer.controller");

const { authMiddleware } = require("../middleware/auth.middleware");
const { roleMiddleware } = require("../middleware/role.middleware");

const router = express.Router();

router.post("/", authMiddleware, createOrganizer);

router.get("/me", authMiddleware, getMyOrganizer);
router.get("/my-orders",authMiddleware,roleMiddleware("organizer"),getOrganizerOrders);
router.patch("/orders/:id/status",authMiddleware,roleMiddleware("organizer"),updateOrderByOrganizer);

router.get("/", authMiddleware, roleMiddleware("admin"), getOrganizers);
router.get("/:id", authMiddleware, roleMiddleware("admin", "organizer"), getOrganizerById);

router.put("/:id", authMiddleware, roleMiddleware("admin", "organizer"), updateOrganizer);
router.delete("/:id", authMiddleware, roleMiddleware("admin"), deleteOrganizer);

router.patch("/:id/verify", authMiddleware, roleMiddleware("admin"), verifyOrganizer);

module.exports = router;