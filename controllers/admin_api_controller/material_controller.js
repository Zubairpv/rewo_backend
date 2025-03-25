import {
  addMaterialTypes,
  createMaterial,
  addMaterialSpecialities,
  addMaterialConcerns,
  addMaterialImages,
  getMaterialById,
  getAllMaterials,
  updateMaterial,
  updateMaterialTypes,
  updateMaterialSpecialities,
  updateMaterialConcerns,
  updateMaterialImages,
} from "../../models/admin_models/materialModel.js";
import db from "../../config/db.js";
import fs from "fs/promises"; // For file deletion in case of failure
import { log } from "console";

export const addMaterial = async (req, res) => {
  const trx = await db.transaction(); // Start transaction
  console.log(trx);

  try {
    const { name, description, types, measurement, specialities, concerns } =
      req.body;

    if (!name || !measurement) {
      return res
        .status(400)
        .json({ success: false, message: "Name and Measurement are required" });
    }

    // Parse JSON arrays
    const parsedTypes = JSON.parse(types || "[]");
    const parsedSpecialities = JSON.parse(specialities || "[]");
    const parsedConcerns = JSON.parse(concerns || "[]");

    // Create Material Entry within transaction
    const materialId = await createMaterial(
      { name, description, measurement },
      trx
    );

    // Link Material to Types, Specialities, and Concerns
    await addMaterialTypes(materialId, parsedTypes, trx);
    await addMaterialSpecialities(materialId, parsedSpecialities, trx);
    await addMaterialConcerns(materialId, parsedConcerns, trx);

    // Process Uploaded Images
    let images = [];
    if (req.files) {
      images = req.files.map((file) => ({
        image_name: file.filename,
        path: file.path,
        media_type: file.mimetype,
      }));
      await addMaterialImages(materialId, images, trx);
    }
    console.log(req.files);
    

    await trx.commit(); // Commit transaction

    res
      .status(200)
      .json({ success: true, message: "Material added successfully" });
  } catch (error) {
    console.error(error);

    await trx.rollback(); // Rollback on error

    // Delete uploaded images if error occurs
    if (req.files) {
      await Promise.all(
        req.files.map((file) => fs.unlink(file.path).catch(() => {}))
      );
    }

    if (error.code === "ER_DUP_ENTRY" || error.code === "23505") {
      return res.status(400).json({
        success: false,
        message:
          "Contact number already exists. Please use a different number.",
      });
    }
    return res.status(500).json({
      success: false,
      message: "Something went wrong",
      error: error.message,
    });
  }
};
export const getMaterials = async (req, res) => {
  try {
    const { id } = req.params;

    if (id) {
      // Fetch Single Material
      const material = await getMaterialById(id);
      if (!material) {
        return res
          .status(404)
          .json({ success: false, message: "Material not found" });
      }
      return res.status(200).json({ success: true, data: material });
    } else {
      // Fetch All Materials (List)
      const materials = await getAllMaterials();
      return res.status(200).json({ success: true, data: materials });
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Something went wrong",
      error: error.message,
    });
  }
};
export const updateMaterialController = async (req, res) => {
  const trx = await db.transaction(); // Start transaction
  try {
    const { id } = req.params;
    console.log(req.body);
    console.log(req.files);

    const {
      name,
      description,
      types,
      measurement,
      specialities,
      concerns,
      images,
    } = req.body;

    // Validate if material exists
    const material = await getMaterialById(id);
    if (!material) {
      await trx.rollback();
      return res
        .status(404)
        .json({ success: false, message: "Material not found" });
    }

    // Parse JSON arrays safely
    const parsedTypes = JSON.parse(types || "[]");
    const parsedSpecialities = JSON.parse(specialities || "[]");
    const parsedConcerns = JSON.parse(concerns || "[]");
    const parsedImages = images ? JSON.parse(images) : [];

    // ✅ Execute updates within the transaction
    await updateMaterial(id, { name, description, measurement }, trx);
    await updateMaterialTypes(id, parsedTypes, trx);
    await updateMaterialSpecialities(id, parsedSpecialities, trx);
    await updateMaterialConcerns(id, parsedConcerns, trx);

    if (images !== undefined) {
      await updateMaterialImages(id, parsedImages, trx);
    }

    await trx.commit(); // ✅ Commit transaction
    return res
      .status(200)
      .json({ success: true, message: "Material updated successfully" });
  } catch (error) {
    await trx.rollback(); // ❌ Rollback on error
    if (error.code === "ER_DUP_ENTRY" || error.code === "23505") {
      return res.status(400).json({
        success: false,
        message:
          "Contact number already exists. Please use a different number.",
      });
    }
    return res.status(500).json({
      success: false,
      message: "Something went wrong",
      error: error.message,
    });
  }
};
