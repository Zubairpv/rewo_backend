export function up(knex) {
    return knex.schema.createTable("transporters", (table) => {
        table.increments("id").primary();
        table.string("name").notNullable();
        table.string("contact_number").notNullable();
        table.string("company_name").notNullable();
        table.integer("location_id").unsigned().notNullable().references("id").inTable("locations").onDelete("CASCADE");
        table.string("owner_name").notNullable();
        table.string("owner_contact").notNullable();
        table.enum("registration_status", ["pending","transporters_uploaded", "vehicle_uploaded", "vehicle_documents_uploaded"]).defaultTo("pending");
        table.timestamps(true, true);
    });
}

export function down(knex) {
    return knex.schema.dropTableIfExists("transporters");
}
