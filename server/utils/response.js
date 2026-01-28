/**
 * Standard JSON response helpers.
 */

/**
 * Send a paginated list response.
 * @param {object} res - Express response
 * @param {Array} data - array of documents
 * @param {object} pagination - pagination metadata from buildPagination()
 * @param {number} [status=200]
 */
const sendList = (res, data, pagination, status = 200) => {
  res.status(status).json({ data, pagination });
};

/**
 * Send a single-item response.
 * @param {object} res - Express response
 * @param {object} data - document/object
 * @param {number} [status=200]
 */
const sendData = (res, data, status = 200) => {
  res.status(status).json({ data });
};

/**
 * Send a success message response.
 * @param {object} res - Express response
 * @param {string} message
 * @param {object} [data] - optional additional data
 * @param {number} [status=200]
 */
const sendMessage = (res, message, data = null, status = 200) => {
  const body = { message };
  if (data) body.data = data;
  res.status(status).json(body);
};

/**
 * Send an error response.
 * @param {object} res - Express response
 * @param {string} error - error message
 * @param {number} [status=400]
 */
const sendError = (res, error, status = 400) => {
  res.status(status).json({ error });
};

module.exports = { sendList, sendData, sendMessage, sendError };