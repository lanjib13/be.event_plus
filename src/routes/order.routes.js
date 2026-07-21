const express = require("express");
const {
  createOrder,
  getOrders,
  getOrderById,
  getOrdersByUser,
  updateOrderStatus,
  updateOrderByOrganizer,
  generateTicketsByOrder,
} = require("../controllers/order.controller");

const { authMiddleware } = require("../middleware/auth.middleware");
const { roleMiddleware } = require("../middleware/role.middleware");

const router = express.Router();

router.post("/", authMiddleware, roleMiddleware("user", "admin"), createOrder);

router.get("/", authMiddleware, roleMiddleware("admin"), getOrders);
router.get("/user/:userId", authMiddleware, roleMiddleware("user", "admin"), getOrdersByUser);
router.get("/:id", authMiddleware, roleMiddleware("user", "admin", "organizer"), getOrderById);

router.patch("/:id/status", authMiddleware, roleMiddleware("admin",), updateOrderStatus);
router.put("/organizer/orders/:id/status", authMiddleware, roleMiddleware("organizer"), updateOrderByOrganizer);
router.post("/tickets", authMiddleware, roleMiddleware("organizer"), generateTicketsByOrder);

module.exports = router;