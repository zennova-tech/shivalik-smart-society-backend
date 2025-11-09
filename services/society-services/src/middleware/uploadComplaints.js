// middleware/uploadComplaints.js
const path = require("path");
const fs = require("fs");
const multer = require("multer");

const UPLOAD_DIR = path.join(__dirname, "..", "uploads", "complaints");
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const safe = file.originalname.replace(/\s+/g, "_");
    cb(null, `${Date.now()}_${safe}`);
  },
});

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (/\.jpg|\.jpeg|\.png|\.gif|\.mp4|\.mov|\.webm|\.pdf/.test(ext)) {
    cb(null, true);
  } else if (/\.mp3|\.wav|\.m4a|\.ogg/.test(ext)) {
    // allow audio separately
    cb(null, true);
  } else {
    cb(new Error("Unsupported file type"));
  }
};

const upload = multer({
  storage,
  limits: { fileSize: 15 * 1024 * 1024 }, // 15 MB per file
  fileFilter,
});

module.exports = { upload, UPLOAD_DIR };
