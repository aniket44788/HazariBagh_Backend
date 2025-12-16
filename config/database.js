import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const database = async () => {
  try {

    await mongoose.connect(process.env.DB_URL, {
    });

    console.log("✅ Database Connected Successfully!");

  } catch (error) {
    console.error("❌ Failed to connect Database:", error);
  }
};

export default database;
