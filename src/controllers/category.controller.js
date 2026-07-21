const supabase = require("../config/supabase");

const createCategory = async (req, res) => {
  const { name } = req.body;

  if (!name) {
    return res.status(400).json({
      success: false,
      message: "Nama kategori wajib diisi",
    });
  }

  const { data, error } = await supabase
    .from("categories")
    .insert([{ name }])
    .select()
    .single();

  if (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }

  res.status(201).json({
    success: true,
    message: "Kategori berhasil dibuat",
    data,
  });
};

const getCategories = async (req, res) => {
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }

  res.json({
    success: true,
    message: "Data kategori",
    data,
  });
};

const getCategoryById = async (req, res) => {
  const { id } = req.params;

  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    return res.status(404).json({
      success: false,
      message: "Kategori tidak ditemukan",
    });
  }

  res.json({
    success: true,
    message: "Detail kategori",
    data,
  });
};

const updateCategory = async (req, res) => {
  const { id } = req.params;
  const { name } = req.body;

  const { data, error } = await supabase
    .from("categories")
    .update({ name })
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
    message: "Kategori berhasil diupdate",
    data,
  });
};

const deleteCategory = async (req, res) => {
  const { id } = req.params;

  const { error } = await supabase
    .from("categories")
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
    message: "Kategori berhasil dihapus",
  });
};

module.exports = {
  createCategory,
  getCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
};