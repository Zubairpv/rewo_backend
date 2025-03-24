import { hash } from "bcryptjs";

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function seed (knex) {
  const hashedPassword = await hash("abhi@123#456", 10);

  const existingUser = await knex("rewo_admin")
    .where({ user_name: "abhijith615@gmail.com" })
    .first();

  if (!existingUser) {
    await knex("rewo_admin").insert({
      user_name: "abhijith615@gmail.com",
      password: hashedPassword,
      name: "abhijith",
      active: true,
      created_by: "developer",
      created_at: new Date(),
      updated_at: new Date(),
    });
    console.log("✅ User inserted successfully.");
  } else {
    console.log("ℹ️ User already exists.");
  }
}
