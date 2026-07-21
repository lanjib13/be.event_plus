const express = require("express");
const {
  createTicketType,
  getTicketTypesByEvent,
  getTicketTypeById,
  updateTicketType,
  deleteTicketType,
} = require("../controllers/ticketType.controller");

const { authMiddleware } = require("../middleware/auth.middleware");
const { roleMiddleware } = require("../middleware/role.middleware");

const router = express.Router();

router.get("/event/:eventId", getTicketTypesByEvent);
router.get("/:id", getTicketTypeById);

router.post("/", authMiddleware, roleMiddleware("admin", "organizer"), createTicketType);
router.put("/:id", authMiddleware, roleMiddleware("admin", "organizer"), updateTicketType);
router.delete("/:id", authMiddleware, roleMiddleware("admin", "organizer"), deleteTicketType);

module.exports = router;