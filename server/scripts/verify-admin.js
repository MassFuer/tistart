require("dotenv").config({ path: "../.env" });
const mongoose = require("mongoose");
const User = require("../models/User.model");
const bcryptjs = require("bcryptjs");

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/nemesis";

const verifyAdmin = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("📦 Connected to MongoDB");

    const email = "admin@nemesis.com";
    let user = await User.findOne({ email });

    if (!user) {
      console.log(`👤 User ${email} not found. Creating new admin...`);
      const salt = await bcryptjs.genSalt(12);
      const hashedPassword = await bcryptjs.hash("Admin123!", salt);
      
      user = await User.create({
        firstName: "Admin",
        lastName: "User",
        userName: "admin",
        email,
        password: hashedPassword,
        role: "admin",
        isEmailVerified: true,
      });
      console.log(`✅ Created admin user.`);
    } else {
      console.log(`👤 Found user ${email}. Updating status...`);
      user.isEmailVerified = true;
      user.role = "admin";
      await user.save();
      console.log(`✅ Updated ${email} to verified admin.`);
    }

  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await mongoose.connection.close();
    console.log("📦 Database connection closed");
    process.exit(0);
  }
};

verifyAdmin();
