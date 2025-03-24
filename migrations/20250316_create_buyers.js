export function up(knex) {
  return knex.schema.createTable("buyers", function (table) {
    table.increments("id").primary();
    table.string("name").notNullable();
    table.string("contact_number").notNullable().unique();
    table.string("company_name").notNullable();
    table.integer("location_id").unsigned().notNullable();
    table.string("gst_number").nullable();
    table.string("token").nullable(); // JWT token stored until logout
    table.timestamp("created_at").defaultTo(knex.fn.now());
    table.string("jwt_token").unique();
    // Foreign key reference to locations
    table
      .foreign("location_id")
      .references("id")
      .inTable("locations")
      .onDelete("CASCADE");
  });
}

export async function down(knex) {
  await knex.schema.dropTableIfExists("buyers");
}
