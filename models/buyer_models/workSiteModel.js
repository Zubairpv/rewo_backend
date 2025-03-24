class Worksite {
  static async createWorksite(trx, worksiteData) {
    return trx("worksites").insert(worksiteData);
  }

  static async updateWorksite(trx, id, worksiteData) {
    return trx("worksites").where({ id }).update(worksiteData);
  }

  static async deleteWorksite(trx, id) {
    return trx("worksites").where({ id }).del();
  }

  static async getWorksiteById(trx, id) {
    if (!id) {
      throw new Error("Worksite ID is required");
    }

    // Fetch worksite with location details
    const worksite = await trx("worksites")
      .select(
        "worksites.*",
        "locations.latitude",
        "locations.longitude",
        "locations.address"
      )
      .leftJoin("locations", "worksites.location_id", "locations.id")
      .where("worksites.id", id)
      .first();

    return worksite || null;
  }

  static async listWorksitesByBuyer(trx, buyer_id) {
    const worksites = await trx("worksites")
      .select(
        "worksites.*",
        "locations.latitude",
        "locations.longitude",
        "locations.address"
      )
      .leftJoin("locations", "worksites.location_id", "locations.id") // Join to fetch location data
      .where("worksites.buyer_id", buyer_id);

    return worksites.length > 0 ? worksites : null;
  }

  static async listAllWorksites(trx, page = 1, limit = 10) {
    const offset = (page - 1) * limit;

    return trx("worksites")
      .select(
        "worksites.*",
        "buyers.name as buyer_name",
        "locations.latitude",
        "locations.longitude",
        "locations.address"
      )
      .leftJoin("buyers", "worksites.buyer_id", "buyers.id") // Get buyer name
      .leftJoin("locations", "worksites.location_id", "locations.id") // Get location details
      .limit(limit)
      .offset(offset);
  }

  // 📌 Get total worksite count (for pagination)
  static async getWorksiteCount(trx) {
    const [{ count }] = await trx("worksites").count("id as count");
    return parseInt(count, 10);
  }
}

export default Worksite;
