import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../config/cloudinaryConfig.js";

// Allowed file types
const allowedMimeTypes = {
  images: ["image/jpeg", "image/png", "image/jpg"],
  videos: ["video/mp4"],
  documents: ["application/pdf"],
  allFiles: ["image/jpeg", "image/png", "image/jpg", "application/pdf", "video/mp4"],
};

// Create Cloudinary storage dynamically
const createStorage = (folder, resourceType = "auto") => {
  return new CloudinaryStorage({
    cloudinary,
    params: async (req, file) => {
      let format = file.originalname.split(".").pop();
      return {
        folder, // e.g., "supplier"
        resource_type: resourceType, // Auto-detects if image, video, or document
        format,
      };
    },
  });
};

// File filter function
const fileFilter = (type) => {
  return (req, file, cb) => {
    if (allowedMimeTypes[type].includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type. Allowed: ${allowedMimeTypes[type].join(", ")}`), false);
    }
  };
};

// ✅ Supplier Documents Upload (Images & PDFs)
export const uploadSupplierDocuments = multer({
  storage: createStorage("supplier"),
  fileFilter: fileFilter("allFiles"),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
}).fields([
  { name: "gst_certificate", maxCount: 1 },
  { name: "company_registration", maxCount: 1 },
]);

// ✅ Vehicle Documents Upload (Images & Videos)
export const uploadVehicleDocuments = multer({
  storage: createStorage("vehicles"),
  fileFilter: fileFilter("allFiles"),
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB max
}).fields([
  { name: "rc_image", maxCount: 1 },
  { name: "insurance_image", maxCount: 1 },
  { name: "driving_licence_image", maxCount: 1 },
  { name: "vehicle_video", maxCount: 1 },
  { name: "vehicle_front_image", maxCount: 1 },
  { name: "vehicle_back_image", maxCount: 1 },
  { name: "vehicle_left_image", maxCount: 1 },
  { name: "vehicle_right_image", maxCount: 1 },
]);

// ✅ Material Images Upload
export const uploadMaterialImages = multer({
  storage: createStorage("materials"),
  fileFilter: fileFilter("images"),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
}).array("images", 3);
