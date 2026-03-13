const AppError = require("../utils/app-error");

const authorize = (...roles) => {
  return (req, res, next) => {
    const userRoles = req.user.roles || [];
    const hasRole = roles.some((role) => userRoles.includes(role));
    if (!hasRole) {
      throw new AppError("FORBIDDEN");
    }
    next();
  };
};

module.exports = { authorize };
