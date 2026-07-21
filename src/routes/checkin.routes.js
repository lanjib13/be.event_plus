const express = require("express");
const {
  scanCheckin,
  getCheckinsByEvent,
  getCheckinByTicket,
} = require("../controllers/checkin.controller");

const { authMiddleware } = require("../middleware/auth.middleware");
const { roleMiddleware } = require("../middleware/role.middleware");

const router = express.Router();

router.post("/scan", authMiddleware, roleMiddleware("admin", "organizer"), scanCheckin);
router.get("/event/:eventId", authMiddleware, roleMiddleware("admin", "organizer"), getCheckinsByEvent);
router.get("/ticket/:ticketId", authMiddleware, roleMiddleware("admin", "organizer", "user"), getCheckinByTicket);

module.exports = router;