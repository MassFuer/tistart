const { expressjwt: jwt } = require("express-jwt");

// Extract JWT token from HTTP-only cookie
function getTokenFromCookies(req) {
  if (req.cookies && req.cookies.authToken) {
    return req.cookies.authToken;
  }
  return null;
}

// Alternative: Also support Bearer token in Authorization header (for API clients)
function getTokenFromHeaders(req) {
  if (req.headers.authorization && req.headers.authorization.split(" ")[0] === "Bearer") {
    return req.headers.authorization.split(" ")[1];
  }
  return null;
}

// Combined token extraction: cookies first, then headers
function getToken(req) {
  return getTokenFromCookies(req) || getTokenFromHeaders(req);
}

// JWT authentication middleware
const isAuthenticated = jwt({
  secret: process.env.TOKEN_SECRET,
  algorithms: ["HS256"],
  requestProperty: "payload", // Decoded token available at req.payload
  getToken: getToken,
});

module.exports = {
  isAuthenticated,
};
