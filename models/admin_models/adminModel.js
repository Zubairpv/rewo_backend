import db from "../../config/db.js"; // Adjust the path if needed
export const createAdmin = async (adminData) => {
  console.log(adminData);

  const [newAdminId] = await db("rewo_admin").insert({
    user_name: adminData.user_name,
    password: adminData.hashedPassword,
    name: adminData.name,
    active: adminData.active ?? true, // Default active to true
    created_by: adminData.created_by || "system",
  });
  console.log(newAdminId);
  
  const newAdmin = await db("rewo_admin")
    .where({ id: newAdminId })
    .select("id", "user_name", "name", "active", "created_by")
    .first();
  if (newAdmin) {
    newAdmin.active = Boolean(newAdmin.active); // Convert active to boolean
  }
  console.log(newAdmin);

  return newAdmin;
};
export const getAdminByUserName = async (user_name) => {
  const admin = await db("rewo_admin")
    .where({ user_name })
    .select("id", "user_name", "name", "active", "created_by", "password")
    .first();

  if (admin) {
    admin.active = Boolean(admin.active); // Convert active to boolean
  }

  return admin;
};
export const updateAdminPassword = async (user_name, hashedPassword) => {
  const result = await db("rewo_admin")
    .where({ user_name })
    .update({ password: hashedPassword });

  return result; // Returns 1 if successful, 0 if user not found
};
