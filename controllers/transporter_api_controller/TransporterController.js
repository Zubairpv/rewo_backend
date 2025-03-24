import jwt from "jsonwebtoken";
import db from "../../config/db.js";
import Location from "../../models/locationModel.js";
import TransporterModel from "../../models/transporter_models/transporterModel.js";
import RegistrationRequest from "../../models/RequestModel.js";
import { getMaterialTypes } from "../../models/admin_models/materialModel.js";

import path from "path";

import { unlink } from "fs/promises"; // Correct way to import fs.promises.unlink
import cloudinary from "../../config/cloudinaryConfig.js";

class TransporterController {
  /**
   * Register a new transporter
   */
  async registerTransporter(req, res) {
    const SECRET_KEY = process.env.JWT_SECRET;
    const trx = await db.transaction();
    try {
      let token;
      const { transporter_id, location, ...transporterData } = req.body;
      let transporter;
      let location_id;

      if (transporter_id) {
        // Fetch existing transporter to get its location_id
        const existingTransporter = await TransporterModel.getTransporterById(
          trx,
          transporter_id
        );
        if (!existingTransporter) {
          await trx.rollback();
          return res.status(404).json({
            success: false,
            message: "Transporter not found",
          });
        }
        location_id = existingTransporter.location_id;

        // Update existing location
        await Location.updateLocation(trx, location_id, location);

        // Update transporter details
        transporter = await TransporterModel.updateTransporter(
          transporter_id,
          transporterData,
          trx
        );
      } else {
        // Create new location
        [location_id] = await Location.createLocation(trx, {
          ...location,
          type: "transporter",
        });

        // Insert new transporter
        transporter = await TransporterModel.createTransporter(
          {
            ...transporterData,
            location_id,
            registration_status: "transporters_uploaded",
          },
          trx
        );

        // Update location entity_id
        await Location.updateLocation(trx, location_id, {
          entity_id: transporter,
        });
        token = jwt.sign({ id: transporter, role: "transporter" }, SECRET_KEY);

        // Store JWT token in the database
        await TransporterModel.updateJwtToken(transporter, token, trx);
      }

      const materials = await getMaterialTypes(null);
      await trx.commit();

      return res.json({
        success: true,
        data: { transporter, token, materials },
        message: transporter_id
          ? "Transporter updated successfully"
          : "Transporter registered successfully",
      });
    } catch (error) {
      console.log(error);

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

  /**
   * Register a new vehicle
   */
  async registerVehicle(req, res) {
    const trx = await db.transaction();
    try {
      const { vehicle_id, material_carried, ...vehicleData } = req.body;
      console.log(material_carried);

      let vehicle;

      if (vehicle_id) {
        // Update existing vehicle
        vehicle = await TransporterModel.updateVehicle(
          vehicle_id,
          vehicleData,
          trx
        );
        await TransporterModel.removeVehicleMaterials(vehicle_id, trx);
      } else {
        // Create new vehicle
        vehicle = await TransporterModel.createVehicle(vehicleData, trx);
      }

      // Add new vehicle materials
      if (material_carried && material_carried.length > 0) {
        const vehicleMaterials = material_carried.map((material_id) => ({
          material_id: material_id,
          vehicle_id: vehicle_id ?? vehicle.id,
        }));
        await TransporterModel.addVehicleMaterials(vehicleMaterials, trx);
      }

      await TransporterModel.updateRegistrationStatus(
        vehicleData.transporter_id,
        "vehicle_uploaded",
        trx
      );

      await trx.commit();
      return res.json({
        success: true,
        data: vehicle,
        message: vehicle_id
          ? "Vehicle updated successfully"
          : "Vehicle registered successfully",
      });
    } catch (error) {
      console.log(error);

      await trx.rollback();
      return res.status(500).json({
        success: false,
        message: "Error registering/updating vehicle",
        error,
      });
    }
  }

  /**
   * Upload vehicle documents
   */
  async uploadDocuments(req, res) {
    let storedFilePaths = []; // Track file paths to delete on failure
    const trx = await db.transaction();
    try {
      const { vehicle_id } = req.body;
      if (!vehicle_id) {
        return res.status(400).json({
          success: false,
          message: "Vehicle ID is required",
        });
      }

      let uploadedDocs = [];

      // Define document keys
      const documentKeys = [
        "rc_image",
        "insurance_image",
        "driving_licence_image",
        "vehicle_video",
        "vehicle_front_image",
        "vehicle_back_image",
        "vehicle_left_image",
        "vehicle_right_image",
      ];

      for (const key of documentKeys) {
        if (req.files[key]) {
          const file = req.files[key][0];

          // Check if an entry already exists for the same vehicle and document type
          const existingEntry = await TransporterModel.getExistingDocument(
            vehicle_id,
            key,
            trx
          );

          if (existingEntry) {
            // Get the previous image path
            const previousImage = await TransporterModel.getImagePath(
              existingEntry.image_id,
              trx
            );

            // Delete previous image file from storage
            if (previousImage) {
              try {
                await unlink(path.resolve(previousImage));
                console.log(`Deleted previous file: ${previousImage}`);
              } catch (unlinkError) {
                console.error(
                  `Failed to delete previous file: ${previousImage}`,
                  unlinkError
                );
              }
            }

            // Delete previous image entry from the images table
            await TransporterModel.deleteImageEntry(
              existingEntry.image_id,
              trx
            );

            // Delete existing document entry
            await TransporterModel.deleteDocument(existingEntry.id, trx);
          }

          // Store new image entry
          const imageRecord = await TransporterModel.storeImage(
            {
              image_name: file.filename,
              path: file.path,
              media_type: file.mimetype,
              entity_id: vehicle_id,
              entity_type: "vehicle_document",
            },
            trx
          );

          uploadedDocs.push({
            vehicle_id,
            document_type: key,
            image_id: imageRecord,
          });

          storedFilePaths.push(file.path); // Store new file path
        }
      }

      if (uploadedDocs.length > 0) {
        await TransporterModel.uploadDocuments(uploadedDocs, trx);
        await TransporterModel.updateRegistrationStatus(
          vehicle_id,
          "vehicle_documents_uploaded",
          trx
        );
      }

      await RegistrationRequest.createRequest(trx, {
        user_type: "transporter",
        user_id: req.transporter.id,
        status: "pending",
      });
 
      await trx.commit();
      return res.json({
        success: true,
        message: "Documents uploaded successfully",
      });
    } catch (error) {
      console.error("Upload error:", error);
      await trx.rollback();

      // Delete uploaded files in case of failure
      for (const oldUrl of storedFilePaths) {
        try {
          const cloudinaryId = oldUrl.split("/").slice(-2).join("/").replace(/\.[^/.]+$/, "");
          console.log(`Deleting Cloudinary file: ${cloudinaryId}`);
          await cloudinary.uploader.destroy(cloudinaryId);
        } catch (cloudinaryError) {
          console.error(`Failed to delete Cloudinary file: ${oldUrl}`, cloudinaryError);
        }
      
      }

      return res.status(500).json({
        success: false,
        message: "Error uploading documents",
        error,
      });
    }
  }
  /**
   * API to add or update multiple transporter pricing records
   */
  async upsertPricing(req, res) {
    const trx = await db.transaction();
    try {
      const { price_ranges } = req.body;

      if (!Array.isArray(price_ranges) || price_ranges.length === 0) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid price range data" });
      }

      await TransporterModel.upsertPricing(
        price_ranges,
        req.transporter.id,
        trx
      );
      await trx.commit();

      return res.json({
        success: true,
        message: "Pricing data processed successfully",
      });
    } catch (error) {
      await trx.rollback();
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  async loginTransporter(req, res) {
    const SECRET_KEY = process.env.JWT_SECRET;
    const trx = await db.transaction();
    try {
      const { contact_number } = req.body;
      const transporter = await TransporterModel.findByTokenOrNumber(
        contact_number
      );
      console.log(transporter);

      if (!transporter) {
        return res
          .status(404)
          .json({ success: false, message: "Transporter not found" });
      }

      // Generate JWT token (No Expiry)
      const token = jwt.sign({ transporterId: transporter.id }, SECRET_KEY);

      // Store new JWT token in DB
      await TransporterModel.updateJwtToken(transporter.id, token, trx);

      trx.commit();
      const { jwt_token, ...transporterData } = transporter;
      return res.json({
        success: true,
        data: { ...transporterData, token },
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

  async logoutTransporter(req, res) {
    const trx = await db.transaction();
    try {
      const transporterId = req.transporter.id; // Extracted from middleware
      await TransporterModel.updateJwtToken(transporterId, null);
      trx.commit();
      return res.json({ success: true, message: "Logout successful" });
    } catch (error) {
      trx.rollback();
      return res
        .status(500)
        .json({ success: false, message: "Error logging out", error });
    }
  }

  async getTransporterDetails(req, res) {
    try {
      const transporter = req.transporter; // Middleware attaches this
      return res.json({
        success: true,
        data: transporter,
        message: "Transporter details fetched successfully",
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Error fetching transporter details",
        error,
      });
    }
  }
}

export default new TransporterController();
