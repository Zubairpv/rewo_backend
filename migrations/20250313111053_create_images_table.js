export function up(knex) {
    return knex.schema.createTable("images", (table) => {
      table.increments("id").primary(); // Auto-increment ID
      table.string("image_name").notNullable();
      table.string("path").notNullable(); // Path to stored image
      table.string("media_type").notNullable(); // MIME type (image/png, image/jpg)
      table.integer("entity_id").unsigned().notNullable(); // ID of the associated entity
      table.string("entity_type").notNullable(); // Type of entity (material, user, product, etc.)
      table.timestamps(true, true); // created_at, updated_at
  
      // Indexing for better performance
      table.index(["entity_id", "entity_type"]);
    });
  }
  
  export function down(knex) {
    return knex.schema.dropTableIfExists("images");
  }
  