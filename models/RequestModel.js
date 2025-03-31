import db from "../config/db.js";

class RegistrationRequest {
  static async createRequest(trx, { user_type, user_id, status = "pending", remark = null }) {
    return trx("registration_requests").insert({ user_type, user_id, status, remark });
  }

  static async getRequestByUser(trx, user_type, user_id) {
    return trx("registration_requests").where({ user_type, user_id }).first();
  }

  static async updateRequestStatus(trx, requestId, status, remark = null) {
    return trx("registration_requests").where({ id: requestId }).update({ status, remark });
  }
  static async getBuyersWithRegistrationRequests(page = 1, limit = 10) {
    const offset = (page - 1) * limit;

    const query = db("registration_requests")
        .join("buyers", "registration_requests.user_id", "buyers.id")
        .select(
            "registration_requests.id as request_id",
            "registration_requests.status",
            "registration_requests.remark",
            "registration_requests.created_at",
            "buyers.id as buyer_id",
            "buyers.name",
            "buyers.contact_number",
            "buyers.company_name"
        )
        .where("registration_requests.user_type", "buyer") // Filtering only buyers
        .limit(limit)
        .offset(offset)
        .orderBy("registration_requests.created_at", "desc");

    // Get total count for pagination metadata
    const totalCountQuery = db("registration_requests")
        .where("user_type", "buyer")
        .count("* as total")
        .first();

    const [requests, total] = await Promise.all([query, totalCountQuery]);

    return {
        data: requests,
        pagination: {
            total: total.total,
            page,
            limit,
            totalPages: Math.ceil(total.total / limit),
        },
    };
}

}

export default RegistrationRequest;
