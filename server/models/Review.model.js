const mongoose = require("mongoose");
const { Schema, model } = mongoose;

const reviewSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User is required."],
    },
    artwork: {
      type: Schema.Types.ObjectId,
      ref: "Artwork",
      required: [true, "Artwork is required."],
    },
    title: {
      type: String,
      trim: true,
      maxlength: [100, "Title cannot exceed 100 characters."],
    },
    comment: {
      type: String,
      required: [true, "Comment is required."],
      trim: true,
      maxlength: [1000, "Comment cannot exceed 1000 characters."],
    },
    rating: {
      type: Number,
      required: [true, "Rating is required."],
      min: [1, "Rating must be at least 1."],
      max: [5, "Rating cannot exceed 5."],
    },
  },
  {
    timestamps: true,
  }
);

// Ensure one review per user per artwork
reviewSchema.index({ user: 1, artwork: 1 }, { unique: true });

// Index for efficient queries
reviewSchema.index({ artwork: 1 });
reviewSchema.index({ rating: -1 });

// Static method to calculate average rating for an artwork
reviewSchema.statics.calcAverageRating = async function (artworkId) {
  const stats = await this.aggregate([
    { $match: { artwork: artworkId } },
    {
      $group: {
        _id: "$artwork",
        numOfReviews: { $sum: 1 },
        averageRating: { $avg: "$rating" },
      },
    },
  ]);

  const Artwork = require("./Artwork.model");

  if (stats.length > 0) {
    await Artwork.findByIdAndUpdate(artworkId, {
      numOfReviews: stats[0].numOfReviews,
      averageRating: Math.round(stats[0].averageRating * 10) / 10, // Round to 1 decimal
    });
  } else {
    await Artwork.findByIdAndUpdate(artworkId, {
      numOfReviews: 0,
      averageRating: 0,
    });
  }
};

// Static method to calculate artist rating
reviewSchema.statics.calcArtistRating = async function (artistId) {
  const stats = await this.aggregate([
    {
      $lookup: {
        from: "artworks",
        localField: "artwork",
        foreignField: "_id",
        as: "artworkData",
      },
    },
    { $unwind: "$artworkData" },
    { $match: { "artworkData.artist": new mongoose.Types.ObjectId(artistId) } },
    {
      $group: {
        _id: null,
        avgRating: { $avg: "$rating" },
        count: { $sum: 1 },
      },
    },
  ]);

  const User = model("User");

  if (stats.length > 0) {
    await User.findByIdAndUpdate(artistId, {
      "stats.avgRating": Math.round(stats[0].avgRating * 10) / 10,
      "stats.reviewCount": stats[0].count,
    });
  } else {
    await User.findByIdAndUpdate(artistId, {
      "stats.avgRating": 0,
      "stats.reviewCount": 0,
    });
  }
};

// Helper to trigger artist update
async function updateArtistStats(reviewDoc) {
  try {
    const Artwork = model("Artwork");
    const artwork = await Artwork.findById(reviewDoc.artwork).select("artist");
    if (artwork && artwork.artist) {
      await reviewDoc.constructor.calcArtistRating(artwork.artist);
    }
  } catch (err) {
    console.error("Error updating artist stats from review:", err);
  }
}

// Update stats after saving a review
reviewSchema.post("save", async function (doc) {
  await this.constructor.calcAverageRating(this.artwork);
  await updateArtistStats(doc);
});

// Update stats after updating a review (rating change)
reviewSchema.post("findOneAndUpdate", async function (doc) {
  if (doc) {
    await doc.constructor.calcAverageRating(doc.artwork);
    await updateArtistStats(doc);
  }
});

// Update stats after removing a review
reviewSchema.post("findOneAndDelete", async function (doc) {
  if (doc) {
    await doc.constructor.calcAverageRating(doc.artwork);
    await updateArtistStats(doc);
  }
});

const Review = model("Review", reviewSchema);

module.exports = Review;
