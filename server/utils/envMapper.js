/**
 * Maps environment-specific variables to their primary names based on NODE_ENV.
 * This allows using a single .env file for multiple environments.
 */
const mapEnvVariables = () => {
  const env = process.env.NODE_ENV || "development";
  console.log(`[ENV] System initializing in '${env}' mode`);

  // Define prefix based on environment
  let prefix = "";
  if (env === "server") prefix = "SERVER_";
  else if (env === "production") prefix = "PROD_";
  else if (env === "development") prefix = "DEV_";

  if (!prefix) return;

  // List of variables that commonly change between environments
  const variablesToMap = [
    "MONGODB_URI",
    "CLIENT_URL",
    "PORT",
    "STRIPE_WEBHOOK_SECRET",
    "RESEND_API_KEY",
    "EMAIL_FROM",
  ];

  variablesToMap.forEach((v) => {
    const envSpecificKey = `${prefix}${v}`;
    if (process.env[envSpecificKey]) {
      console.log(`[ENV] Overriding ${v} with ${envSpecificKey} for ${env} mode`);
      process.env[v] = process.env[envSpecificKey];
    }
  });
};

module.exports = { mapEnvVariables };
