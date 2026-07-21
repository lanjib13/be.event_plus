const express = require("express");
const multer = require("multer");

const { uploadImage } = require("../controllers/upload.controller");
const { authMiddleware } = require("../middleware/auth.middleware");

const router = express.Router();

const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: {
    fileSize: 3 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      return cb(new Error("File harus berupa gambar"));
    }

    cb(null, true);
  },
});

router.post("/image", authMiddleware, upload.single("image"), uploadImage);

module.exports = router;