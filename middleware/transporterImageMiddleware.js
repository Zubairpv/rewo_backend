import multer from "multer";
import path from "path";
import fs from "fs";

// Define storage for uploaded images
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = "uploads/vehicles";
        fs.mkdirSync(uploadPath, { recursive: true });
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}_${file.fieldname}${path.extname(file.originalname)}`);
    }
});

// Allowed image keys
const imageKeys = [
    "rc_image",
    "insurance_image",
    "driving_licence_image",
    "vehicle_video",
    "vehicle_front_image",
    "vehicle_back_image",
    "vehicle_left_image",
    "vehicle_right_image"
];

// Multer configuration
const upload = multer({
    storage,
    fileFilter: (req, file, cb) => {
        const allowedMimeTypes = ["image/jpeg", "image/png", "image/jpg", "video/mp4"];
        if (allowedMimeTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error("Only images and MP4 videos are allowed"));
        }
    }
}).fields(imageKeys.map((key) => ({ name: key, maxCount: 1 })));

export default upload;
