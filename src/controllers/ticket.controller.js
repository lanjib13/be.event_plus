const supabase = require("../config/supabase");
const generateQRCode = require("../utils/generateQRCode");

const checkAndExpireTickets = async (tickets) => {
  if (!tickets) return;
  const isArray = Array.isArray(tickets);
  const ticketList = isArray ? tickets : [tickets];
  const now = new Date();
  const statusUpdates = [];

  for (const ticket of ticketList) {
    if (ticket.events) {
      const startDate = ticket.events.start_date ? new Date(ticket.events.start_date) : null;
      const rawEndDate = ticket.events.end_date ? new Date(ticket.events.end_date) : null;
      const validStart = startDate && !Number.isNaN(startDate.getTime());
      const validEnd = rawEndDate && !Number.isNaN(rawEndDate.getTime()) && (!validStart || rawEndDate >= startDate);
      const eventEndDate = validEnd ? rawEndDate : validStart ? new Date(startDate.getTime() + 24 * 60 * 60 * 1000) : null;

      const shouldBeExpired = validStart && startDate > now ? false : eventEndDate && eventEndDate < now;
      if (ticket.ticket_status === "active" && shouldBeExpired) {
        ticket.ticket_status = "expired";
        statusUpdates.push({ id: ticket.id, status: "expired" });
      } else if (ticket.ticket_status === "expired" && !shouldBeExpired) {
        ticket.ticket_status = "active";
        statusUpdates.push({ id: ticket.id, status: "active" });
      }
    }
  }

  for (const update of statusUpdates) {
    await supabase.from("tickets").update({ ticket_status: update.status }).eq("id", update.id);
  }
};

const ensureTicketQrCodes = async (tickets) => {
  if (!tickets) return;
  const ticketList = Array.isArray(tickets) ? tickets : [tickets];

  for (const ticket of ticketList) {
    if (typeof ticket.qr_code === "string" && ticket.qr_code.startsWith("data:image/")) continue;

    const source = ticket.qr_token || ticket.qr_code || `ticket-${ticket.id}`;

    const qrCode = await generateQRCode(source);
    ticket.qr_code = qrCode;
    ticket.qr_token = source;
    await supabase.from("tickets").update({ qr_code: qrCode, qr_token: source }).eq("id", ticket.id);
  }
};

const getTickets = async (req, res) => {
  const { data, error } = await supabase
    .from("tickets")
    .select("*, users(name, email), events(title, location, start_date, end_date)");

  if (error) return res.status(400).json({ success: false, message: error.message });

  await checkAndExpireTickets(data);
  await ensureTicketQrCodes(data);

  res.json({ success: true, message: "Data tiket", data });
};

const getTicketById = async (req, res) => {
  const { id } = req.params;

  const { data, error } = await supabase
    .from("tickets")
    .select("*, users(name, email), events(title, location, start_date, end_date, banner_url, description)")
    .eq("id", id)
    .single();

  if (error) return res.status(404).json({ success: false, message: "Tiket tidak ditemukan" });

  await checkAndExpireTickets(data);
  await ensureTicketQrCodes(data);

  res.json({ success: true, message: "Detail tiket", data });
};

const getTicketsByUser = async (req, res) => {
  const { userId } = req.params;

  const { data, error } = await supabase
    .from("tickets")
    .select(`
      *,
      events (
        id,
        title,
        location,
        start_date,
        end_date,
        banner_url
      )
    `)
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }

  await checkAndExpireTickets(data);
  await ensureTicketQrCodes(data);

  return res.json({
    success: true,
    data,
  });
};

const getTicketsByOrder = async (req, res) => {
  const { orderId } = req.params;

  const { data, error } = await supabase
    .from("order_items")
    .select("*, tickets(*)")
    .eq("order_id", orderId);

  if (error) return res.status(400).json({ success: false, message: error.message });

  await ensureTicketQrCodes((data || []).flatMap((item) => item.tickets || []));

  res.json({ success: true, message: "Tiket berdasarkan order", data });
};

module.exports = {
  getTickets,
  getTicketById,
  getTicketsByUser,
  getTicketsByOrder,
  checkAndExpireTickets,
};
