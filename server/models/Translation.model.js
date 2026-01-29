const { Schema, model } = require("mongoose");

const translationSchema = new Schema(
  {
    language: {
      type: String,
      required: true,
      index: true, // e.g. 'en', 'fr'
    },
    namespace: {
      type: String,
      required: true,
      default: "translation", // standard i18next namespace
      index: true,
    },
    data: {
      type: Schema.Types.Mixed, // Use Mixed to allow nested objects or flat keys without dot-restriction issues if we use deep object
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for unique language+namespace
translationSchema.index({ language: 1, namespace: 1 }, { unique: true });

const Translation = model("Translation", translationSchema);

module.exports = Translation;
