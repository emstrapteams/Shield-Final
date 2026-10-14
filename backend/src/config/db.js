
const mongoose = require("mongoose");

const connectDB = async () => {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  const uri = process.env.SHIELD_DB_URI;

  if (!uri) {
    throw new Error("SHIELD_DB_URI environment variable is missing.");
  }

  const connection = await mongoose.connect(uri);

  console.log("Shield MongoDB connected:", connection.connection.host);
  console.log("Shield Database:", connection.connection.name);

  return connection.connection;
};

module.exports = connectDB;
