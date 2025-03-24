import { Router } from "express";
import {
  getRequestStatus,
  loginBuyer,
  logoutBuyer,
  registerBuyer,
} from "../controllers/buyer_api_controller/buyer_user_controller.js";
import {
  validateBuyerToken,
  validateLogin,
  validateRegister,
} from "../middleware/buyerAuthMiddleware.js";
import {
  addWorksite,
  deleteWorksite,
  editWorksite,
  getBuyerWorksites,
  getWorksite,
} from "../controllers/buyer_api_controller/worksite_controller.js";
import { getMaterials } from "../controllers/admin_api_controller/material_controller.js";
const router = Router();

router.post("/register", validateRegister, registerBuyer);
router.post("/login", validateLogin, loginBuyer);
router.get("/request-status", validateBuyerToken, getRequestStatus);

router.post("/logout", validateBuyerToken, logoutBuyer);

router.post("/add-worksite", validateBuyerToken, addWorksite);
router.put("/edit-worksite/:id", validateBuyerToken, editWorksite);
router.delete("/delete-worksite/:id", validateBuyerToken, deleteWorksite);
router.get("/worksite/:id", validateBuyerToken, getWorksite);
router.get("/list-worksite", validateBuyerToken, getBuyerWorksites);

router.get("/materials/:id?", validateBuyerToken, getMaterials); // Supports both single & list
export default router;
