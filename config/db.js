import knex from "knex";
import dotenv from "dotenv";

dotenv.config();

const db = knex({
  client: "mysql2",
  connection: {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 3306,
    ssl: { rejectUnauthorized: false }, // Accept self-signed certificates
  },
  pool: { min: 2, max: 10 }, // Helps manage connections efficiently
  acquireConnectionTimeout: 10000, // 10 seconds timeout to avoid ETIMEDOUT
});

export default db;
