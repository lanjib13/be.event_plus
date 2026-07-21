const supabase = require("../config/supabase");
const generateQRCode = require("../utils/generateQRCode");

const generateTicketsByOrder = async (orderId) => {
  const { data: order } = await supabase
    .from("orders")
    .select("*")
    .eq("id", orderId)
    .single();

  if (!order) return;

  const { data: orderItems } = await supabase
    .from("order_items")
    .select(`
      *,
      ticket_types (
        event_id
      )
    `)
    .eq("order_id", orderId);

  for (const item of orderItems || []) {
    const { data: existingTickets } = await supabase
      .from("tickets")
      .select("id")
      .eq("order_item_id", item.id);

    if (existingTickets?.length > 0) continue;

    for (let i = 0; i < item.quantity; i++) {
      const qrToken = `${order.id}-${item.id}-${i}-${Date.now()}`;
      const qrCode = await generateQRCode(qrToken);

      const { error } = await supabase
        .from("tickets")
        .insert([
          {
            order_item_id: item.id,
            user_id: order.user_id,
            event_id: item.ticket_types.event_id,
            qr_code: qrCode,
            qr_token: qrToken,
            ticket_status: "active",
          },
        ]);

      if (error) {
        console.error(error);
      }
    }

    await supabase.rpc("increment_ticket_sold", {
      ticket_type_id_input: item.ticket_type_id,
      qty_input: item.quantity,
    });
  }
};

const createOrder = async (req, res) => {
  try {
    const { items, payment_method } = req.body;
    const user_id = req.user.id;

    if (!items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Item tiket wajib diisi",
      });
    }

    let total_price = 0;
    const orderItemsData = [];

    for (const item of items) {
      const { data: ticketType, error } = await supabase
        .from("ticket_types")
        .select("*")
        .eq("id", item.ticket_type_id)
        .single();

      if (error || !ticketType) {
        return res.status(404).json({
          success: false,
          message: "Jenis tiket tidak ditemukan",
        });
      }

      const available = Number(ticketType.quota) - Number(ticketType.sold || 0);

      if (Number(item.quantity) > available) {
        return res.status(400).json({
          success: false,
          message: `Stok tiket ${ticketType.name} tidak cukup`,
        });
      }

      total_price += Number(ticketType.price) * Number(item.quantity);

      orderItemsData.push({
        ticket_type_id: item.ticket_type_id,
        quantity: Number(item.quantity),
        price: Number(ticketType.price),
      });
    }

    const payment_status = total_price === 0 ? "paid" : "pending";

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert([
        {
          user_id,
          total_price,
          payment_status,
          payment_method: total_price === 0 ? "free" : payment_method,
        },
      ])
      .select()
      .single();

    if (orderError) {
      return res.status(400).json({
        success: false,
        message: orderError.message,
      });
    }

    const finalOrderItems = orderItemsData.map((item) => ({
      order_id: order.id,
      ticket_type_id: item.ticket_type_id,
      quantity: item.quantity,
      price: item.price,
    }));

    const { data: orderItems, error: itemError } = await supabase
      .from("order_items")
      .insert(finalOrderItems)
      .select();

    if (itemError) {
      return res.status(400).json({
        success: false,
        message: itemError.message,
      });
    }

    if (total_price === 0) {
      await generateTicketsByOrder(order.id);
    }

    return res.status(201).json({
      success: true,
      message:
        total_price === 0
          ? "Tiket gratis berhasil didapatkan"
          : "Order berhasil dibuat",
      data: {
        order,
        order_items: orderItems,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getOrders = async (req, res) => {
  const { data, error } = await supabase
    .from("orders")
    .select("*, users(name, email), order_items(*)")
    .order("created_at", { ascending: false });

  if (error) return res.status(400).json({ success: false, message: error.message });

  res.json({ success: true, message: "Data order", data });
};

const getOrderById = async (req, res) => {
  const { id } = req.params;

  const { data, error } = await supabase
    .from("orders")
    .select("*, users(name, email), order_items(*)")
    .eq("id", id)
    .single();

  if (error) return res.status(404).json({ success: false, message: "Order tidak ditemukan" });

  res.json({ success: true, message: "Detail order", data });
};

const getOrdersByUser = async (req, res) => {
  const { userId } = req.params;

  const { data, error } = await supabase
    .from("orders")
    .select("*, order_items(*)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) return res.status(400).json({ success: false, message: error.message });

  res.json({ success: true, message: "Order milik user", data });
};

const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { payment_status } = req.body;

    const { data: order, error } = await supabase
      .from("orders")
      .update({ payment_status })
      .eq("id", id)
      .select()
      .single();

    if (error) return res.status(400).json({ success: false, message: error.message });

    if (payment_status === "paid") {
      await generateTicketsByOrder(id);
    }

    res.json({
      success: true,
      message: "Status order berhasil diupdate",
      data: order,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateOrderByOrganizer = async (req, res) => {
  try {
    const { id } = req.params;
    const { payment_status } = req.body;

    const allowedStatus = [
      "pending",
      "paid",
      "cancelled",
      "checked_in",
      "refunded",
    ];

    if (!allowedStatus.includes(payment_status)) {
      return res.status(400).json({
        success: false,
        message: "Status tidak valid",
      });
    }

    const { data: order, error } = await supabase
      .from("orders")
      .update({
        payment_status,
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    if (payment_status === "paid") {
      await generateTicketsByOrder(id);
    }

    return res.json({
      success: true,
      message: "Status order berhasil diperbarui",
      data: order,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
module.exports = {
  createOrder,
  getOrders,
  getOrderById,
  getOrdersByUser,
  updateOrderStatus,
  updateOrderByOrganizer,
  generateTicketsByOrder,
};