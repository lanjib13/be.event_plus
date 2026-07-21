const supabase = require("../config/supabase");

const getUsers = async (req, res) => {
  const { data, error } = await supabase.from("users").select("*");

  if (error) return res.status(400).json({ success: false, message: error.message });

  const users = data.map((user) => {
    delete user.password;
    return user;
  });

  res.json({ success: true, message: "Data users", data: users });
};

const getUserById = async (req, res) => {
  const { id } = req.params;

  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("id", id)
    .single();

  if (error) return res.status(404).json({ success: false, message: "User tidak ditemukan" });

  delete data.password;

  res.json({ success: true, message: "Detail user", data });
};
const updateUser = async (req, res) => {
  const { id } = req.params;
  const { name, phone, photo_url } = req.body;

  // Authorization check: Only allow admin or the user themselves
  if (req.user.role !== "admin" && req.user.id !== id) {
    return res.status(403).json({ success: false, message: "Akses ditolak" });
  }

  const { data, error } = await supabase
    .from("users")
    .update({ name, phone, photo_url })
    .eq("id", id)
    .select()
    .single();

  if (error) return res.status(400).json({ success: false, message: error.message });

  delete data.password;

  res.json({ success: true, message: "User berhasil diupdate", data });
};

const deleteUser = async (req, res) => {
  const { id } = req.params;

  const { error } = await supabase.from("users").delete().eq("id", id);

  if (error) return res.status(400).json({ success: false, message: error.message });

  res.json({ success: true, message: "User berhasil dihapus" });
};
module.exports = {
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
};