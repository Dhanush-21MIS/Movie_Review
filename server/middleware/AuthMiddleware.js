const jwt = require("jsonwebtoken");


// ======================================================
// AUTHENTICATION MIDDLEWARE
// ======================================================

const authMiddleware = (
  req,
  res,
  next
) => {
  try {

    // --------------------------------------------------
    // Check Authorization header
    // --------------------------------------------------

    const authHeader =
      req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message:
          "No authentication token provided",
      });
    }


    // --------------------------------------------------
    // Check Bearer format
    // --------------------------------------------------

    if (
      !authHeader.startsWith(
        "Bearer "
      )
    ) {
      return res.status(401).json({
        success: false,
        message:
          "Invalid authorization format",
      });
    }


    // --------------------------------------------------
    // Extract token
    // --------------------------------------------------

    const token =
      authHeader
        .substring(7)
        .trim();


    if (!token) {
      return res.status(401).json({
        success: false,
        message:
          "Authentication token missing",
      });
    }


    // --------------------------------------------------
    // Check JWT secret
    // --------------------------------------------------

    if (!process.env.JWT_SECRET) {
      console.error(
        "JWT_SECRET is missing from server/.env"
      );

      return res.status(500).json({
        success: false,
        message:
          "Server authentication configuration error",
      });
    }


    // --------------------------------------------------
    // Verify token
    // --------------------------------------------------

    const decoded =
      jwt.verify(
        token,
        process.env.JWT_SECRET
      );


    if (
      !decoded ||
      !decoded.id
    ) {
      return res.status(401).json({
        success: false,
        message:
          "Invalid authentication token",
      });
    }


    // --------------------------------------------------
    // Attach user to request
    // --------------------------------------------------

    req.user = decoded;


    console.log(
      "Authenticated user:",
      {
        id: decoded.id,
        email: decoded.email,
        role: decoded.role,
      }
    );


    next();

  } catch (error) {

    console.error(
      "Authentication error:",
      error.message
    );


    if (
      error.name ===
      "TokenExpiredError"
    ) {
      return res.status(401).json({
        success: false,
        message:
          "Authentication token has expired",
      });
    }


    if (
      error.name ===
      "JsonWebTokenError"
    ) {
      return res.status(401).json({
        success: false,
        message:
          "Invalid authentication token",
      });
    }


    return res.status(401).json({
      success: false,
      message:
        "Authentication failed",
    });
  }
};


module.exports =
  authMiddleware;