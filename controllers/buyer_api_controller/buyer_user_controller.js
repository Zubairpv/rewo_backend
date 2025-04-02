import jwt from "jsonwebtoken";
import Buyer from "../../models/buyer_models/buyerModel.js";
import Location from "../../models/locationModel.js";
import RegistrationRequest from "../../models/RequestModel.js";
import db from "../../config/db.js";
import { log } from "console";
export async function registerBuyer(req, res) {
  const trx = await db.transaction();
  try {
    const {
      name,
      contact_number,
      company_name,
      gst_number,
      latitude,
      longitude,
      address,
    } = req.body;

    // 🛑 Check if buyer already exists
    const existingBuyer = await Buyer.getBuyerByContact(contact_number, false);
    if (existingBuyer) {
      await trx.rollback();
      return res.status(400).json({
        success: false,
        data: null,
        message: "Buyer already exists",
        error: null,
      });
    }

    // ✅ Step 1: Insert Location
    const [location] = await Location.createLocation(trx, {
      latitude,
      longitude,
      address,
      type: "buyer",
      entity_id: 0,
    });
    console.log(location);

    if (!location) {
      await trx.rollback();
      return res.status(400).json({
        success: false,
        data: null,
        message: "Failed to create location",
        error: null,
      });
    }

    // ✅ Step 2: Insert Buyer using location_id
    const [buyer] = await Buyer.createBuyer(trx, {
      name,
      contact_number,
      company_name,
      gst_number,
      location_id: location,
    });

    // ✅ Step 3: Generate JWT token
    const token = jwt.sign(
      { id: buyer, contact_number: buyer.contact_number },
      process.env.JWT_SECRET
    );
    await Buyer.updateBuyerToken(trx, buyer, token);

    // ✅ Step 4: Insert Registration Request
    await RegistrationRequest.createRequest(trx, {
      user_type: "buyer",
      user_id: buyer,
      status: "pending",
    });
    await Location.updateLocation(trx, location, { entity_id: buyer });

    // 🔄 Commit Transaction
    await trx.commit();

    res.status(201).json({
      success: true,
      data: { buyer, token },
      message: "Registration request submitted",
      error: null,
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

// 📌 Get Registration Request Status
export async function getRequestStatus(req, res) {
  try {
    console.log("req", req.buyer);

    const user_id = req.buyer.id;
    console.log(user_id);

    const request = await RegistrationRequest.getRequestByUser(
      db,
      "buyer",
      user_id
    );
    if (!request) {
      return res.status(404).json({
        success: false,
        data: null,
        message: "Request not found",
        error: null,
      });
    }
    res.status(200).json({
      success: true,
      data: request,
      message: "Request status retrieved",
      error: null,
    });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, data: null, message: "Server error", error });
  }
}

// 📌 Update Registration Status
export async function updateRequestStatus(req, res) {
  const trx = await db.transaction();
  try {
    const { request_id, status, remark } = req.body;

    // Validate status
    if (!["pending", "approved", "rejected"].includes(status)) {
      await trx.rollback();
      return res.status(400).json({
        success: false,
        data: null,
        message: "Invalid status",
        error: null,
      });
    }

    // Update request
    await RegistrationRequest.updateRequestStatus(
      trx,
      request_id,
      status,
      remark
    );
    await trx.commit();

    res.status(200).json({
      success: true,
      data: null,
      message: "Status updated successfully",
      error: null,
    });
  } catch (error) {
    console.log(error);
    
    await trx.rollback();
    res
      .status(500)
      .json({ success: false, data: null, message: "Server error", error });
  }
}
export async function loginBuyer(req, res) {
  const trx = await db.transaction();
  try {
    const { contact_number } = req.body;

    // Check if the buyer exists
    const buyer = await Buyer.getBuyerByContact(contact_number, false);
    if (!buyer) {
      await trx.rollback();
      return res.status(404).json({
        success: true,
        data: {
          registered: false,
        },
        message: "account not found. Please register to continue.",
        error: null,
      });
    }

    // Check if registration is approved
    const request = await trx("registration_requests")
      .where({ user_type: "buyer", user_id: buyer.id })
      .first();

    // if (!request || request.status !== "approved") {
    //   await trx.rollback();
    //   return res.status(403).json({
    //     success: false,
    //     data: null,
    //     message: "Registration not approved",
    //     error: null,
    //   });
    // }

    // Generate new JWT token
    const token = jwt.sign(
      { id: buyer.id, contact_number: buyer.contact_number },
      process.env.JWT_SECRET
    );
    // Store token in the buyer table
    await Buyer.updateBuyerToken(trx, buyer.id, token);

    await trx.commit();
    res.status(200).json({
      success: true,
      data: {
        ...buyer,
        token,
        ...{ request_status: request.status, registered: true },
      },
      message: "Login successful",
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
export async function getAllBuyers(req, res) {
  try {
    // Get pagination parameters from request query
    let { page, limit } = req.query;
    page = parseInt(page) || 1;
    limit = parseInt(limit) || 10;

    // Fetch data from the model
    const result = await Buyer.getAllBuyersWithRequests(page, limit);

    // Send response
    res.status(200).json({
      success: true,
      data: result.data,
      pagination: result.pagination,
      message: "Buyers fetched successfully",
      error: null,
    });
  } catch (error) {
    console.error("Error fetching buyers:", error);
    res.status(500).json({
      success: false,
      data: null,
      message: "Failed to fetch buyers",
      error: error.message,
    });
  }
}
export async function getAllBuyersRequest(req, res) {
  try {
    // Get pagination parameters from request query
    let { page, limit } = req.query;
    page = parseInt(page) || 1;
    limit = parseInt(limit) || 10;

    // Fetch data from the model
    const result = await RegistrationRequest.getBuyersWithRegistrationRequests(
      page,
      limit
    );

    // Send response
    res.status(200).json({
      success: true,
      data: result.data,
      pagination: result.pagination,
      message: "Buyers Request fetched successfully",
      error: null,
    });
  } catch (error) {
    console.error("Error fetching buyers:", error);
    res.status(500).json({
      success: false,
      data: null,
      message: "Failed to fetch buyers Request",
      error: error.message,
    });
  }
}

// 📌 Buyer Logout API
export async function logoutBuyer(req, res) {
  const trx = await db.transaction();
  try {
    const { buyer_id } = req.body;

    // Check if buyer exists
    const buyer = await trx("buyers").where({ id: buyer_id }).first();
    if (!buyer) {
      await trx.rollback();
      return res.status(404).json({
        success: false,
        data: null,
        message: "Buyer not found",
        error: "Buyer not found",
      });
    }

    // Remove JWT token from buyer table (invalidate session)
    await Buyer.updateBuyerToken(trx, buyer_id, null);

    await trx.commit();
    res.status(200).json({
      success: true,
      data: null,
      message: "Logout successful",
    });
  } catch (error) {
    await trx.rollback();
    res
      .status(500)
      .json({ success: false, data: null, message: "Server error", error });
  }
}
