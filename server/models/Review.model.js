const { Schema, model } = require("mongoose");

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
    isVerified: {
      type: Boolean,
      default: false, // True if user purchased the artwork
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

// Update artwork stats after saving a review
reviewSchema.post("save", async function () {
  await this.constructor.calcAverageRating(this.artwork);
});

// Update artwork stats after updating a review (rating change)
reviewSchema.post("findOneAndUpdate", async function (doc) {
  if (doc) {
    await doc.constructor.calcAverageRating(doc.artwork);
  }
});

// Update artwork stats after removing a review
reviewSchema.post("findOneAndDelete", async function (doc) {
  if (doc) {
    await doc.constructor.calcAverageRating(doc.artwork);
  }
});

const Review = model("Review", reviewSchema);

module.exports = Review;
