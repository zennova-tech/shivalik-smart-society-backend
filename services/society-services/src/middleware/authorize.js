// src/middleware/authorize.js
module.exports = function (allowed = []) {
  return (req, res, next) => {
    // if (!req.user) return res.status(401).json({ status: false, message: "Auth required" });
    // if (!allowed.includes(req.user.role))
    //   return res.status(403).json({ status: false, message: "Forbidden" });
    next();
  };
};
