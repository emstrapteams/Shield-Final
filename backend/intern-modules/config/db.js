const mongoose = require("mongoose");

/**
 * Connects to the dedicated Shield MongoDB database.
 * IMPORTANT: SHIELD_DB_URI must point ONLY to the Shield database.
 * Never reuse the existing EMSTRAP Emergency or Booking database.
 */
const connectDB = async () => {
  const uri = process.env.SHIELD_DB_URI;

  if (!uri) {
    console.error("Missing SHIELD_DB_URI in environment. Refusing to start.");
    process.exit(1);
  }

  try {
    const conn = await mongoose.connect(uri);
    console.log(
      `[Shield DB] Connected -> host: ${conn.connection.host}, database: ${conn.connection.name}`
    );
  } catch (err) {
    console.error(`[Shield DB] Connection error: ${err.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
