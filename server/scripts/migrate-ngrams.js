const mongoose = require("mongoose");
const Artwork = require("../models/Artwork.model");
require("../models/User.model"); // Register User model for populate
const { generateNGrams } = require("../utils/ngram");
require("dotenv").config();

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/nemesis";

const migrate = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB");

    const artworks = await Artwork.find({}).populate("artist", "firstName lastName artistInfo");
    console.log(`Found ${artworks.length} artworks to migrate.`);

    const operations = artworks.map((artwork) => {
      const titleGrams = generateNGrams(artwork.title || "");
      // Removed description from search as requested
      
      let artistGrams = [];
      let artistName = "";
      
      if (artwork.artist) {
        const firstName = artwork.artist.firstName || "";
        const lastName = artwork.artist.lastName || "";
        const companyName = artwork.artist.artistInfo?.companyName || "";
        
        artistName = `${firstName} ${lastName} ${companyName}`.trim();
        
        const firstNameGrams = generateNGrams(firstName);
        const lastNameGrams = generateNGrams(lastName);
        const companyGrams = generateNGrams(companyName);
        
        artistGrams = [...firstNameGrams, ...lastNameGrams, ...companyGrams];
      }

      const searchKeywords = [...new Set([...titleGrams, ...artistGrams])];
      const searchString = `${artwork.title || ""} ${artistName}`.toLowerCase();

      return {
        updateOne: {
          filter: { _id: artwork._id },
          update: { $set: { searchKeywords, searchString } },
        },
      };
    });

    if (operations.length > 0) {
      // Bulk write in batches of 500
      const batchSize = 500;
      for (let i = 0; i < operations.length; i += batchSize) {
        const batch = operations.slice(i, i + batchSize);
        await Artwork.bulkWrite(batch);
        console.log(`Processed ${i + batch.length} / ${operations.length}`);
      }
    }

    console.log("Migration complete.");
    await mongoose.disconnect();
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
};

migrate();
