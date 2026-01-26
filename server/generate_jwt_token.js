const crypto = require("crypto");
const jwtSecret = crypto.randomBytes(32).toString("hex");
console.log(jwtSecret); // Outputs a 64-character hex string
