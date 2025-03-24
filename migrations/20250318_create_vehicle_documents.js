export function up(knex) {
  return knex.schema.createTable("vehicle_documents", (table) => {
    table.increments("id").primary();
    table
      .integer("vehicle_id")
      .unsigned()
      .notNullable()
      .references("id")
      .inTable("vehicles")
      .onDelete("CASCADE");
    table
      .integer("image_id")
      .unsigned()
      .notNullable()
      .references("id")
      .inTable("images")
      .onDelete("CASCADE");
    table
      .enum("document_type", [
        "rc_image",
        "insurance_image",
        "driving_licence_image",
        "vehicle_video",
        "vehicle_front_image",
        "vehicle_back_image",
        "vehicle_left_image",
        "vehicle_right_image",
      ])
      .notNullable();
    table.timestamps(true, true);
  });
}

export function down(knex) {
  return knex.schema.dropTableIfExists("vehicle_documents");
}
