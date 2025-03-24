export function up(knex) {
    return knex.schema
      .createTable("types", (table) => {
        table.increments("id").primary();
        table.string("name").notNullable().unique();
      })
      .createTable("specialities", (table) => {
        table.increments("id").primary();
        table.string("name").notNullable().unique();
      })
      .createTable("concerns", (table) => {
        table.increments("id").primary();
        table.string("name").notNullable().unique();
      })
      .createTable("materials", (table) => {
        table.increments("id").primary();
        table.string("name").notNullable().unique();
        table.text("description").notNullable();
        table.string("measurement").notNullable(); // e.g., kg, ton
        table.timestamps(true, true);
      })
      .createTable("material_types", (table) => {
        table.increments("id").primary();
        table.integer("material_id").unsigned().notNullable();
        table.integer("type_id").unsigned().notNullable();
  
        table.foreign("material_id").references("id").inTable("materials").onDelete("CASCADE");
        table.foreign("type_id").references("id").inTable("types").onDelete("CASCADE");
      })
      .createTable("material_specialities", (table) => {
        table.increments("id").primary();
        table.integer("material_id").unsigned().notNullable();
        table.integer("speciality_id").unsigned().notNullable();
  
        table.foreign("material_id").references("id").inTable("materials").onDelete("CASCADE");
        table.foreign("speciality_id").references("id").inTable("specialities").onDelete("CASCADE");
      })
      .createTable("material_concerns", (table) => {
        table.increments("id").primary();
        table.integer("material_id").unsigned().notNullable();
        table.integer("concern_id").unsigned().notNullable();
  
        table.foreign("material_id").references("id").inTable("materials").onDelete("CASCADE");
        table.foreign("concern_id").references("id").inTable("concerns").onDelete("CASCADE");
      })
   
  }
  
  export function down(knex) {
    return knex.schema
      .dropTableIfExists("material_concerns")
      .dropTableIfExists("material_specialities")
      .dropTableIfExists("material_types")
      .dropTableIfExists("materials")
      .dropTableIfExists("concerns")
      .dropTableIfExists("specialities")
      .dropTableIfExists("types");
  }
  