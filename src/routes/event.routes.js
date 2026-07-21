const express = require("express");
const {
  createEvent,
  getEvents,
  getEventById,
  updateEvent,
  deleteEvent,
  getEventsByOrganizer,
} = require("../controllers/event.controller");

const { authMiddleware } = require("../middleware/auth.middleware");
const { roleMiddleware } = require("../middleware/role.middleware");

const router = express.Router();

router.get("/", getEvents);
router.get("/organizer/:organizerId", authMiddleware, roleMiddleware("admin", "organizer"), getEventsByOrganizer);
router.get("/:id", getEventById);

router.post("/", authMiddleware, roleMiddleware("admin", "organizer"), createEvent);
router.put("/:id", authMiddleware, roleMiddleware("admin", "organizer"), updateEvent);
router.delete("/:id", authMiddleware, roleMiddleware("admin", "organizer"), deleteEvent);

module.exports = router;