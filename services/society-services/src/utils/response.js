// src/utils/response.js
function success(res, message = "Success", data = null, code = 200) {
  return res.status(code).json({
    status: true,
    message,
    data,
  });
}

function fail(res, message = "Something went wrong", code = 400) {
  return res.status(code).json({
    status: false,
    message,
    data: null,
  });
}

module.exports = { success, fail };
