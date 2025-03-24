export function up(knex) {
    return knex.schema.createTable("vehicle_materials", (table) => {
        table.increments("id").primary();
        table.integer("material_id").unsigned().notNullable().references("id").inTable("materials").onDelete("CASCADE"); // Reference to existing materials table
        table.integer("vehicle_id").unsigned().notNullable().references("id").inTable("vehicles").onDelete("CASCADE"); // Reference to vehicles table
        table.unique(["material_id", "vehicle_id"]);

    });
}

export function down(knex) {
    return knex.schema.dropTableIfExists("vehicle_materials");
}
