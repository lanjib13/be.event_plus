const supabase = require("../config/supabase");

const scanCheckin = async (req, res) => {
  try {
    const { qr_code } = req.body;

    if (!qr_code) {
      return res.status(400).json({
        success: false,
        message: "QR Code wajib diisi",
      });
    }

    const { data: ticket, error } = await supabase
      .from("tickets")
      .select(`
        *,
        users(name,email),
        events(title,start_date,end_date)
      `)
      .eq("qr_token", qr_code)
      .single();

    if (error || !ticket) {
      return res.status(404).json({
        success: false,
        message: "QR Ticket tidak ditemukan",
      });
    }

    // Check if event time has passed
    const now = new Date();
    const startDate = ticket.events?.start_date ? new Date(ticket.events.start_date) : null;
    const rawEndDate = ticket.events?.end_date ? new Date(ticket.events.end_date) : null;
    const validStart = startDate && !Number.isNaN(startDate.getTime());
    const validEnd = rawEndDate && !Number.isNaN(rawEndDate.getTime()) && (!validStart || rawEndDate >= startDate);
    const eventEndDate = validEnd ? rawEndDate : validStart ? new Date(startDate.getTime() + 24 * 60 * 60 * 1000) : null;

    if ((!validStart || startDate <= now) && eventEndDate && eventEndDate < now) {
      if (ticket.ticket_status !== "expired") {
        await supabase
          .from("tickets")
          .update({ ticket_status: "expired" })
          .eq("id", ticket.id);
      }
      return res.status(400).json({
        success: false,
        message: "Tiket sudah kedaluwarsa (expired)",
      });
    }

    // Pulihkan data lama yang pernah keliru ditandai expired sebelum event berakhir.
    if (ticket.ticket_status === "expired") {
      await supabase.from("tickets").update({ ticket_status: "active" }).eq("id", ticket.id);
      ticket.ticket_status = "active";
    }

    if (ticket.ticket_status === "used") {
      return res.status(400).json({
        success: false,
        message: "Tiket sudah digunakan",
      });
    }

    if (ticket.ticket_status !== "active") {
      return res.status(400).json({
        success: false,
        message: "Tiket tidak aktif",
      });
    }

    const { error: updateError } = await supabase
      .from("tickets")
      .update({
        ticket_status: "used",
      })
      .eq("id", ticket.id);

    if (updateError) {
      return res.status(400).json({
        success: false,
        message: updateError.message,
      });
    }

    const { data: checkin, error: checkinError } = await supabase
      .from("checkins")
      .insert([
        {
          ticket_id: ticket.id,
          checked_in_by: req.user.id,
          status: "success",
        },
      ])
      .select()
      .single();

    if (checkinError) {
      return res.status(400).json({
        success: false,
        message: checkinError.message,
      });
    }

    return res.json({
      success: true,
      message: "Check-in berhasil",
      data: {
        checkin,
        ticket,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getCheckinsByEvent = async (req, res) => {
  const { eventId } = req.params;

  const { data, error } = await supabase
    .from("checkins")
    .select("*, tickets!inner(event_id, users(name, email))")
    .eq("tickets.event_id", eventId);

  if (error) return res.status(400).json({ success: false, message: error.message });

  res.json({ success: true, message: "Data check-in event", data });
};

const getCheckinByTicket = async (req, res) => {
  const { ticketId } = req.params;

  const { data, error } = await supabase
    .from("checkins")
    .select("*")
    .eq("ticket_id", ticketId)
    .maybeSingle();

  if (error) return res.status(400).json({ success: false, message: error.message });

  res.json({ success: true, message: "Status check-in tiket", data });
};

module.exports = {
  scanCheckin,
  getCheckinsByEvent,
  getCheckinByTicket,
};
