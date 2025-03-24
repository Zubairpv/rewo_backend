import db from "../../config/db.js";
import { getMaterialTypes } from "../../models/admin_models/materialModel.js";
import SupplierModel from "../../models/supplier_models/supplierModel.js";
import jwt from "jsonwebtoken";
import Location from "../../models/locationModel.js";
class SupplierController {
  static async registerSupplier(req, res) {
    const SECRET_KEY = process.env.JWT_SECRET;
    const trx = await db.transaction();
    try {
      const supplierData = req.body;

      const [location] = await Location.createLocation(trx, {
        latitude: supplierData.latitude,
        longitude: supplierData.longitude,
        address: supplierData.address,
        type: "supplier",
      });

      supplierData.location_id = location;
      const { latitude, longitude, address, ...filteredSupplierData } =
        supplierData;
      filteredSupplierData.registration_status = "supplier_uploaded";
      const [supplierId] = await SupplierModel.registerSupplier(
        filteredSupplierData,
        trx
      );
      const token = jwt.sign({ id: supplierId, role: "supplier" }, SECRET_KEY);

      await SupplierModel.updateJwtToken(supplierId, token, trx);
      await Location.updateLocation(trx, location, { entity_id: supplierId });
      const materials = await getMaterialTypes(null);
      await trx.commit();
      return res.json({
        success: true,
        message: "Supplier registered",
        data: {
          supplierId,
          materials,
          token,
        },
      });
    } catch (error) {
      await trx.rollback();
      if (error.code === "ER_DUP_ENTRY" || error.code === "23505") {
        return res.status(400).json({
          success: false,
          message:
            "Contact number already exists. Please use a different number.",
        });
      } else {
        return res.status(500).json({
          success: false,
          message: "Something went wrong",
          error: error.message,
        });
      }
    }
  }
  static async loginSuppplier(req, res) {
    const SECRET_KEY = process.env.JWT_SECRET;
    const trx = await db.transaction();
    try {
      const { contact_number } = req.body;
      const supplier = await SupplierModel.findByIdOrJwt(contact_number);
      console.log(supplier);

      if (!supplier) {
        return res
          .status(404)
          .json({ success: false, message: "supplier not found" });
      }

      // Generate JWT token (No Expiry)
      const token = jwt.sign({ id: supplier.id, role: "supplier" }, SECRET_KEY);

      // Store new JWT token in DB
      await SupplierModel.updateJwtToken(supplier.id, token, trx);

      trx.commit();
      const { jwt_token, ...supplierData } = supplier;
      return res.json({
        success: true,
        data: { ...supplierData, token },
        message: "Login successful",
      });
    } catch (error) {
      console.log(error);

      trx.rollback();
      return res
        .status(500)
        .json({ success: false, message: "Error logging in", error });
    }
  }
  static async addMaterials(req, res) {
    const trx = await db.transaction();
    try {
      const { materials } = req.body;
      console.log(req.supplier);
   
      await SupplierModel.addSupplierMaterials(req.supplier.id, materials, trx);
      await SupplierModel.updateRegistrationStatus(
        req.supplier.id,
        "materials_uploaded",
        trx
      );
      await trx.commit();
      return res.json({
        success: true,
        message: "Materials added successfully",
      });
    } catch (error) {
      await trx.rollback();
      return res
        .status(500)
        .json({ success: false, message: "Error adding materials", error });
    }
  }

  static async uploadDocuments(req, res) {
    const trx = await db.transaction();
    try {
      const documents = req.files;
      console.log(req.supplier.id);

      if (!documents || Object.keys(documents).length === 0) {
        return res
          .status(400)
          .json({ success: false, message: "No documents uploaded" });
      }

      // Store GST Certificate
      let gst_certificate_id = null;
      if (documents.gst_certificate) {
        const gstImage = documents.gst_certificate[0];
        const [gstRecord] = await SupplierModel.storeImage(
          {
            image_name: gstImage.filename,
            path: gstImage.path,
            media_type: gstImage.mimetype,
            entity_id: req.supplier.id,
            entity_type: "supplier_documents",
          },
          trx
        );
        gst_certificate_id = gstRecord;
      }

      // Store Company Registration Certificate
      let company_registration_id = null;
      if (documents.company_registration) {
        const companyImage = documents.company_registration[0];
        const [companyRecord] = await SupplierModel.storeImage(
          {
            image_name: companyImage.filename,
            path: companyImage.path,
            media_type: companyImage.mimetype,
            entity_id: req.supplier.id,
            entity_type: "supplier_documents",
          },
          trx
        );
        company_registration_id = companyRecord;
      }

      // Store document IDs in supplier_documents table
      await SupplierModel.uploadSupplierDocuments(
        req.supplier.id,
        { gst_certificate_id, company_registration_id },
        trx
      );
      await SupplierModel.updateRegistrationStatus(
        req.supplier.id,
        "documents_uploaded",
        trx
      );
      await RegistrationRequest.createRequest(trx, {
        user_type: "supplier",
        user_id: req.supplier.id,
        status: "pending",
      });

      await trx.commit();
      return res.json({
        success: true,
        message: "Documents uploaded successfully",
      });
    } catch (error) {
      await trx.rollback();
      return res
        .status(500)
        .json({ success: false, message: "Error uploading documents", error });
    }
  }

  static async addBankDetails(req, res) {
    const trx = await db.transaction();
    try {
      const { bankDetails } = req.body;
      await SupplierModel.addBankDetails(req.supplier.id, bankDetails, trx);
      await SupplierModel.updateRegistrationStatus(
        req.supplier.id,
        "bank_details_uploaded",
        trx
      );
      await trx.commit();
      return res.json({
        success: true,
        message: "Bank details added successfully",
      });
    } catch (error) {
      await trx.rollback();
      return res
        .status(500)
        .json({ success: false, message: "Error adding bank details", error });
    }
  }

  static async getSupplier(req, res) {
    try {
      if (!req.supplier)
        return res
          .status(404)
          .json({ success: false, message: "Supplier not found" });
      return res.json({ success: true, data: req.supplier });
    } catch (error) {
      return res
        .status(500)
        .json({ success: false, message: "Error retrieving supplier", error });
    }
  }
}

export default SupplierController;
