const express = require("express");
const router = express.Router();

router.get("/", (req, res, next) => {
  // #swagger.tags = ['Health']
  res.json("All good in here");
});

module.exports = router;
