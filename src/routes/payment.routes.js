const express = require("express");
const {
  createPayment,
  paymentCallback,
  getPaymentStatus,
} = require("../controllers/payment.controller");

const { authMiddleware } = require("../middleware/auth.middleware");
const { roleMiddleware } = require("../middleware/role.middleware");

const router = express.Router();

router.post("/create", authMiddleware, roleMiddleware("user", "admin"), createPayment);
router.post("/callback", paymentCallback);
router.get("/status/:orderId", authMiddleware, roleMiddleware("user", "admin"), getPaymentStatus);

module.exports = router;