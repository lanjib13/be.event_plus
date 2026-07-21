const supabase = require("../config/supabase");

const createEvent = async (req, res) => {
  const {
    organizer_id,
    category_id,
    title,
    description,
    location,
    start_date,
    end_date,
    banner_url,
    status,
  } = req.body;

  // Verify that the organizer is approved
  const { data: organizer, error: orgError } = await supabase
    .from("organizers")
    .select("verification_status")
    .eq("id", organizer_id)
    .single();

  if (orgError || !organizer) {
    return res.status(400).json({ success: false, message: "Profil organizer tidak ditemukan atau belum lengkap." });
  }

  if (organizer.verification_status !== "approved") {
    return res.status(403).json({ success: false, message: "Akun organizer belum disetujui oleh Admin." });
  }

  const { data, error } = await supabase
    .from("events")
    .insert([
      {
        organizer_id,
        category_id,
        title,
        description,
        location,
        start_date,
        end_date,
        banner_url,
        status: status || "draft",
      },
    ])
    .select()
    .single();

  if (error) return res.status(400).json({ success: false, message: error.message });

  res.status(201).json({ success: true, message: "Event berhasil dibuat", data });
};

const getEvents = async (req, res) => {
  const { data, error } = await supabase
    .from("events")
    .select("*, organizers(organizer_name), categories(name)")
    .order("created_at", { ascending: false });

  if (error) return res.status(400).json({ success: false, message: error.message });

  res.json({ success: true, message: "Data event", data });
};

const getEventById = async (req, res) => {
  const { id } = req.params;

  const { data, error } = await supabase
    .from("events")
    .select("*, organizers(organizer_name), categories(name), ticket_types(*)")
    .eq("id", id)
    .single();

  if (error) return res.status(404).json({ success: false, message: "Event tidak ditemukan" });

  res.json({ success: true, message: "Detail event", data });
};

const updateEvent = async (req, res) => {
  const { id } = req.params;

  const { data, error } = await supabase
    .from("events")
    .update(req.body)
    .eq("id", id)
    .select()
    .single();

  if (error) return res.status(400).json({ success: false, message: error.message });

  res.json({ success: true, message: "Event berhasil diupdate", data });
};

const deleteEvent = async (req, res) => {
  const { id } = req.params;

  const { error } = await supabase.from("events").delete().eq("id", id);

  if (error) return res.status(400).json({ success: false, message: error.message });

  res.json({ success: true, message: "Event berhasil dihapus" });
};

const getEventsByOrganizer = async (req, res) => {
  const { organizerId } = req.params;

  const { data, error } = await supabase
    .from("events")
    .select("*")
    .eq("organizer_id", organizerId);

  if (error) return res.status(400).json({ success: false, message: error.message });

  res.json({ success: true, message: "Event milik organizer", data });
};

module.exports = {
  createEvent,
  getEvents,
  getEventById,
  updateEvent,
  deleteEvent,
  getEventsByOrganizer,
};