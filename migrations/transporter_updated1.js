export function up(knex) {
    return knex.schema.alterTable("transporters", (table) => {
        table.unique("contact_number"); // Add unique constraint
    });
}

export function down(knex) {
    return knex.schema.alterTable("transporters", (table) => {
        table.dropUnique("contact_number"); // Remove unique constraint if rolling back
    });
}
