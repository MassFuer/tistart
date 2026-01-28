/**
 * Shared formatting utilities used across the application.
 */

/**
 * Format a number as a currency string.
 * @param {number} price - The price to format
 * @param {string} currency - The currency code (default: "EUR")
 * @returns {string} Formatted price string
 */
export const formatPrice = (price, currency = "EUR") => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(price);
};

/**
 * Get the display name for an artist.
 * Prefers companyName, falls back to firstName + lastName.
 * @param {object} artist - The artist/user object
 * @returns {string} Display name
 */
export const getArtistDisplayName = (artist) => {
  if (!artist) return "Unknown Artist";
  return (
    artist.artistInfo?.companyName ||
    `${artist.firstName || ""} ${artist.lastName || ""}`.trim() ||
    "Unknown Artist"
  );
};

/**
 * Format a date string for display.
 * @param {string|Date} date - The date to format
 * @param {object} options - Intl.DateTimeFormat options
 * @returns {string} Formatted date string
 */
export const formatDate = (date, options = {}) => {
  if (!date) return "";
  const defaults = {
    year: "numeric",
    month: "long",
    day: "numeric",
  };
  return new Date(date).toLocaleDateString("en-US", { ...defaults, ...options });
};