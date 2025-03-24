import db from "../../config/db.js";
import { getMaterialTypes } from "../admin_models/materialModel.js";

class SupplierModel {
  static async registerSupplier(data, trx) {
    return db("suppliers").insert(data).transacting(trx);
  }

  static async addSupplierMaterials(supplierId, materials, trx) {
    const materialEntries = materials.map((material) => ({
      supplier_id: supplierId,
      material_type_id: material.id,
      price: material.price,
    }));
    return db("supplier_materials").insert(materialEntries).transacting(trx);
  }
  static async storeImage(data, trx) {
    return db("images").insert(data, ["id"]).transacting(trx);
  }
  static async updateRegistrationStatus(entityId, status, trx) {
    return trx("suppliers")
      .where({ id: entityId })
      .update({ registration_status: status });
  }
  static async uploadSupplierDocuments(supplierId, documentIds, trx) {
    return db("supplier_documents")
      .insert({ supplier_id: supplierId, ...documentIds })
      .transacting(trx);
  }
  static async updateJwtToken(supplierID, jwtToken, trx) {
    await trx("suppliers")
      .where("id", supplierID)
      .update({ jwt_token: jwtToken });
  }

  static async addBankDetails(supplierId, bankData, trx) {
    return db("supplier_bank_details")
      .insert({ supplier_id: supplierId, ...bankData })
      .transacting(trx);
  }

  static async findByIdOrJwt(supplierIdentifier) {
    const supplier = await db("suppliers as s")
      .where("s.id", supplierIdentifier)
      .orWhere("s.jwt_token", supplierIdentifier)
      .orWhere("s.contact_number", supplierIdentifier)
      .first();

    if (!supplier) return null;

    // Fetch materials linked to the supplier
    const materials = await db("supplier_materials as sm")
      .where("sm.supplier_id", supplier.id)
      .leftJoin("material_types as mt", "sm.material_type_id", "mt.id")
      .leftJoin("materials as m", "mt.material_id", "m.id")
      .leftJoin("types as t", "mt.type_id", "t.id")
      .select([
        "mt.id as material_types_id",
        "m.id as material_id",
        "m.measurement as measurement",
        "m.name as material_name",
        "t.id as types_id",
        "t.name as types_name",
        "sm.price as price", // Get price directly from supplier_materials
      ]);

    // Fetch supplier documents (GST certificate & Company registration certificate)
    const documents = await db("supplier_documents as sd")
      .where("sd.supplier_id", supplier.id)
      .leftJoin("images as gst_img", "sd.gst_certificate_id", "gst_img.id")
      .leftJoin("images as reg_img", "sd.company_registration_id", "reg_img.id")
      .select(
        "gst_img.path as gst_certificate",
        "reg_img.path as company_registration_certificate"
      );

    // Fetch supplier bank details
    const bankDetails = await db("supplier_bank_details as sb")
      .where("sb.supplier_id", supplier.id)
      .select(
        "sb.account_holder_name",
        "sb.account_number",
        "sb.bank_name",
        "sb.ifsc_code",
        "sb.branch_name"
      )
      .first();

    // Attach related data
    supplier.materials = materials;
    supplier.documents = documents.length > 0 ? documents[0] : {};
    supplier.bank_details = bankDetails || {};

    return supplier;
  }
}

export default SupplierModel;
