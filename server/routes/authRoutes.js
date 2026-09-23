const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const User = require("../models/User");
const authMiddleware = require("../middleware/AuthMiddleware");
const stockImages = require("../data/profileImages");

const router = express.Router();


// ======================================================
// HELPER: CREATE JWT
// ======================================================

const createToken = (user) => {
  return jwt.sign(
    {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "7d",
    }
  );
};


// ======================================================
// REGISTER
// ======================================================

router.post(
  "/register",
  async (req, res) => {
    try {
      const {
        name,
        email,
        password,
      } = req.body;


      if (
        !name ||
        !email ||
        !password
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Name, email and password are required",
        });
      }


      const cleanName =
        String(name).trim();

      const cleanEmail =
        String(email)
          .trim()
          .toLowerCase();


      if (
        cleanName.length < 2
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Name must contain at least 2 characters",
        });
      }


      if (
        password.length < 6
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Password must contain at least 6 characters",
        });
      }


      const existingUser =
        await User.findOne({
          email: cleanEmail,
        });


      if (existingUser) {
        return res.status(409).json({
          success: false,
          message:
            "An account with this email already exists",
        });
      }


      const hashedPassword =
        await bcrypt.hash(
          password,
          10
        );


      const randomIndex =
        Math.floor(
          Math.random() *
            stockImages.length
        );


      const profilePhoto =
        stockImages[randomIndex];


      const user =
        await User.create({
          name: cleanName,
          email: cleanEmail,
          password: hashedPassword,
          profilePhoto,
          role: "user",
        });


      return res.status(201).json({
        success: true,

        message:
          "Account created successfully",

        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          profilePhoto:
            user.profilePhoto,
          role: user.role,
          createdAt:
            user.createdAt,
        },
      });

    } catch (error) {

      console.error(
        "Register error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to create account",
      });
    }
  }
);


// ======================================================
// LOGIN
// ======================================================

router.post(
  "/login",
  async (req, res) => {
    try {

      const {
        email,
        password,
      } = req.body;


      if (
        !email ||
        !password
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Email and password are required",
        });
      }


      const cleanEmail =
        String(email)
          .trim()
          .toLowerCase();


      const user =
        await User.findOne({
          email: cleanEmail,
        });


      if (!user) {
        return res.status(401).json({
          success: false,
          message:
            "Invalid email or password",
        });
      }


      const passwordMatches =
        await bcrypt.compare(
          password,
          user.password
        );


      if (!passwordMatches) {
        return res.status(401).json({
          success: false,
          message:
            "Invalid email or password",
        });
      }


      if (!user.profilePhoto) {

        const randomIndex =
          Math.floor(
            Math.random() *
              stockImages.length
          );


        user.profilePhoto =
          stockImages[randomIndex];


        await user.save();
      }


      const token =
        createToken(user);


      return res.status(200).json({
        success: true,

        message:
          "Login successful",

        token,

        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          profilePhoto:
            user.profilePhoto,
          role: user.role,
          createdAt:
            user.createdAt,
        },
      });

    } catch (error) {

      console.error(
        "Login error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to login",
      });
    }
  }
);


// ======================================================
// GET CURRENT USER
// ======================================================

router.get(
  "/me",
  authMiddleware,
  async (req, res) => {

    console.log(
      "GET /api/auth/me"
    );

    console.log(
      "Authenticated user ID:",
      req.user?.id
    );

    try {

      const user =
        await User.findById(
          req.user.id
        ).select("-password");


      if (!user) {
        return res.status(404).json({
          success: false,
          message:
            "User not found",
        });
      }


      // ----------------------------------------------
      // Assign missing profile photo
      // ----------------------------------------------

      if (!user.profilePhoto) {

        const randomIndex =
          Math.floor(
            Math.random() *
              stockImages.length
          );


        user.profilePhoto =
          stockImages[randomIndex];


        await user.save();
      }


      // ----------------------------------------------
      // IMPORTANT:
      // success:true is required by Account.jsx
      // ----------------------------------------------

      return res.status(200).json({

        success: true,

        id:
          user._id,

        name:
          user.name,

        email:
          user.email,

        profilePhoto:
          user.profilePhoto,

        role:
          user.role,

        createdAt:
          user.createdAt,
      });

    } catch (error) {

      console.error(
        "Get current user error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to get user information",
      });
    }
  }
);


// ======================================================
// UPDATE PROFILE PHOTO
// ======================================================

router.put(
  "/profile-picture",
  authMiddleware,
  async (req, res) => {

    try {

      const {
        profilePhoto,
      } = req.body;


      if (!profilePhoto) {
        return res.status(400).json({
          success: false,
          message:
            "Profile photo is required",
        });
      }


      const isValidImage =
        stockImages.includes(
          profilePhoto
        );


      if (!isValidImage) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid profile photo",
        });
      }


      const user =
        await User.findById(
          req.user.id
        );


      if (!user) {
        return res.status(404).json({
          success: false,
          message:
            "User not found",
        });
      }


      user.profilePhoto =
        profilePhoto;


      await user.save();


      return res.status(200).json({

        success: true,

        message:
          "Profile photo updated successfully",

        user: {
          id:
            user._id,

          name:
            user.name,

          email:
            user.email,

          profilePhoto:
            user.profilePhoto,

          role:
            user.role,

          createdAt:
            user.createdAt,
        },
      });

    } catch (error) {

      console.error(
        "Update profile photo error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to update profile photo",
      });
    }
  }
);


// ======================================================
// LOGOUT
// ======================================================

router.post(
  "/logout",
  authMiddleware,
  async (req, res) => {

    return res.status(200).json({
      success: true,
      message:
        "Logout successful",
    });
  }
);


module.exports =
  router;