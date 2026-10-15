require("dotenv").config();

const mongoose = require("mongoose");
const connectDB = require("./src/config/db");
const User = require("./src/models/User");

const createSuperAdmin = async () => {
  try {
    await connectDB();
    if (mongoose.connection.name !== "shield_db") {
  throw new Error(
    `Wrong database: ${mongoose.connection.name}. Expected shield_db.`
  );
}

    const name = process.env.SUPER_ADMIN_NAME;
    const email = process.env.SUPER_ADMIN_EMAIL;
    const password = process.env.SUPER_ADMIN_PASSWORD;

    if (!name || !email || !password) {
      throw new Error(
        "SUPER_ADMIN_NAME, SUPER_ADMIN_EMAIL and SUPER_ADMIN_PASSWORD must be set."
      );
    }

    const existingAdmin = await User.findOne({
      role: "super_admin",
    });

    if (existingAdmin) {
      console.log("Super Admin already exists.");
      return;
    }

    const admin = await User.create({
      name,
      email,
      password,
      role: "super_admin",
      company: null,
      status: "active",
    });

    console.log("Super Admin created successfully.");
    console.log(`Email: ${admin.email}`);
  } catch (error) {
    console.error("Failed to create Super Admin:", error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
  }
};

createSuperAdmin();