const apiResponse = require('../utils/ApiResponse')

const responseHandler = (req, res, next) => {
  // Store original res.json function
  const originalJson = res.json;
  const originalStatus = res.status;
  let statusCode = 200;

  // Override status function
  res.status = function(code) {
      statusCode = code;
      return originalStatus.apply(res, arguments);
  };

  // Override json function
  res.json = function(data) {
      let response;

      // If data is already in apiResponse format, use it directly
      if (data instanceof apiResponse) {
          response = data;
      }
      // If it's an error response (status >= 400)
      else if (statusCode >= 400) {
          response = apiResponse.error(
              data.message || 'An error occurred',
              data.status_code || statusCode,
              data.data || null
          );
      }
      // If it's a success response
      else {
          response = apiResponse.success(
              data.message || 'Success',
              data.data || data,
              data.status_code || statusCode
          );
      }

      return originalJson.call(this, response);
  };

  next();
};

module.exports = { responseHandler };