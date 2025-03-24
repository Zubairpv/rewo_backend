export function up(knex) {
    return knex.schema.alterTable("transporters", (table) => {
        table.text("jwt_token").nullable(); // JWT token column (nullable initially)
    });
}

export function down(knex) {
    return knex.schema.alterTable("transporters", (table) => {
        table.dropColumn("jwt_token"); // Remove the column on rollback
    });
}
