// middleware/uploadRegistration.js
const path = require("path");
const fs = require("fs");
const multer = require("multer");

const UPLOAD_DIR_PROFILES = path.join(__dirname, "..", "uploads", "profiles");
const UPLOAD_DIR_OWNERSHIP = path.join(__dirname, "..", "uploads", "ownership-proofs");

// Ensure directories exist
if (!fs.existsSync(UPLOAD_DIR_PROFILES)) fs.mkdirSync(UPLOAD_DIR_PROFILES, { recursive: true });
if (!fs.existsSync(UPLOAD_DIR_OWNERSHIP)) fs.mkdirSync(UPLOAD_DIR_OWNERSHIP, { recursive: true });

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    if (file.fieldname === "profilePicture") {
      cb(null, UPLOAD_DIR_PROFILES);
    } else if (file.fieldname === "ownershipProof") {
      cb(null, UPLOAD_DIR_OWNERSHIP);
    } else {
      cb(new Error("Invalid field name"));
    }
  },
  filename: function (req, file, cb) {
    const safeName = file.originalname.replace(/\s+/g, "_");
    const prefix = file.fieldname === "profilePicture" ? "profile" : "ownership";
    cb(null, `${prefix}_${Date.now()}_${safeName}`);
  },
});

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  // Allow images and PDFs
  if (/\.jpg|\.jpeg|\.png|\.gif|\.pdf/.test(ext)) {
    cb(null, true);
  } else {
    cb(new Error("Only images (jpg, jpeg, png, gif) and PDFs are allowed"));
  }
};

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB per file
  fileFilter,
});

module.exports = { upload, UPLOAD_DIR_PROFILES, UPLOAD_DIR_OWNERSHIP };

