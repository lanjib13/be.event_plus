const supabase = require("../config/supabase");

const createOrganizer = async (req, res) => {
  try {
    const { organizer_name, description, logo_url } = req.body;

    const { data, error } = await supabase
      .from("organizers")
      .insert([
        {
          user_id: req.user.id,
          organizer_name,
          description,
          logo_url,
          verification_status: "pending",
        },
      ])
      .select()
      .single();

    if (error) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    await supabase
      .from("users")
      .update({ role: "organizer" })
      .eq("id", req.user.id);

    res.status(201).json({
      success: true,
      message: "Organizer berhasil dibuat",
      data,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getOrganizers = async (req, res) => {
  const { data, error } = await supabase
    .from("organizers")
    .select("*, users(name,email)");

  if (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }

  res.json({
    success: true,
    message: "Data organizer",
    data,
  });
};

const getMyOrganizer = async (req, res) => {
  const { data, error } = await supabase
    .from("organizers")
    .select("*")
    .eq("user_id", req.user.id)
    .maybeSingle();

  if (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }

  res.json({
    success: true,
    message: "Profil organizer saya",
    data,
  });
};

const getOrganizerById = async (req, res) => {
  const { id } = req.params;

  const { data, error } = await supabase
    .from("organizers")
    .select("*, users(name,email)")
    .eq("id", id)
    .single();

  if (error) {
    return res.status(404).json({
      success: false,
      message: "Organizer tidak ditemukan",
    });
  }

  res.json({
    success: true,
    message: "Detail organizer",
    data,
  });
};

const updateOrganizer = async (req, res) => {
  const { id } = req.params;
  const { organizer_name, description, logo_url } = req.body;

  const { data, error } = await supabase
    .from("organizers")
    .update({
      organizer_name,
      description,
      logo_url,
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

  res.json({
    success: true,
    message: "Organizer berhasil diupdate",
    data,
  });
};

const deleteOrganizer = async (req, res) => {
  const { id } = req.params;

  const { error } = await supabase
    .from("organizers")
    .delete()
    .eq("id", id);

  if (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }

  res.json({
    success: true,
    message: "Organizer berhasil dihapus",
  });
};

const verifyOrganizer = async (req, res) => {
  const { id } = req.params;
  const { verification_status } = req.body;

  if (
    !["pending", "approved", "rejected"].includes(
      verification_status
    )
  ) {
    return res.status(400).json({
      success: false,
      message: "Status verifikasi tidak valid",
    });
  }

  const { data, error } = await supabase
    .from("organizers")
    .update({
      verification_status,
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

  res.json({
    success: true,
    message: "Status organizer berhasil diupdate",
    data,
  });
};

const getOrganizerOrders = async (req, res) => {
  try {
    const { data: organizer } = await supabase
      .from("organizers")
      .select("id")
      .eq("user_id", req.user.id)
      .single();

    if (!organizer) {
      return res.status(404).json({
        success: false,
        message: "Organizer tidak ditemukan",
      });
    }

    const { data: events } = await supabase
      .from("events")
      .select("id,title")
      .eq("organizer_id", organizer.id);

    const eventIds = events?.map((e) => e.id) || [];

    if (eventIds.length === 0) {
      return res.json({
        success: true,
        message: "Belum ada order",
        data: [],
      });
    }

    const { data: orders, error } = await supabase
      .from("orders")
      .select(`
        *,
        users(name,email),
        order_items(
          *,
          ticket_types(
            event_id,
            name
          )
        )
      `)
      .order("created_at", {
        ascending: false,
      });

    if (error) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    const filteredOrders = orders
      .filter((order) =>
        order.order_items?.some((item) =>
          eventIds.includes(
            item.ticket_types?.event_id
          )
        )
      )
      .map((order) => {
        const firstItem = order.order_items?.find(
          (item) =>
            eventIds.includes(
              item.ticket_types?.event_id
            )
        );

        const event = events.find(
          (e) =>
            e.id === firstItem?.ticket_types?.event_id
        );

        return {
          ...order,
          events: {
            title: event?.title || "-",
          },
        };
      });

    return res.json({
      success: true,
      message: "Order organizer",
      data: filteredOrders,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const updateOrderByOrganizer = async (req, res) => {
  try {
    const { id } = req.params;
    const { payment_status } = req.body;

    const allowedStatus = [
      "pending",
      "paid",
      "failed",
      "cancelled",
      "expired",
    ];

    if (!allowedStatus.includes(payment_status)) {
      return res.status(400).json({
        success: false,
        message: "Status tidak valid",
      });
    }

    const { data: organizer } = await supabase
      .from("organizers")
      .select("id")
      .eq("user_id", req.user.id)
      .single();

    if (!organizer) {
      return res.status(404).json({
        success: false,
        message: "Organizer tidak ditemukan",
      });
    }

    const { data: events } = await supabase
      .from("events")
      .select("id")
      .eq("organizer_id", organizer.id);

    const eventIds = events.map((e) => e.id);

    const { data: order } = await supabase
      .from("orders")
      .select(`
        *,
        order_items(
          *,
          ticket_types(event_id)
        )
      `)
      .eq("id", id)
      .single();

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order tidak ditemukan",
      });
    }

    const isOwner = order.order_items.some(
      (item) =>
        eventIds.includes(
          item.ticket_types?.event_id
        )
    );

    if (!isOwner) {
      return res.status(403).json({
        success: false,
        message:
          "Anda tidak memiliki akses ke order ini",
      });
    }

    const { data, error } = await supabase
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

    res.json({
      success: true,
      message: "Status order berhasil diperbarui",
      data,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  createOrganizer,
  getOrganizers,
  getMyOrganizer,
  getOrganizerById,
  updateOrganizer,
  deleteOrganizer,
  verifyOrganizer,
  getOrganizerOrders,
  updateOrderByOrganizer,
};