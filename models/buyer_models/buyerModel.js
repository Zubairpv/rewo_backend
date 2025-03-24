import db from "../../config/db.js";

class Buyer {
    static async getBuyerByContact(contact_number, needToken) {
        const query = db("buyers")
            .leftJoin("locations", "buyers.location_id", "locations.id")
            .select(
                "buyers.id",
                "buyers.name",
                "buyers.contact_number",
                "buyers.company_name",
                "buyers.gst_number",
                "buyers.location_id",
                "locations.latitude",
                "locations.longitude",
                "locations.address"
            )
            .where("buyers.contact_number", contact_number)
            .first();
    
        if (needToken) {
            query.select("buyers.jwt_token");
        }
    
        return query;
    }
    
  
    static async createBuyer(trx, data) {
      return trx("buyers").insert(data);
    }
  
    static async updateBuyerToken(trx, id, token) {
      return trx("buyers").where({ id }).update({ jwt_token: token });
    }
  }
  
  export default Buyer;
  