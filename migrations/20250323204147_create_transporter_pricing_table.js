export function up(knex) {
    return knex.schema.createTable("vehicle_pricing", (table) => {
      table.increments("id").primary();
      table.integer("vehicle_id").unsigned().notNullable();
      table.integer("from").unsigned().notNullable(); // Start range
      table.integer("to").unsigned().notNullable();   // End range
      table.decimal("price", 10, 2).notNullable();    // Price
  
      // Foreign key reference
      table.foreign("vehicle_id").references("id").inTable("vehicles").onDelete("CASCADE");
  
      table.timestamps(true, true);
    });
  }
  
  export function down(knex) {
    return knex.schema.dropTableIfExists("vehicle_pricing");
  }
  