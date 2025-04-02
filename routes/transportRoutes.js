import express from "express";
import TransporterController from "../controllers/transporter_api_controller/TransporterController.js";
import authenticateTransporter from "../middleware/transporterAuthMiddleware.js";
import { uploadVehicleDocuments } from "../middleware/uploadImageMiddleware.js";

const router = express.Router();

router.post("/register-transporter", TransporterController.registerTransporter);
router.post("/register-vehicle", TransporterController.registerVehicle);
router.post(
  "/upload-documents",
  authenticateTransporter,
  uploadVehicleDocuments,
  TransporterController.uploadDocuments
);
router.get(
  "/get-details",
  authenticateTransporter,
  TransporterController.getTransporterDetails
);

router.post("/login", TransporterController.loginTransporter);
router.post(
  "/pricing-upsert",
  authenticateTransporter,
  TransporterController.upsertPricing
);

export default router;
