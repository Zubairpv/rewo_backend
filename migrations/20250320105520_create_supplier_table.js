export function up(knex) {
  return knex.schema.createTable("suppliers", (table) => {
    table.increments("id").primary();
    table.string("name").notNullable();

    table.string("jwt_token").nullable().unique();
    table.string("contact_number").notNullable().unique();
    table.string("company_name").notNullable();
    table
      .integer("location_id")
      .unsigned()
      .references("id")
      .inTable("locations")
      .onDelete("CASCADE");
    table.string("gst_number").notNullable().unique();
    table.string("owner_name").notNullable();
    table.string("owner_contact_number").notNullable();
    table
      .enum("registration_status", [
        "pending",
        "supplier_uploaded",
        "materials_uploaded",
        "bank_details_uploaded",
        "documents_uploaded",
      ])
      .defaultTo("pending");
    table.timestamps(true, true);
  });
}

export function down(knex) {
  return knex.schema.dropTableIfExists("suppliers");
}
