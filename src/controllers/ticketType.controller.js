const supabase = require("../config/supabase");

const createTicketType = async (req, res) => {
  const { event_id, name, price, quota, status } = req.body;

  const { data, error } = await supabase
    .from("ticket_types")
    .insert([{ event_id, name, price, quota, status: status || "available" }])
    .select()
    .single();

  if (error) return res.status(400).json({ success: false, message: error.message });

  res.status(201).json({ success: true, message: "Jenis tiket berhasil dibuat", data });
};

const getTicketTypesByEvent = async (req, res) => {
  const { eventId } = req.params;

  const { data, error } = await supabase
    .from("ticket_types")
    .select("*")
    .eq("event_id", eventId);

  if (error) return res.status(400).json({ success: false, message: error.message });

  res.json({ success: true, message: "Jenis tiket event", data });
};

const getTicketTypeById = async (req, res) => {
  const { id } = req.params;

  const { data, error } = await supabase
    .from("ticket_types")
    .select("*")
    .eq("id", id)
    .single();

  if (error) return res.status(404).json({ success: false, message: "Jenis tiket tidak ditemukan" });

  res.json({ success: true, message: "Detail jenis tiket", data });
};

const updateTicketType = async (req, res) => {
  const { id } = req.params;

  const { data, error } = await supabase
    .from("ticket_types")
    .update(req.body)
    .eq("id", id)
    .select()
    .single();

  if (error) return res.status(400).json({ success: false, message: error.message });

  res.json({ success: true, message: "Jenis tiket berhasil diupdate", data });
};

const deleteTicketType = async (req, res) => {
  const { id } = req.params;

  const { error } = await supabase.from("ticket_types").delete().eq("id", id);

  if (error) return res.status(400).json({ success: false, message: error.message });

  res.json({ success: true, message: "Jenis tiket berhasil dihapus" });
};

module.exports = {
  createTicketType,
  getTicketTypesByEvent,
  getTicketTypeById,
  updateTicketType,
  deleteTicketType,
};