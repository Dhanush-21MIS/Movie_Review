const User = require("../models/User");

const adminMiddleware = async (
  req,
  res,
  next
) => {
  try {
    // User must already be authenticated
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    // Always check the current role
    // directly from MongoDB.
    //
    // This prevents an old JWT from being
    // the only source of admin authorization.
    const user = await User.findById(
      req.user.id
    ).select(
      "name email role profilePhoto createdAt"
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Admin access required",
      });
    }

    // Store the database user
    // for admin controllers.
    req.admin = user;

    next();
  } catch (error) {
    console.error(
      "Admin authorization error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Server error while checking admin access",
    });
  }
};

module.exports = adminMiddleware;