const mongoose = require("mongoose");

class Database {
  static async connect() {
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI is missing in .env");
    }

    await mongoose.connect(process.env.MONGO_URI);

    console.log("MongoDB Connected Successfully");
  }
}

module.exports = Database;