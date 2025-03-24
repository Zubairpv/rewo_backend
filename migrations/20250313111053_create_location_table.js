export function up (knex) {
    return knex.schema.createTable("locations", function (table) {
      table.increments("id").primary();
      table.decimal("latitude", 10, 8).notNullable();
      table.decimal("longitude", 11, 8).notNullable();
      table.string("address").notNullable();
      table.enu("type", ["buyer", "transporter", "supplier", "supplier_site", "site"]).notNullable();
      table.integer("entity_id").unsigned().notNullable();
      table.timestamp("created_at").defaultTo(knex.fn.now());
    });
  }
  
  export function down (knex) {
    return knex.schema.dropTable("locations");
  }
  