import db from "../../config/db.js";

export const createMaterial = async (
  { name, description, measurement },
  trx
) => {
  const [materialId] = await db("materials")
    .insert({ name, description, measurement })
    .transacting(trx);
  return materialId;
};

const addRelatedData = async (
  table,
  joinTable,
  materialId,
  items,
  baseJoinTable,
  trx
) => {
  if (!items?.length) return;

  // Get existing records
  const existingItems = await db(table)
    .whereIn("name", items)
    .pluck("name")
    .transacting(trx);
  const newItems = items.filter((item) => !existingItems.includes(item));

  if (newItems.length) {
    await db(table)
      .insert(newItems.map((name) => ({ name })))
      .transacting(trx);
  }

  // Fetch item IDs again
  const itemIds = await db(table)
    .whereIn("name", items)
    .pluck("id")
    .transacting(trx);
  if (!itemIds.length) return;

  // Insert into join table
  await db(joinTable)
    .insert(
      itemIds.map((id) => ({ material_id: materialId, [baseJoinTable]: id }))
    )
    .transacting(trx);
};

export const addMaterialTypes = (materialId, types, trx) =>
  addRelatedData("types", "material_types", materialId, types, "type_id", trx);

export const addMaterialSpecialities = (materialId, specialities, trx) =>
  addRelatedData(
    "specialities",
    "material_specialities",
    materialId,
    specialities,
    "speciality_id",
    trx
  );

export const addMaterialConcerns = (materialId, concerns, trx) =>
  addRelatedData(
    "concerns",
    "material_concerns",
    materialId,
    concerns,
    "concern_id",
    trx
  );

export const addMaterialImages = async (materialId, images, trx) => {
  if (!images?.length) return;
  await db("images")
    .insert(
      images.map(({ image_name, path, media_type }) => ({
        image_name,
        path,
        media_type,
        entity_id: materialId,
        entity_type: "materials",
      }))
    )
    .transacting(trx);
};

export const getAllMaterials = async () => {
  const materials = await db("materials").select("id", "name", "measurement");

  const materialIds = materials.map((m) => m.id);

  const types = await db("types")
    .join("material_types", "types.id", "material_types.type_id")
    .whereIn("material_types.material_id", materialIds)
    .select(
      "material_types.material_id as materialId",
      "types.id",
      "types.name"
    );

  const specialities = await db("specialities")
    .join(
      "material_specialities",
      "specialities.id",
      "material_specialities.speciality_id"
    )
    .whereIn("material_specialities.material_id", materialIds)
    .select(
      "material_specialities.material_id as materialId",
      "specialities.id",
      "specialities.name"
    );

  const concerns = await db("concerns")
    .join("material_concerns", "concerns.id", "material_concerns.concern_id")
    .whereIn("material_concerns.material_id", materialIds)
    .select(
      "material_concerns.material_id as materialId",
      "concerns.id",
      "concerns.name"
    );

  const images = await db("images")
    .whereIn("entity_id", materialIds)
    .andWhere("entity_type", "materials")
    .select(
      "entity_id as materialId",
      "id",
      "image_name",
      "path as url",
      "media_type"
    );

  // Map the fetched data to their respective materials
  const materialMap = materials.map((material) => ({
    ...material,
    types: types
      .filter((t) => t.materialId === material.id)
      .map(({ materialId, ...rest }) => rest),
    specialities: specialities
      .filter((s) => s.materialId === material.id)
      .map(({ materialId, ...rest }) => rest),
    concerns: concerns
      .filter((c) => c.materialId === material.id)
      .map(({ materialId, ...rest }) => rest),
    images: images
      .filter((img) => img.materialId === material.id)
      .map(({ materialId, ...rest }) => rest),
  }));

  return materialMap;
};

export async function getMaterialTypes(materialTypeIds) {
  let query = db("material_types as mt")
    .leftJoin("materials as m", "mt.material_id", "m.id")
    .leftJoin("types as t", "mt.type_id", "t.id")
    .select([
      "mt.id as material_types_id",
      "m.id as material_id",
      "m.measurement as measurement",
      "m.name as material_name",
      "t.id as types_id",
      "t.name as types_name",
    ]);

  if (materialTypeIds && materialTypeIds.length > 0) {
    query = query.whereIn("mt.id", materialTypeIds);
  }

  const result = await query;
  return result;
}

export const getMaterialById = async (materialId) => {
  const material = await db("materials").where("id", materialId).first();
  if (!material) return null;

  const types = await db("types")
    .join("material_types", "types.id", "material_types.type_id")
    .where("material_types.material_id", materialId)
    .select("types.id", "types.name");

  const specialities = await db("specialities")
    .join(
      "material_specialities",
      "specialities.id",
      "material_specialities.speciality_id"
    )
    .where("material_specialities.material_id", materialId)
    .select("specialities.id", "specialities.name");

  const concerns = await db("concerns")
    .join("material_concerns", "concerns.id", "material_concerns.concern_id")
    .where("material_concerns.material_id", materialId)
    .select("concerns.id", "concerns.name");

  const images = await db("images")
    .where("entity_id", materialId)
    .andWhere("entity_type", "materials")
    .select("id", "image_name", "path as url", "media_type");

  return { ...material, types, specialities, concerns, images };
};
// Update Material Details inside a transaction
export const updateMaterial = (id, updatedData, trx) => {
  return db("materials").where("id", id).update(updatedData).transacting(trx);
};

// Generic function to update related data (types, specialities, concerns)
const updateRelatedData = async (
  table,
  joinTable,
  materialId,
  items,
  baseJoinTable,
  trx
) => {
  if (!items?.length) return;

  // Remove existing associations within transaction
  await db(joinTable).where("material_id", materialId).del().transacting(trx);

  // Find existing items
  const existingItems = await db(table)
    .whereIn("name", items)
    .pluck("name")
    .transacting(trx);
  const newItems = items.filter((item) => !existingItems.includes(item));

  // Insert new items
  if (newItems.length) {
    await db(table)
      .insert(newItems.map((name) => ({ name })))
      .transacting(trx);
  }

  // Get item IDs
  const itemIds = await db(table)
    .whereIn("name", items)
    .pluck("id")
    .transacting(trx);
  if (!itemIds.length) return;

  // Insert new associations
  await db(joinTable)
    .insert(
      itemIds.map((id) => ({ material_id: materialId, [baseJoinTable]: id }))
    )
    .transacting(trx);
};

// Update Material Types
export const updateMaterialTypes = (materialId, types, trx) =>
  updateRelatedData(
    "types",
    "material_types",
    materialId,
    types,
    "type_id",
    trx
  );

// Update Material Specialities
export const updateMaterialSpecialities = (materialId, specialities, trx) =>
  updateRelatedData(
    "specialities",
    "material_specialities",
    materialId,
    specialities,
    "speciality_id",
    trx
  );

// Update Material Concerns
export const updateMaterialConcerns = (materialId, concerns, trx) =>
  updateRelatedData(
    "concerns",
    "material_concerns",
    materialId,
    concerns,
    "concern_id",
    trx
  );

// Update Images: Remove old and add new ones inside a transaction
export const updateMaterialImages = async (materialId, images, trx) => {
  if (!images?.length) return;

  // Fetch existing images
  const existingImages = await db("images")
    .where("entity_id", materialId)
    .andWhere("entity_type", "materials")
    .select("path")
    .transacting(trx);

  // Delete old images from DB
  await db("images")
    .where("entity_id", materialId)
    .andWhere("entity_type", "materials")
    .del()
    .transacting(trx);

  // Delete images from storage
  existingImages.forEach((img) => {
    try {
      fs.unlinkSync(img.path);
    } catch (err) {
      console.error("Failed to delete old image:", err);
    }
  });

  // Insert new images
  await db("images")
    .insert(
      images.map(({ image_name, path, media_type }) => ({
        image_name,
        path,
        media_type,
        entity_id: materialId,
        entity_type: "materials",
      }))
    )
    .transacting(trx);
};
