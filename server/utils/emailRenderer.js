const Handlebars = require("handlebars");
const fs = require("fs");
const path = require("path");

// Email color system matching shadcn/ui design
const emailColors = {
  background: "#faf8f5",
  foreground: "#0a0a0a",
  card: "#ffffff",
  cardForeground: "#0a0a0a",
  primary: "#1a1a1a",
  primaryForeground: "#fafafa",
  secondary: "#f4f4f5",
  secondaryForeground: "#1a1a1a",
  muted: "#f4f4f5",
  mutedForeground: "#737373",
  border: "#e5e5e5",
  success: "#22c55e",
  successForeground: "#ffffff",
};

// Register partials from the partials directory
const partialsDir = path.join(__dirname, "../templates/emails/partials");
if (fs.existsSync(partialsDir)) {
  fs.readdirSync(partialsDir).forEach((file) => {
    if (file.endsWith(".hbs")) {
      const partialName = path.basename(file, ".hbs");
      const partialContent = fs.readFileSync(
        path.join(partialsDir, file),
        "utf8"
      );
      Handlebars.registerPartial(partialName, partialContent);
    }
  });
}

// Register helper functions
Handlebars.registerHelper("formatPrice", (price) => {
  if (typeof price !== "number") return "N/A";
  return new Intl.NumberFormat("en-EU", {
    style: "currency",
    currency: "EUR",
  }).format(price);
});

Handlebars.registerHelper("formatDate", (date) => {
  if (!date) return "N/A";
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
});

Handlebars.registerHelper("shortOrderId", (orderId) => {
  if (!orderId) return "N/A";
  return orderId.toString().slice(-6).toUpperCase();
});

Handlebars.registerHelper("currentYear", () => {
  return new Date().getFullYear();
});

// Make colors available to all templates
Handlebars.registerHelper("color", (colorName) => {
  return emailColors[colorName] || "#000000";
});

// Comparison helper for conditionals
Handlebars.registerHelper("eq", (a, b) => {
  return a === b;
});

// Template cache
const templateCache = new Map();

/**
 * Compile and cache a Handlebars template
 * @param {string} templateName - Name of the template file (without .hbs extension)
 * @returns {Function} Compiled template function
 */
const compileTemplate = (templateName) => {
  if (templateCache.has(templateName)) {
    return templateCache.get(templateName);
  }

  const templatePath = path.join(
    __dirname,
    `../templates/emails/${templateName}.hbs`
  );

  if (!fs.existsSync(templatePath)) {
    throw new Error(`Email template not found: ${templateName}`);
  }

  const templateContent = fs.readFileSync(templatePath, "utf8");
  const compiledTemplate = Handlebars.compile(templateContent);

  templateCache.set(templateName, compiledTemplate);
  return compiledTemplate;
};

/**
 * Render an email template with data
 * @param {string} templateName - Name of the template file (without .hbs extension)
 * @param {Object} data - Data to pass to the template
 * @returns {string} Rendered HTML string
 */
const renderTemplate = (templateName, data = {}) => {
  const template = compileTemplate(templateName);

  // Add colors and common data to all templates
  const templateData = {
    ...data,
    colors: emailColors,
    clientUrl: process.env.CLIENT_URL || "http://localhost:5173",
    currentYear: new Date().getFullYear(),
  };

  return template(templateData);
};

/**
 * Clear the template cache (useful for development)
 */
const clearCache = () => {
  templateCache.clear();
};

module.exports = {
  compileTemplate,
  renderTemplate,
  clearCache,
  emailColors,
  Handlebars,
};