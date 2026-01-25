/**
 * Generates n-grams (substrings) from a given text.
 * Used for optimizing substring search with MongoDB indexes.
 *
 * Example: "Paint" (min 3) -> ["pai", "ain", "int", "pain", "aint", "paint"]
 *
 * @param {string} text - The text to process
 * @param {number} minLength - Minimum length of n-grams (default: 3)
 * @returns {string[]} - Array of unique n-grams
 */
const generateNGrams = (text, minLength = 3) => {
  if (!text || typeof text !== "string") return [];

  // Normalize: lowercase and remove non-alphanumeric characters (except spaces)
  // We keep spaces to split by words, but we don't include spaces in ngrams typically
  const normalized = text.toLowerCase().trim();

  if (!normalized) return [];

  // Split into words to avoid generating n-grams across word boundaries (e.g. "red apple" -> "dap")
  // unless we want to support phrase search?
  // Requirement: "aint" finds "Paint".
  // Usually we don't want "dap" to find "red apple".
  const words = normalized.split(/[\s\-_.,;?!]+/);

  const ngrams = new Set();

  words.forEach((word) => {
    // Skip words shorter than minLength, but add the word itself if it's close?
    // Actually, if word is "hi", and minLength is 3, we can't search for it.
    // That's acceptable for n-gram search.
    if (word.length < minLength) {
      // Option: add the short word as is, so exact match works?
      // If I search "it", I might want to find "it".
      // But for performance, indexing 2-char strings is heavy (many matches).
      // Let's stick to strict minLength for substrings.
      // But maybe add the full word if it's small?
      // Let's just generate for length >= minLength.
      return;
    }

    for (let i = 0; i <= word.length - minLength; i++) {
      for (let j = i + minLength; j <= word.length; j++) {
        ngrams.add(word.slice(i, j));
      }
    }
  });

  return Array.from(ngrams);
};

module.exports = { generateNGrams };
