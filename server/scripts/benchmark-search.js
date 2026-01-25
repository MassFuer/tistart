const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const Artwork = require("../models/Artwork.model");
const User = require("../models/User.model");
const { faker } = require("@faker-js/faker");
const { generateNGrams } = require("../utils/ngram");

let mongod;

const connectDB = async () => {
  mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  await mongoose.connect(uri);
  console.log("Connected to in-memory MongoDB");
};

const closeDB = async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  await mongod.stop();
  console.log("Database connection closed");
};

const seedData = async (count = 5000) => {
  console.log(`Seeding ${count} artworks...`);

  // Need a dummy user
  const user = await User.create({
    firstName: "Test",
    lastName: "User",
    userName: "testuser",
    email: "test@example.com",
    password: "password",
    role: "artist",
  });

  const artworks = [];
  for (let i = 0; i < count; i++) {
    const title = faker.commerce.productName() + " " + faker.word.adjective();
    const description = faker.lorem.paragraph();
    const titleGrams = generateNGrams(title);
    const descGrams = generateNGrams(description);
    const searchKeywords = [...new Set([...titleGrams, ...descGrams])];

    artworks.push({
      title,
      description,
      artist: user._id,
      price: 100,
      category: "painting",
      isForSale: true,
      searchKeywords,
    });
  }

  await Artwork.insertMany(artworks);
  console.log("Seeding complete.");
};

const runQueries = async (label, queries) => {
  console.log(`\n--- ${label} ---`);
  const start = process.hrtime();

  for (const q of queries) {
    const searchTokens = q
      .toLowerCase()
      .trim()
      .split(/[\s\-_.,;?!]+/);
    const validTokens = searchTokens.filter((t) => t.length > 0);
    let filter = {};

    if (validTokens.length > 0) {
      const hasSmallTokens = validTokens.some((t) => t.length < 3);
      if (hasSmallTokens) {
        const searchRegex = new RegExp(q, "i");
        filter.$or = [{ title: searchRegex }, { description: searchRegex }];
      } else {
        filter.searchKeywords = { $all: validTokens };
      }
    } else {
      continue;
    }
    await Artwork.find(filter).select("_id");
  }

  const [seconds, nanoseconds] = process.hrtime(start);
  const totalTime = seconds * 1000 + nanoseconds / 1e6;
  console.log(`Total time: ${totalTime.toFixed(2)}ms`);
  console.log(`Avg time: ${(totalTime / queries.length).toFixed(2)}ms`);
};

const benchmark = async () => {
  await connectDB();
  await seedData(10000);

  const longQueries = ["Handmade", "Rustic", "Small", "Incredible"];
  const shortQueries = ["a", "e", "i", "o", "u"];

  await runQueries("Optimized Queries (Length >= 3)", longQueries);
  await runQueries("Fallback Queries (Length < 3)", shortQueries);

  await closeDB();
};

benchmark().catch((err) => {
  console.error(err);
  process.exit(1);
});
