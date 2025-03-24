export function up(knex) {
    return knex.schema.createTable("worksites", (table) => {
      table.increments("id").primary();
      table.string("site_name").notNullable();
      table.string("customer_name").nullable();
      table.integer("location_id").unsigned().notNullable();
      table.text("detailed_address").nullable();
      table.text("hint_about_location").nullable();
      table.text("description").nullable();
      table.integer("buyer_id").unsigned().notNullable();
      table.timestamps(true, true);
  
      // Foreign keys
      table.foreign("location_id").references("id").inTable("locations").onDelete("CASCADE");
      table.foreign("buyer_id").references("id").inTable("buyers").onDelete("CASCADE");
    });
  }
  
  export function down(knex) {
    return knex.schema.dropTable("worksites");
  }
  