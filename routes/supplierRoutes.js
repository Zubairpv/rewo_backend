import express from "express";
import SupplierController from "../controllers/supplier_api_controller/supplier_user_controller.js";
import authSupplier from "../middleware/supplierAuthMiddlware.js";
import { uploadSupplierDocuments } from "../middleware/uploadImageMiddleware.js";

const router = express.Router();

router.post("/register-supplier", SupplierController.registerSupplier);
router.post(
  "/supplier-materials",
  authSupplier,
  SupplierController.addMaterials
);
router.post("/documents", authSupplier,uploadSupplierDocuments, SupplierController.uploadDocuments);
router.post("/bank-details", authSupplier, SupplierController.addBankDetails);
router.get("/", authSupplier, SupplierController.getSupplier);

router.post("/login", SupplierController.loginSuppplier);
export default router;
