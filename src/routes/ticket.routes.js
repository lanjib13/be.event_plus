const express = require("express");
const {
  getTickets,
  getTicketById,
  getTicketsByUser,
  getTicketsByOrder,
} = require("../controllers/ticket.controller");

const { authMiddleware } = require("../middleware/auth.middleware");
const { roleMiddleware } = require("../middleware/role.middleware");

const router = express.Router();
exports.router = router;

router.get("/", authMiddleware, roleMiddleware("admin"), getTickets);
router.get("/user/:userId", authMiddleware, roleMiddleware("user", "admin"), getTicketsByUser);
router.get("/order/:orderId", authMiddleware, roleMiddleware("user", "admin", "organizer"), getTicketsByOrder);
router.get("/:id", authMiddleware, roleMiddleware("user", "admin", "organizer"), getTicketById);
module.exports = router;