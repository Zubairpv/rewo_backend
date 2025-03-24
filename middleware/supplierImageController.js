import multer from "multer";
import path from "path";

import fs from "fs";
// Define storage engine
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    fs.mkdirSync("uploads/supplier", { recursive: true });

    cb(null, "uploads/supplier"); // Save files in the "uploads" folder
  },
  filename: function (req, file, cb) {
    console.log(file);

    cb(null, file.fieldname + Date.now() + path.extname(file.originalname)); // Unique filename
  },
});

// Allowed file types
const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = ["image/jpeg", "image/png", "application/pdf"];
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error("Invalid file type. Only JPG, PNG, and PDF are allowed."),
      false
    );
  }
};

// Upload settings
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // Limit file size to 5MB
}).fields([
  { name: "gst_certificate", maxCount: 1 },
  { name: "company_registration", maxCount: 1 },
]);

export default upload;
