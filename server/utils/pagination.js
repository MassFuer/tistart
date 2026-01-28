/**
 * Extract pagination parameters from request query.
 * @param {object} query - req.query
 * @param {object} [defaults] - optional overrides for default page/limit
 * @returns {{ page: number, limit: number, skip: number, sort: string }}
 */
const parsePagination = (query, defaults = {}) => {
  const page = Math.max(1, parseInt(query.page, 10) || defaults.page || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || defaults.limit || 12));
  const skip = (page - 1) * limit;
  const sort = query.sort || defaults.sort || "-createdAt";
  return { page, limit, skip, sort };
};

/**
 * Build a standard pagination metadata object.
 * @param {number} total - total document count
 * @param {number} page - current page
 * @param {number} limit - items per page
 * @returns {{ page: number, limit: number, total: number, pages: number }}
 */
const buildPagination = (total, page, limit) => ({
  page,
  limit,
  total,
  pages: Math.ceil(total / limit),
});

module.exports = { parsePagination, buildPagination };