import db from "../../config/db.js";
import Worksite from "../../models/buyer_models/workSiteModel.js";
import Location from "../../models/locationModel.js";

// 📌 Add Worksite
export async function addWorksite(req, res) {
  const trx = await db.transaction();
  try {
    const {
      site_name,
      customer_name,
      latitude,
      longitude,
      address,
      detailed_address,
      hint_about_location,
      description,
    } = req.body;
    const buyer_id = req.buyer.id; // ✅  Always available

    // Insert location
    const [location] = await Location.createLocation(trx, {
      latitude,
      longitude,
      address,
      type: "site",
      entity_id: 0,
    });

    // Insert worksite
    const [worksite] = await Worksite.createWorksite(trx, {
      site_name,
      customer_name,
      location_id: location,
      detailed_address,
      hint_about_location,
      description,
      buyer_id,
    });
    await Location.updateLocation(trx, location, { entity_id: worksite });

    await trx.commit();
    res.status(201).json({
      success: true,
      data: {
        id:worksite,location_id:location
      },
      message: "Worksite added successfully",
    });
  } catch (error) {
    console.log(error);

    await trx.rollback();
    res.status(500).json({
      success: false,
      data: null,
      message: "Server error",
      error: error.sqlMessage ?? error.message,
    });
  }
}

// 📌 Edit Worksite
export async function editWorksite(req, res) {
  const trx = await db.transaction();
  try {
    const { id } = req.params;
    const {
      site_name,
      customer_name,
      latitude,
      longitude,
      address,
      detailed_address,
      hint_about_location,
      description,
    } = req.body;

    // Get existing worksite
    const worksite = await Worksite.getWorksiteById(trx, id);
    if (!worksite) {
      await trx.rollback();

      return res.status(404).json({
        success: false,
        data: null,
        message: "Worksite not found",
        error: null,
      });
    }

    // Update location
    await Location.updateLocation(trx, worksite.location_id, {
      latitude,
      longitude,
      address,
    });

    // Update worksite details
    const updatedWorksite = await Worksite.updateWorksite(trx, id, {
      site_name,
      customer_name,
      detailed_address,
      hint_about_location,
      description,
    });

    await trx.commit();
    res.status(200).json({
      success: true,
      data: updatedWorksite,
      message: "Worksite updated successfully",
      error: null,
    });
  } catch (error) {
    await trx.rollback();
    res.status(500).json({
      success: false,
      data: null,
      message: "Server error",
      error: error.sqlMessage ?? error.message,
    });
  }
}

// 📌 Delete Worksite
export async function deleteWorksite(req, res) {
  const trx = await db.transaction();
  try {
    const { id } = req.params;

    // Check if worksite exists
    const worksite = await Worksite.getWorksiteById(trx, id);
    if (!worksite) {
      await trx.rollback();
      return res.status(404).json({
        success: false,
        data: null,
        message: "Worksite not found",
        error: null,
      });
    }

    // Delete worksite
    await Worksite.deleteWorksite(trx, id);
    await trx.commit();
    res.status(200).json({
      success: true,
      data: null,
      message: "Worksite deleted successfully",
      error: null,
    });
  } catch (error) {
    await trx.rollback();
    res.status(500).json({
      success: false,
      data: null,
      message: "Server error",
      error: error.sqlMessage ?? error.message,
    });
  }
}
// 📌 Get Worksite by ID
export async function getWorksite(req, res) {
  const { id } = req.params;
  if (!id) {
    return res.status(400).json({
      success: false,
      data: null,
      message: "Worksite ID is required",
      error: "Invalid request",
    });
  }

  const trx = await db.transaction();
  try {
    const worksite = await Worksite.getWorksiteById(trx, id);
    await trx.commit();

    if (!worksite) {
      return res.status(404).json({
        success: false,
        data: null,
        message: "Worksite not found",
        error: null,
      });
    }

    res.status(200).json({
      success: true,
      data: worksite,
      message: "Worksite retrieved successfully",
      error: null,
    });
  } catch (error) {
    await trx.rollback();
    res.status(500).json({
      success: false,
      data: null,
      message: "Server error",
      error: error.sqlMessage ?? error.message,
    });
  }
}

// 📌 List Worksites by Buyer
export async function getBuyerWorksites(req, res) {
  const buyer_id = req.buyer.id; // Buyer ID from token
  const trx = await db.transaction();

  try {
    const worksites = await Worksite.listWorksitesByBuyer(trx, buyer_id);
    await trx.commit();

    if (!worksites) {
      return res.status(200).json({
        success: false,
        data: [],
        message: "No worksites found for this buyer",
        error: "No records available",
      });
    }

    res.status(200).json({
      success: true,
      data: worksites,
      message: "Worksites retrieved successfully",
      error: null,
    });
  } catch (error) {
    await trx.rollback();
    res.status(500).json({
      success: false,
      data: null,
      message: "Server error",
      error: error.message,
    });
  }
}

export async function listAllWorksitesAdmin(req, res) {
  const trx = await db.transaction();
  try {
    let { page = 1, limit = 10 } = req.query;
    page = parseInt(page, 10);
    limit = parseInt(limit, 10);

    // Fetch worksite data
    const worksites = await Worksite.listAllWorksites(trx, page, limit);
    const totalCount = await Worksite.getWorksiteCount(trx);

    await trx.commit();

    res.status(200).json({
      success: true,
      data: {
        worksites,
        pagination: {
          totalRecords: totalCount,
          currentPage: page,
          totalPages: Math.ceil(totalCount / limit),
          perPage: limit,
        },
      },
      message: "Worksites retrieved successfully",
      error: null,
    });
  } catch (error) {
    await trx.rollback();
    res.status(500).json({
      success: false,
      data: null,
      message: "Server error",
      error: error.message,
    });
  }
}
