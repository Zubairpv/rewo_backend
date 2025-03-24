import express from "express";
import {
  createNewAdmin,
  loginAdmin,
  requestPasswordReset,
  resetPassword,
} from "../controllers/admin_api_controller/admin_user_controller.js";
import {
  validateAdminCreate,
  validateAdminLogin,
  verifyToken,
} from "../middleware/adminAuthMiddleware.js";
import {  uploadMaterialImages } from "../middleware/uploadImageMiddleware.js";
import {
  addMaterial,
  getMaterials,
  updateMaterialController,
} from "../controllers/admin_api_controller/material_controller.js";
import { updateRequestStatus } from "../controllers/buyer_api_controller/buyer_user_controller.js";
import { listAllWorksitesAdmin } from "../controllers/buyer_api_controller/worksite_controller.js";
import { validateBuyerToken } from "../middleware/buyerAuthMiddleware.js";

const router = express.Router();

// Admin login route
router.post("/login", validateAdminLogin, loginAdmin);
router.post("/update-request-status",verifyToken, updateRequestStatus);

//admin create route
router.post("/create", validateAdminCreate, createNewAdmin);
router.post("/forgot-password", requestPasswordReset);
router.post("/reset-password", resetPassword);
router.post("/create-material", verifyToken, uploadMaterialImages, addMaterial); // Add Material with Image Upload Middleware
router.get("/materials/:id?", verifyToken, getMaterials); // Supports both single & list
router.put(
  "/materials/:id",
  verifyToken,
  uploadMaterialImages,
  updateMaterialController
);

router.get("/worksites",verifyToken, listAllWorksitesAdmin);

export default router;
