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
}

export default RegistrationRequest;
