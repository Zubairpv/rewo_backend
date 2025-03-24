export function up(knex) {
    return knex.schema.createTable("supplier_bank_details", (table) => {
        table.increments("id").primary();
        table.integer("supplier_id").unsigned().notNullable().references("id").inTable("suppliers").onDelete("CASCADE");
        table.string("account_holder_name").notNullable();
        table.string("account_number").notNullable();
        table.string("bank_name").notNullable();
        table.string("ifsc_code").notNullable();
        table.string("branch_name").notNullable();
        table.timestamps(true, true);
    });
}

export function down(knex) {
    return knex.schema.dropTableIfExists("supplier_bank_details");
}
