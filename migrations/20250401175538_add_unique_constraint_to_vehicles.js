export function up(knex) {
    return knex.schema.alterTable("vehicles", (table) => {
        table.unique(["vehicle_number", "transporter_id"]);
    });
}

export function down(knex) {
    return knex.schema.alterTable("vehicles", (table) => {
        table.dropUnique(["vehicle_number", "transporter_id"]);
    });
}
