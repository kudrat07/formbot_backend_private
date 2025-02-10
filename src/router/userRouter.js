const express = require("express");
const bcrypt = require("bcrypt");
const JWT = require("jsonwebtoken");
const User = require("../models/user.schema");
const userAuth = require("../middlewares/userAuth");
require("dotenv").config();
const userRouter = express.Router();

userRouter.post("/signup", async (req, res) => {
  try {
    const { name, email, password, confirmPassword } = req.body;

    if (!name || !email || !password || !confirmPassword) {
      return res.status(400).json({
        message: "All fields are required",
        status: "400",
      });
    }

    const isUserExists = await User.findOne({ email });
    if (isUserExists) {
      return res.status(400).json({
        message: "Email already taken",
        status: "400",
      });
    }

    if (name.length < 4) {
      return res.status(400).json({
        message: "Username is too short. It must be at least 4 characters.",
        status: "400",
      });
    }
    if (name.length > 20) {
      return res.status(400).json({
        message: "Username is too long. It must not exceed 20 characters.",
        status: "400",
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        message: "Invalid email format",
        status: "400",
      });
    }

    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({
        message:
          "Password must be at least 8 characters long, include at least one uppercase letter, one lowercase letter, one number, and one special character.",
        status: "400",
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        message: "enter same password in both fields",
        status: "400",
      });
    }

    const hashPassword = await bcrypt.hash(password, 10);

    const user = new User({
      name,
      email,
      password: hashPassword,
    });

    const token = JWT.sign({ email }, process.env.SECRET, {});

    await user.save();

    return res.status(200).json({
      message: "Sign up successfully",
      status: "200",
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
      token,
    });
  } catch (error) {
    return res.status(500).json({
      message: "An error occurred during signup",
      status: "500",
      error: error.message,
    });
  }
});

userRouter.post("/signin", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      throw new Error("invalid email or password");
    }
    const isValidPassword = await bcrypt.compare(password, user.password);
    
    if (!isValidPassword) {
      throw new Error("invalid email or password");
    }
    const token = JWT.sign({ email }, process.env.SECRET);
    return res.json({ message: "Logged in successfully", user, token });
  } catch (error) {
    return res.status(400).json({ message: error.message, status: "400" });
  }
});

userRouter.post("/user/update", userAuth, async (req, res) => {
  try {
    const userId = req.user._id;
    const { name, email, oldPassword, newPassword } = req.body;

    if (!name && !email && !oldPassword && !newPassword) {
      return res.status(400).json({
        message: "Please provide at least one field to update.",
        status: "400",
      });
    }
    if ((oldPassword && !newPassword) || (!oldPassword && newPassword)) {
      return res.status(400).json({
        message: "Both old password and new password are required.",
        status: "400",
      });
    }
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        message: "User not found.",
        status: "404",
      });
    }

    if (name) {
      if (name.length < 4 || name.length > 20) {
        return res.status(400).json({
          message: "Name must be between 4 and 20 characters.",
          status: "400",
        });
      }
      user.name = name;
    }

    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          message: "Invalid email format.",
          status: "400",
        });
      }

      const isEmailTaken = await User.findOne({ email });
      if (isEmailTaken && isEmailTaken._id.toString() !== userId) {
        return res.status(400).json({
          message: "Email already in use.",
          status: "400",
        });
      }

      user.email = email;
    }

    if (oldPassword && newPassword) {
      const isPasswordCorrect = await bcrypt.compare(
        oldPassword,
        user.password
      );
      if (!isPasswordCorrect) {
        return res.status(400).json({
          message: "Incorrect previous password.",
          status: "400",
        });
      }

      const passwordRegex =
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
      if (!passwordRegex.test(newPassword)) {
        return res.status(400).json({
          message:
            "Password must be at least 8 characters long, include at least one uppercase letter, one lowercase letter, one number, and one special character.",
          status: "400",
        });
      }
      const hashPassword = await bcrypt.hash(newPassword, 10);

      user.password = hashPassword
    }

    await user.save();

    const newToken = JWT.sign({ email: user.email }, process.env.SECRET);

    return res.status(200).json({
      message: "Your data updated successfully.",
      status: "200",
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
      token: newToken,
    });
  } catch (error) {
    return res.status(500).json({
      message: "An error occurred while updating user data.",
      status: "500",
      error: error.message,
    });
  }
});

module.exports = userRouter;
