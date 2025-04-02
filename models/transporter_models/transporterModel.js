import db from "../../config/db.js";
import RegistrationRequest from "../RequestModel.js";

class TransporterModel {
  /**
   * Create a new transporter
   */
  static async createTransporter(transporterData, trx) {
    const [transporter] = await trx("transporters").insert(transporterData);
    return transporter;
  }
  static async updateTransporter(transporter_id, transporterData, trx) {
    return trx("transporters")
      .where({ id: transporter_id })
      .update(transporterData)
      .returning("*")
      .then((rows) => rows[0]); // Return updated transporter
  }
  static async getTransporterById(trx, transporter_id) {
    return trx("transporters").where({ id: transporter_id }).first();
  }

  /**
   * Create a new vehicle
   */
  static async createVehicle(vehicleData, trx) {
    const [vehicle] = await trx("vehicles").insert(vehicleData).returning("*");
    return vehicle;
  }

  /**
   * Assign materials to a vehicle
   */
  static async addVehicleMaterials(vehicleMaterials, trx) {
    return trx("vehicle_materials").insert(vehicleMaterials).returning("*");
  }

  /**
   * Update transporter registration status
   */
  static async updateRegistrationStatus(entityId, status, trx) {
    return trx("transporters")
      .where({ id: entityId })
      .update({ registration_status: status });
  }
  static async updateVehicle(vehicle_id, vehicleData, trx) {
    return trx("vehicles")
      .where({ id: vehicle_id })
      .update(vehicleData)
      .returning("*")
      .then((rows) => rows[0]); // Return updated vehicle
  }

  static async removeVehicleMaterials(vehicle_id, trx) {
    return trx("vehicle_materials").where({ vehicle_id }).del();
  }
  /**
   * Insert or update multiple vehicle pricing entries
   * @param {Array} priceRanges - List of price range objects [{id, vehicle_id, from, to, price}]
   * @param {object} trx - Database transaction
   */
  static async upsertPricing(priceRanges, transporter_id, trx) {
    for (const range of priceRanges) {
      const { id, from, to, price } = range;

      if (!from || !to || !price) {
        throw new Error(
          "All fields (transporter_id, from, to, price) are required."
        );
      }

      if (id) {
        // Update existing price range
        await db("transporter_pricing")
          .where("id", id)
          .update({ from, to, price })
          .transacting(trx);
      } else {
        // Insert new price range
        try {
          await db("transporter_pricing")
            .insert({ transporter_id, from, to, price })
            .transacting(trx);
        } catch (error) {
          if (error.code === "ER_DUP_ENTRY") {
            throw new Error(
              `Price range (${from}-${to}) for transporter ${transporter_id} already exists.`
            );
          }
          throw error;
        }
      }
    }
  }

  /**
   * Upload vehicle documents
   */
  static async uploadDocuments(documents, trx) {
    console.log(documents);

    return trx("vehicle_documents").insert(documents);
  }

  static async storeImage(imageData, trx) {
    console.log(imageData);

    const [image] = await trx("images").insert(imageData).returning("*");
    return image;
  }
  static async getExistingDocument(vehicle_id, document_type, trx) {
    return db("vehicle_documents")
      .where({ vehicle_id, document_type })
      .first()
      .transacting(trx);
  }

  // Get image vehicle_documentspath from image ID
  static async getImagePath(image_id, trx) {
    const image = await db("images")
      .where({ id: image_id })
      .select("path")
      .first()
      .transacting(trx);
    return image ? image.path : null;
  }

  // Delete image entry from the images table
  static async deleteImageEntry(image_id, trx) {
    return db("images").where({ id: image_id }).del().transacting(trx);
  }

  // Delete existing document entry
  static async deleteDocument(document_id, trx) {
    return db("vehicle_documents")
      .where({ id: document_id })
      .del()
      .transacting(trx);
  }

  static async updateJwtToken(transporterId, jwtToken, trx) {
    await trx("transporters")
      .where("id", transporterId)
      .update({ jwt_token: jwtToken });
  }

  static async findByTokenOrNumber(identifier) {
    const transporter = await db("transporters as t")
      .where("t.contact_number", identifier)
      .orWhere("t.jwt_token", identifier)
      .orWhere("t.id", identifier) // Allow searching by ID
      .leftJoin("vehicles as v", "t.id", "v.transporter_id") // Join with vehicles
      .select([
        "t.*",
        "v.id as vehicle_id",
        "v.vehicle_number",
        "v.manufacturer",
        "v.model",
        "v.load_capacity_volume",
        "v.load_capacity_weight",
      ])
      .first();

    if (!transporter) return null;

    // Fetch all vehicle documents dynamically
    const documents = await db("vehicle_documents as vd")
      .where("vd.vehicle_id", transporter.vehicle_id)
      .leftJoin("images as img", "vd.image_id", "img.id")
      .select("vd.document_type", "img.path as image_url");

    // Format documents into key-value pairs
    transporter.documents = {};
    documents.forEach((doc) => {
      transporter.documents[doc.document_type] = doc.image_url;
    });

    // Fetch material types carried by the vehicle
    transporter.materials = await db("vehicle_materials as vm")
      .where("vm.vehicle_id", transporter.vehicle_id)
      .leftJoin("materials as m", "vm.material_id", "m.id")
      .select([
        "m.id as material_id",
        "m.measurement",
        "m.name as material_name",
      ]);

    // Fetch registration request details
    transporter.request = await RegistrationRequest.getRequestByUser(
      db,
      "transporter",
      transporter.id
    );

    return transporter;
  }
  static async getAllTransporters(page = 1, limit = 10) {
    const offset = (page - 1) * limit;

    // Fetch transporters without jwt_token
    const transporters = await db("transporters as t")
      .select([
        "t.id",
        "t.name",
        "t.contact_number",
        "t.company_name",
        "t.location_id",
        "t.owner_name",
        "t.owner_contact",
        "t.registration_status",
        "t.created_at",
        "t.updated_at",
      ])
      .limit(limit)
      .offset(offset);

    if (transporters.length === 0)
      return {
        success: true,
        data: [],
        pagination: { total: 0, page, limit, totalPages: 0 },
        message: "Transporters fetched successfully",
        error: null,
      };

    const transporterIds = transporters.map((t) => t.id);

    // Fetch vehicles related to the transporters
    const vehicles = await db("vehicles as v")
      .whereIn("v.transporter_id", transporterIds)
      .select([
        "v.transporter_id",
        "v.id as vehicle_id",
        "v.vehicle_number",
        "v.manufacturer",
        "v.model",
        "v.load_capacity_volume",
        "v.load_capacity_weight",
      ]);

    // Attach vehicles to corresponding transporters
    const transporterMap = {};
    transporters.forEach((transporter) => {
      transporterMap[transporter.id] = { ...transporter, vehicles: [] };
    });

    vehicles.forEach((vehicle) => {
      if (transporterMap[vehicle.transporter_id]) {
        transporterMap[vehicle.transporter_id].vehicles.push(vehicle);
      }
    });

    // Convert the object back to an array
    const resultTransporters = Object.values(transporterMap);

    // Get total count for pagination metadata
    const [{ total }] = await db("transporters").count("id as total");

    return {
      data: resultTransporters,
      pagination: {
        total: total,
        page: page,
        limit: limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}

export default TransporterModel;
