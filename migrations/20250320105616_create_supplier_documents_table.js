export function up(knex) {
    return knex.schema.createTable("supplier_documents", (table) => {
        table.increments("id").primary();
        table.integer("supplier_id").unsigned().notNullable().references("id").inTable("suppliers").onDelete("CASCADE");
        table.integer("gst_certificate_id").unsigned().references("id").inTable("images").onDelete("SET NULL");
        table.integer("company_registration_id").unsigned().references("id").inTable("images").onDelete("SET NULL");
        table.timestamps(true, true);
    });
}

export function down(knex) {
    return knex.schema.dropTableIfExists("supplier_documents");
}
