import db from "../../config/db.js";

class Buyer {
    static async getBuyerByContact(identifier, needToken = false) {
        const baseSelect = [
          "t.id",
          "t.name",
          "t.contact_number",
          "t.company_name",
          "t.gst_number",
          "t.location_id",
          "l.latitude",
          "l.longitude",
          "l.address"
        ];
      
        if (needToken) {
          baseSelect.push("t.jwt_token");
        }
      
        const buyer = await db("buyers as t")
          .leftJoin("locations as l", "t.location_id", "l.id")
          .select(baseSelect)
          .where("t.contact_number", identifier)
          .orWhere("t.jwt_token", identifier)
          .orWhere("t.id", identifier)
          .first();
      
        return buyer;
      }
      
    
    static async getAllBuyersWithRequests(page = 1, limit = 10) {
      const offset = (page - 1) * limit;
  
      const query = db("buyers")
          .leftJoin("locations", "buyers.location_id", "locations.id")
          .leftJoin("registration_requests", function () {
              this.on("buyers.id", "=", "registration_requests.user_id")
                  .andOn("registration_requests.user_type", "=", db.raw("'buyer'"));
          })
          .select(
              "buyers.id",
              "buyers.name",
              "buyers.contact_number",
              "buyers.company_name",
              "buyers.gst_number",
              "buyers.location_id",
              "locations.latitude",
              "locations.longitude",
              "locations.address",
              "registration_requests.id as request_id",
              "registration_requests.status",
              "registration_requests.created_at"
          )
          .limit(limit)
          .offset(offset)
          .orderBy("buyers.id", "desc");
  
      // Get total count for pagination metadata
      const totalCountQuery = db("buyers")
          .count("* as total")
          .first();
  
      const [buyers, total] = await Promise.all([query, totalCountQuery]);
  
      return {
          data: buyers,
          pagination: {
              total: total.total,
              page,
              limit,
              totalPages: Math.ceil(total.total / limit),
          },
      };
  }
  
    static async createBuyer(trx, data) {
      return trx("buyers").insert(data);
    }
  
    static async updateBuyerToken(trx, id, token) {
      return trx("buyers").where({ id }).update({ jwt_token: token });
    }
  }
  
  export default Buyer;
  