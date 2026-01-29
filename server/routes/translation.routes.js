const express = require("express");
const router = express.Router();
const Translation = require("../models/Translation.model");
const { isAuthenticated } = require("../middleware/jwt.middleware");
const { isAdmin } = require("../middleware/role.middleware");

// GET /api/translations/:language/:namespace
// Public route to fetch translations
router.get("/:language/:namespace", async (req, res, next) => {
  try {
    const { language, namespace } = req.params;
    const translation = await Translation.findOne({ language, namespace });

    if (!translation) {
      // Return empty object if not found, so i18next doesn't error out
      return res.status(200).json({});
    }

    res.status(200).json(translation.data);
  } catch (error) {
    next(error);
  }
});

// POST /api/translations
// Admin route to update/add translations
router.post("/", isAuthenticated, isAdmin, async (req, res, next) => {
  try {
    const { language, namespace, key, value } = req.body;

    if (!language || !key || value === undefined) {
      return res.status(400).json({ error: "Missing required fields: language, key, value" });
    }

    const ns = namespace || "translation";

    // Upsert the document
    const translation = await Translation.findOneAndUpdate(
      { language, namespace: ns },
      {
        $set: { [`data.${key}`]: value }
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    res.status(200).json({ message: "Translation updated", data: translation });
  } catch (error) {
    next(error);
  }
});

// POST /api/translations/batch
// Admin route to update multiple translations at once
router.post("/batch", isAuthenticated, isAdmin, async (req, res, next) => {
    try {
        const { language, namespace, data } = req.body; // data is { key: value, key2: value2 }

        if (!language || !data) {
            return res.status(400).json({ error: "Missing required fields: language, data" });
        }

        const ns = namespace || "translation";

        // Prepare update object
        const updateOps = {};
        for (const [key, value] of Object.entries(data)) {
            updateOps[`data.${key}`] = value;
        }

        const translation = await Translation.findOneAndUpdate(
            { language, namespace: ns },
            { $set: updateOps },
            { new: true, upsert: true, setDefaultsOnInsert: true }
        );

        res.status(200).json({ message: "Translations updated", data: translation });

    } catch (error) {
        next(error);
    }
});

module.exports = router;
