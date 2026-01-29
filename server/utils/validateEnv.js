/**
 * Validate required environment variables on startup.
 * Call this before connecting to the database.
 */
const validateEnv = () => {
  const required = ["MONGODB_URI", "TOKEN_SECRET"];

  const optional = [
    "PORT",
    "NODE_ENV",
    "CLIENT_URL",
    "JWT_EXPIRES_IN",
    "RESEND_API_KEY",
    "EMAIL_FROM",
    "STRIPE_SECRET_KEY",
    "STRIPE_WEBHOOK_SECRET",
    "R2_ENDPOINT",
    "R2_ACCESS_KEY_ID",
    "R2_SECRET_ACCESS_KEY",
    "R2_BUCKET_NAME",
    "R2_PUBLIC_URL",
    "CLOUDINARY_CLOUD_NAME",
    "CLOUDINARY_API_KEY",
    "CLOUDINARY_API_SECRET",
  ];

  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    console.error(`\n[ENV] Missing required environment variables:\n  ${missing.join("\n  ")}\n`);
    process.exit(1);
  }

  const unset = optional.filter((key) => !process.env[key]);
  if (unset.length > 0) {
    console.warn(`[ENV] Optional variables not set: ${unset.join(", ")}`);
  }

  // Warn about insecure defaults
  if (process.env.TOKEN_SECRET && process.env.TOKEN_SECRET.length < 32) {
    console.warn("[ENV] TOKEN_SECRET should be at least 32 characters for security");
  }

  console.log("[ENV] Environment validation passed");
};

module.exports = { validateEnv };
