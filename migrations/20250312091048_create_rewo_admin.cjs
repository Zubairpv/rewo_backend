/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
module.exports.up = function (knex) {
  return knex.schema.createTable("rewo_admin", (table) => {
    table.increments("id").primary();
    table.string("user_name").unique().notNullable();
    table.string("password").notNullable();
    table.string("name").notNullable();
    table.boolean("active").defaultTo(true);
    table.string("created_by").notNullable();
    table.timestamps(true, true);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
module.exports.down = function (knex) {
  return knex.schema.dropTable("rewo_admin");
};
