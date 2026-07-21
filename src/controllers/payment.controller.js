const snap = require("../config/midtrans");
const supabase = require("../config/supabase");
const generateQRCode = require("../utils/generateQRCode");

const generateTicketsByOrder = async (orderId) => {
  const { data: order } = await supabase
    .from("orders")
    .select("*")
    .eq("id", orderId)
    .single();

  if (!order) return;

  const { data: existingTickets } = await supabase
    .from("tickets")
    .select("id")
    .in(
      "order_item_id",
      (
        await supabase
          .from("order_items")
          .select("id")
          .eq("order_id", orderId)
      ).data?.map((item) => item.id) || []
    );

  if (existingTickets && existingTickets.length > 0) return;

  const { data: orderItems } = await supabase
    .from("order_items")
    .select("*, ticket_types(event_id)")
    .eq("order_id", orderId);

  for (const item of orderItems || []) {
    for (let i = 0; i < item.quantity; i++) {
      const qrText = `${orderId}-${item.id}-${i}-${Date.now()}`;
      const qrCode = await generateQRCode(qrText);

      await supabase.from("tickets").insert([
        {
          order_item_id: item.id,
          user_id: order.user_id,
          event_id: item.ticket_types.event_id,
          qr_code: qrCode,
          qr_token: qrText,
          ticket_status: "active",
        },
      ]);
    }

    await supabase.rpc("increment_ticket_sold", {
      ticket_type_id_input: item.ticket_type_id,
      qty_input: item.quantity,
    });
  }
};

const createPayment = async (req, res) => {
  try {
    const { order_id } = req.body;

    const { data: order, error } = await supabase
      .from("orders")
      .select("*, users(name, email, phone)")
      .eq("id", order_id)
      .single();

    if (error || !order) {
      return res.status(404).json({
        success: false,
        message: "Order tidak ditemukan",
      });
    }

    const parameter = {
      transaction_details: {
        order_id: order.id,
        gross_amount: Number(order.total_price),
      },
      customer_details: {
        first_name: order.users?.name || "User",
        email: order.users?.email || "user@gmail.com",
        phone: order.users?.phone || "081234567890",
      },
     callbacks: {
  finish: `${process.env.FRONTEND_URL}/payment/success`,
},
    };

    const transaction = await snap.createTransaction(parameter);

    await supabase
      .from("orders")
      .update({
        payment_method: "midtrans",
        payment_token: transaction.token,
        payment_status: "pending",
      })
      .eq("id", order.id);

    return res.json({
      success: true,
      message: "Payment Midtrans berhasil dibuat",
      data: {
        token: transaction.token,
        redirect_url: transaction.redirect_url,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const paymentCallback = async (req, res) => {
  try {
    const notification = req.body;

    const orderId = notification.order_id;
    const transactionStatus = notification.transaction_status;
    const fraudStatus = notification.fraud_status;

    let paymentStatus = "pending";

    if (transactionStatus === "capture") {
      paymentStatus = fraudStatus === "accept" ? "paid" : "pending";
    } else if (transactionStatus === "settlement") {
      paymentStatus = "paid";
    } else if (
      transactionStatus === "cancel" ||
      transactionStatus === "deny" ||
      transactionStatus === "expire"
    ) {
      paymentStatus = transactionStatus === "expire" ? "expired" : "failed";
    } else if (transactionStatus === "pending") {
      paymentStatus = "pending";
    }

    const { data: order, error } = await supabase
      .from("orders")
      .update({ payment_status: paymentStatus })
      .eq("id", orderId)
      .select()
      .single();

    if (error) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    if (paymentStatus === "paid") {
      await generateTicketsByOrder(orderId);
    }

    return res.status(200).json({
      success: true,
      message: "Callback Midtrans diterima",
      data: order,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getPaymentStatus = async (req, res) => {
  const { orderId } = req.params;

  const { data, error } = await supabase
    .from("orders")
    .select("id, payment_status, payment_method, total_price, payment_token")
    .eq("id", orderId)
    .single();

  if (error) {
    return res.status(404).json({
      success: false,
      message: "Order tidak ditemukan",
    });
  }

  res.json({
    success: true,
    message: "Status pembayaran",
    data,
  });
};

module.exports = {
  createPayment,
  paymentCallback,
  getPaymentStatus,
};