require("dotenv").config();
const mongoose = require("mongoose");
const bcryptjs = require("bcryptjs");
const { faker } = require("@faker-js/faker");
const { generateNGrams } = require("../utils/ngram");

const User = require("../models/User.model");
const Artwork = require("../models/Artwork.model");
const Event = require("../models/Event.model");
const Review = require("../models/Review.model");

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/nemesis";

const artworkCategories = [
  "painting",
  "sculpture",
  "photography",
  "digital",
  "music",
  "video",
  "other",
];
const eventCategories = ["exhibition", "concert", "workshop", "meetup", "other"];
const colors = [
  "red",
  "blue",
  "green",
  "yellow",
  "orange",
  "purple",
  "black",
  "white",
  "gold",
  "silver",
];
const materials = [
  "oil",
  "acrylic",
  "watercolor",
  "canvas",
  "wood",
  "metal",
  "clay",
  "glass",
  "digital",
  "mixed media",
];

// Helper to pick random items from array
const pickRandom = (arr, count = 1) => {
  const shuffled = [...arr].sort(() => 0.5 - Math.random());
  return count === 1 ? shuffled[0] : shuffled.slice(0, count);
};

// Create users
const createUsers = async (count = 10) => {
  const users = [];
  const hashedPassword = await bcryptjs.hash("Password123", 12);

  for (let i = 0; i < count; i++) {
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();

    users.push({
      firstName,
      lastName,
      userName: faker.internet.username({ firstName, lastName }).toLowerCase(),
      email: faker.internet.email({ firstName, lastName }).toLowerCase(),
      password: hashedPassword,
      profilePicture: faker.image.avatar(),
      role: "user",
      artistStatus: "none",
      favorites: [],
    });
  }

  return User.insertMany(users);
};

// Create artists (verified)
const createArtists = async (count = 5) => {
  const artists = [];
  const hashedPassword = await bcryptjs.hash("Password123", 12);

  for (let i = 0; i < count; i++) {
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();

    artists.push({
      firstName,
      lastName,
      userName: faker.internet.username({ firstName, lastName }).toLowerCase(),
      email: faker.internet.email({ firstName, lastName }).toLowerCase(),
      password: hashedPassword,
      profilePicture: faker.image.avatar(),
      role: "artist",
      artistStatus: "verified",
      favorites: [],
      artistInfo: {
        companyName: faker.company.name(),
        tagline: faker.company.catchPhrase(),
        description: faker.lorem.paragraphs(2),
        type: pickRandom(["individual", "company"]),
        taxId: faker.string.alphanumeric(10).toUpperCase(),
        vatNumber: `EU${faker.string.numeric(9)}`,
        address: {
          street: faker.location.street(),
          streetNum: faker.location.buildingNumber(),
          zipCode: faker.location.zipCode(),
          city: faker.location.city(),
          country: faker.location.country(),
          location: {
            type: "Point",
            coordinates: [
              parseFloat(faker.location.longitude()),
              parseFloat(faker.location.latitude()),
            ],
          },
        },
        logo: faker.image.url(),
        socialMedia: {
          facebook: `https://facebook.com/${faker.internet.username()}`,
          instagram: `https://instagram.com/${faker.internet.username()}`,
          twitter: `https://twitter.com/${faker.internet.username()}`,
          website: faker.internet.url(),
        },
        policies: {
          returnDays: pickRandom([7, 14, 30]),
          freeShippingThreshold: pickRandom([0, 50, 100, 200]),
          taxRate: pickRandom([0, 5, 10, 20]),
        },
      },
    });
  }

  return User.insertMany(artists);
};

// Create admin user
const createAdmin = async () => {
  const hashedPassword = await bcryptjs.hash("Admin123!", 12);

  return User.create({
    firstName: "Admin",
    lastName: "User",
    userName: "admin",
    email: "admin@nemesis.com",
    password: hashedPassword,
    role: "admin",
    artistStatus: "none",
    isEmailVerified: true,
  });
};

// Create superadmin user
const createSuperAdmin = async () => {
  const hashedPassword = await bcryptjs.hash("SuperAdmin123!", 12);

  return User.create({
    firstName: "Super",
    lastName: "Admin",
    userName: "superadmin",
    email: "superadmin@nemesis.com",
    password: hashedPassword,
    role: "superAdmin",
    artistStatus: "none",
    isEmailVerified: true,
  });
};

// Create test user account (for testing paywall, purchases, etc.)
const createTestUser = async () => {
  const hashedPassword = await bcryptjs.hash("Test123!", 12);

  return User.create({
    firstName: "Test",
    lastName: "User",
    userName: "testuser",
    email: "user@test.com",
    password: hashedPassword,
    profilePicture: faker.image.avatar(),
    role: "user",
    artistStatus: "none",
    isEmailVerified: true,
    favorites: [],
  });
};

// Create pending artist account (for testing artist approval flow)
const createPendingArtist = async () => {
  const hashedPassword = await bcryptjs.hash("Test123!", 12);

  return User.create({
    firstName: "Pending",
    lastName: "Artist",
    userName: "pendingartist",
    email: "pending@test.com",
    password: hashedPassword,
    profilePicture: faker.image.avatar(),
    role: "artist",
    artistStatus: "pending",
    isEmailVerified: true,
    favorites: [],
    artistInfo: {
      companyName: "Pending Art Studio",
      tagline: "Awaiting approval",
      description: "This artist is awaiting admin approval.",
      type: "individual",
      address: {
        city: "Paris",
        country: "France",
        location: {
          type: "Point",
          coordinates: [2.3522, 48.8566], // Paris coordinates
        },
      },
    },
  });
};

// Create specific artist
const createSpecificArtist = async () => {
  const hashedPassword = await bcryptjs.hash("Password123", 12);

  return User.create({
    firstName: "Artist",
    lastName: "User",
    userName: "artist",
    email: "artist@nemesis.com",
    password: hashedPassword,
    profilePicture: faker.image.avatar(),
    role: "artist",
    artistStatus: "verified",
    isEmailVerified: true,
    artistInfo: {
      companyName: "Nemesis Studio",
      tagline: "Official Artist Account",
      description: "This is the official test artist account.",
      type: "company",
      taxId: "ART123456",
      vatNumber: "EU123456789",
      address: {
        street: "Art St",
        streetNum: "123",
        zipCode: "10000",
        city: "Berlin",
        country: "Germany",
        location: {
          type: "Point",
          coordinates: [13.405, 52.52], // Berlin coordinates
        },
      },
      logo: faker.image.url(),
      socialMedia: {
        instagram: "https://instagram.com/nemesis",
      },
    },
  });
};

// Create artworks
const createArtworks = async (artists, count = 30) => {
  const artworks = [];

  for (let i = 0; i < count; i++) {
    const artist = pickRandom(artists);
    const originalPrice = faker.number.int({ min: 100, max: 10000 });
    const hasDiscount = faker.datatype.boolean(0.3);

    const title = faker.lorem.words({ min: 2, max: 5 });
    const description = faker.lorem.paragraphs({ min: 1, max: 3 });
    const titleGrams = generateNGrams(title);
    const descGrams = generateNGrams(description);
    const searchKeywords = [...new Set([...titleGrams, ...descGrams])];

    artworks.push({
      title,
      description,
      artist: artist._id,
      originalPrice,
      price: hasDiscount ? Math.round(originalPrice * 0.8) : originalPrice,
      isForSale: faker.datatype.boolean(0.9),
      category: pickRandom(artworkCategories),
      materialsUsed: pickRandom(materials, faker.number.int({ min: 1, max: 3 })),
      colors: pickRandom(colors, faker.number.int({ min: 1, max: 4 })),
      dimensions: {
        width: faker.number.int({ min: 20, max: 200 }),
        height: faker.number.int({ min: 20, max: 200 }),
        depth: faker.number.int({ min: 1, max: 20 }),
        unit: "cm",
      },
      images: [faker.image.url(), faker.image.url()],
      totalInStock: faker.number.int({ min: 1, max: 5 }),
      averageRating: 0,
      numOfReviews: 0,
      searchKeywords,
    });
  }

  return Artwork.insertMany(artworks);
};

// Create events
const createEvents = async (artists, users, count = 20) => {
  const events = [];

  for (let i = 0; i < count; i++) {
    const artist = pickRandom(artists);
    const startDate = faker.date.future({ years: 1 });
    const endDate = new Date(startDate);
    endDate.setHours(endDate.getHours() + faker.number.int({ min: 2, max: 8 }));
    const isOnline = faker.datatype.boolean(0.3);

    // Pick random attendees
    const numAttendees = faker.number.int({ min: 0, max: 10 });
    const attendees = [];
    if (users.length > 0) {
      const shuffledUsers = [...users].sort(() => 0.5 - Math.random());
      attendees.push(
        ...shuffledUsers.slice(0, Math.min(numAttendees, users.length)).map((u) => u._id)
      );
    }

    // Build location object - always include valid coordinates for the 2dsphere index
    const locationData = {
      venue: isOnline ? "" : faker.company.name() + " Gallery",
      street: isOnline ? "" : faker.location.street(),
      streetNum: isOnline ? "" : faker.location.buildingNumber(),
      zipCode: isOnline ? "" : faker.location.zipCode(),
      city: faker.location.city(),
      country: faker.location.country(),
      isOnline,
      onlineUrl: isOnline ? faker.internet.url() : "",
      // Always provide valid coordinates to satisfy the 2dsphere index
      coordinates: {
        type: "Point",
        coordinates: [
          parseFloat(faker.location.longitude()),
          parseFloat(faker.location.latitude()),
        ],
      },
    };

    events.push({
      title: faker.lorem.words({ min: 3, max: 6 }),
      description: faker.lorem.paragraphs({ min: 1, max: 2 }),
      artist: artist._id,
      startDateTime: startDate,
      endDateTime: endDate,
      location: locationData,
      price: faker.datatype.boolean(0.4) ? 0 : faker.number.int({ min: 10, max: 100 }),
      maxCapacity: faker.number.int({ min: 20, max: 200 }),
      attendees,
      category: pickRandom(eventCategories),
      image: faker.image.url(),
      isPublic: true,
    });
  }

  return Event.insertMany(events);
};

// Create reviews
const createReviews = async (users, artworks, count = 50) => {
  const reviews = [];
  const usedPairs = new Set();

  for (let i = 0; i < count; i++) {
    const user = pickRandom(users);
    const artwork = pickRandom(artworks);
    const pairKey = `${user._id}-${artwork._id}`;

    // Skip if this user already reviewed this artwork
    if (usedPairs.has(pairKey)) continue;
    usedPairs.add(pairKey);

    reviews.push({
      user: user._id,
      artwork: artwork._id,
      title: faker.lorem.words({ min: 2, max: 5 }),
      comment: faker.lorem.paragraph(),
      rating: faker.number.int({ min: 3, max: 5 }),
      isVerified: faker.datatype.boolean(0.7),
    });
  }

  return Review.insertMany(reviews);
};

// Main seed function
const seed = async () => {
  try {
    console.log("🌱 Starting seed process...\n");

    // Connect to database
    await mongoose.connect(MONGODB_URI);
    console.log("📦 Connected to MongoDB");

    // Clear existing data
    console.log("🗑️  Clearing existing data...");
    await Promise.all([
      User.deleteMany({}),
      Artwork.deleteMany({}),
      Event.deleteMany({}),
      Review.deleteMany({}),
    ]);

    // Create data
    console.log("\n👤 Creating superadmin user...");
    const superAdmin = await createSuperAdmin();
    console.log(`   ✓ SuperAdmin: ${superAdmin.email}`);

    console.log("\n👤 Creating admin user...");
    const admin = await createAdmin();
    console.log(`   ✓ Admin: ${admin.email}`);

    console.log("\n👤 Creating test user...");
    const testUser = await createTestUser();
    console.log(`   ✓ Test User: ${testUser.email}`);

    console.log("\n👤 Creating pending artist...");
    const pendingArtist = await createPendingArtist();
    console.log(`   ✓ Pending Artist: ${pendingArtist.email}`);

    console.log("\n👥 Creating regular users...");
    const users = await createUsers(10);
    users.push(testUser); // Include test user in users array for reviews/events
    console.log(`   ✓ Created ${users.length} users (including test user)`);

    console.log("\n🎨 Creating verified artists...");
    const artists = await createArtists(5);
    console.log(`   ✓ Created ${artists.length} random artists`);

    console.log("\n🎨 Creating specific artist...");
    const specificArtist = await createSpecificArtist();
    artists.push(specificArtist);
    console.log(`   ✓ Artiste: ${specificArtist.email}`);

    console.log("\n🖼️  Creating artworks...");
    const artworks = await createArtworks(artists, 30);
    console.log(`   ✓ Created ${artworks.length} artworks`);

    console.log("\n📅 Creating events...");
    let events = [];
    try {
      events = await createEvents(artists, users, 20);
      console.log(`   ✓ Created ${events.length} events with attendees`);
    } catch (eventError) {
      console.error("   ❌ Error creating events:", eventError.message);
      if (eventError.errors) {
        Object.keys(eventError.errors).forEach((key) => {
          console.error(`      - ${key}: ${eventError.errors[key].message}`);
        });
      }
    }

    console.log("\n⭐ Creating reviews...");
    const allUsers = [...users, ...artists];
    const reviews = await createReviews(allUsers, artworks, 50);
    console.log(`   ✓ Created ${reviews.length} reviews`);

    // Summary
    console.log("\n" + "=".repeat(50));
    console.log("✅ Seed completed successfully!\n");
    console.log("📊 Summary:");
    console.log(`   - SuperAdmin: 1 (superadmin@nemesis.com / SuperAdmin123!)`);
    console.log(`   - Admin: 1 (admin@nemesis.com / Admin123!)`);
    console.log(`   - Test User: 1 (user@test.com / Test123!)`);
    console.log(`   - Pending Artist: 1 (pending@test.com / Test123!)`);
    console.log(`   - Verified Artist: 1 (artist@nemesis.com / Password123)`);
    console.log(`   - Random Users: ${users.length - 1} (password: Password123)`);
    console.log(`   - Random Artists: ${artists.length - 1} (password: Password123)`);
    console.log(`   - Artworks: ${artworks.length}`);
    console.log(`   - Events: ${events.length}`);
    console.log(`   - Reviews: ${reviews.length}`);
    console.log("=".repeat(50));
  } catch (error) {
    console.error("❌ Seed error:", error);
  } finally {
    await mongoose.connection.close();
    console.log("\n📦 Database connection closed");
    process.exit(0);
  }
};

// Run seed
seed();
