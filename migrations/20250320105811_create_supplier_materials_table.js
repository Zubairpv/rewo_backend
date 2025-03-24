export function up(knex) {
  return knex.schema.createTable("supplier_materials", (table) => {
    table.increments("id").primary();
    table
      .integer("supplier_id")
      .unsigned()
      .notNullable()
      .references("id")
      .inTable("suppliers")
      .onDelete("CASCADE");
    table
      .integer("material_type_id")
      .unsigned()
      .notNullable()
      .references("id")
      .inTable("material_types")
      .onDelete("CASCADE");
    table.decimal("price", 10, 8).notNullable();
    table.unique(["supplier_id", "material_type_id"]); // Enforce uniqueness
  });
  
}

export function down(knex) {
  return knex.schema.dropTableIfExists("supplier_materials");
}
