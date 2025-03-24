export function up(knex) {
  return knex.schema.createTable("registration_requests", function (table) {
    table.increments("id").primary();
    table.enu("user_type", ["buyer", "supplier", "transporter"]).notNullable();
    table.integer("user_id").unsigned().notNullable();
    table
      .enu("status", ["pending", "approved", "rejected"])
      .defaultTo("pending");
    table.text("remark").nullable();
    table.timestamp("created_at").defaultTo(knex.fn.now());

    table.index(["user_id", "user_type"]);
  });
}

export function down(knex) {
  return knex.schema.dropTable("registration_requests");
}
