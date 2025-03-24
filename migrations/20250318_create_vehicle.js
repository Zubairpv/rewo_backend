export function up(knex) {
    return knex.schema.createTable("vehicles", (table) => {
        table.increments("id").primary();
        table.integer("transporter_id").unsigned().notNullable().references("id").inTable("transporters").onDelete("CASCADE");
        table.string("vehicle_number").notNullable();
        table.string("manufacturer").notNullable();
        table.string("model").notNullable();
        table.decimal("load_capacity_volume", 10, 2).notNullable();
        table.decimal("load_capacity_weight", 10, 2).notNullable();
        table.timestamps(true, true);
    });
}

export function down(knex) {
    return knex.schema.dropTableIfExists("vehicles");
}
