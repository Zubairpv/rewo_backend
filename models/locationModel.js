class Location {
  static async createLocation(trx, data) {
    return trx("locations").insert(data);
  }
  static async updateLocation(trx, reqId, locationData) {
    console.log("reqId",reqId);
    
    return trx("locations").where({ id: reqId }).update(locationData);
  }

  static async getLocationById(trx, id) {
    return trx("locations").where({ id }).first();
  }
}

export default Location;
