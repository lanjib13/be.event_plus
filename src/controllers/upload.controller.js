const supabase = require("../config/supabase");

const allowedBuckets = ["user-photos", "organizer-logos", "event-banners"];

const uploadImage = async (req, res) => {
  try {
    const { bucket } = req.body;

    if (!bucket || !allowedBuckets.includes(bucket)) {
      return res.status(400).json({
        success: false,
        message:
          "Bucket tidak valid. Gunakan user-photos, organizer-logos, atau event-banners",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "File gambar wajib diupload",
      });
    }

    const file = req.file;
    const fileExt = file.originalname.split(".").pop();
    const fileName = `${Date.now()}-${Math.random()
      .toString(36)
      .substring(2)}.${fileExt}`;

    const folder =
      bucket === "user-photos"
        ? "profiles"
        : bucket === "organizer-logos"
        ? "logos"
        : "banners";

    const filePath = `${folder}/${fileName}`;

    const { error } = await supabase.storage
      .from(bucket)
      .upload(filePath, file.buffer, {
        contentType: file.mimetype,
        upsert: false,
      });

    if (error) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);

    return res.json({
      success: true,
      message: "Upload gambar berhasil",
      data: {
        bucket,
        path: filePath,
        url: data.publicUrl,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  uploadImage,
};