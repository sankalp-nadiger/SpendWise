import User from "../models/user.model";
import asyncHandler from "../utils/asynchandler.utils.js";
import {ApiError} from "../utils/API_Error.js";
import ApiResponse from "../utils/API_Response.js";
import jwt from "jsonwebtoken";

const registerUser = asyncHandler(async (req, res) => {
    try {
      const { fullName, email, username, password, gender, mobile, faceDescriptor } = req.body;
  
      if ([fullName, email, username, password].some((field) => field?.trim() === "")) {
        return res.status(400).json({ success: false, message: "All fields are required" });
      }
  
      // Check if user exists
      const existedUser = await User.findOne({ $or: [{ username }, { email }] });
      if (existedUser) {
        return res.status(409).json({ success: false, message: "User with email or username already exists" });
      }
  
      // Create user
      const user = await User.create({
        name: fullName,
        email,
        password,
        gender,
        username: username.toLowerCase(),
        mobileNumber: mobile,
        faceDescriptor: faceDescriptor || [], // Store face descriptor if provided
      });
  
      console.log("User successfully created:", user);
      await user.assignRandomAvatar();
      await user.save();
  
      // Generate tokens
      const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id);
      console.log("Generated Tokens:", { accessToken, refreshToken });
  
      // Cookie options
      const options = {
        httpOnly: true,
        secure: false,
        sameSite: "lax",
      };
  
      // Send response
      return res
        .status(201)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json({
          success: true,
          message: "User registered successfully",
          data: {
            user: await User.findById(user._id).select("-password"),
            accessToken,
          },
        });
  
    } catch (error) {
      console.error("Error during registration:", error);
      return res.status(500).json({ success: false, message: "Internal Server Error", error: error.message });
    }
  });

  const generateAccessAndRefreshTokens = async (userId) => {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new ApiError(404, "User not found");
      }
  
      console.log("User found:", user); // Log user to verify it's fetched correctly
  
      const accessToken = user.generateAccessToken();
      const refreshToken = user.generateRefreshToken();
  
      console.log("Access token:", accessToken); // Log tokens for debugging
      console.log("Refresh token:", refreshToken);
  
      user.refreshToken = refreshToken; // Store the refresh token in the user document
      await user.save({ validateBeforeSave: false });
  
      return { accessToken, refreshToken };
    } catch (error) {
      console.error("Error generating tokens:", error); // Log the error for debugging
      throw new ApiError(
        500,
        "Something went wrong while generating refresh and access token"
      );
    }
  };

  const loginUser = asyncHandler(async (req, res) => {
    const { username, password, email, userType, faceDescriptor } = req.body; // Added faceDescriptor
    console.log("Request body:", req.body);

    if (!username && !email) {
        throw new ApiError(400, "Username or email is required");
    }

    let user;
    if (userType === "organization") {
        user = await OrgUser.findOne({ $or: [{ username }, { email }] });
    } else {
        user = await User.findOne({ $or: [{ username }, { email }] });
    }

    if (!user) {
        throw new ApiError(404, "User does not exist");
    }

    // If faceDescriptor is provided, use face-based authentication
    if (faceDescriptor && faceDescriptor.length > 0) {
        if (!user.faceDescriptor || user.faceDescriptor.length === 0) {
            throw new ApiError(401, "Face authentication not set up for this user");
        }

        const isFaceMatch = compareFaceDescriptors(user.faceDescriptor, faceDescriptor);
        if (!isFaceMatch) {
            throw new ApiError(401, "Face authentication failed");
        }
    } else {
        // Otherwise, use password authentication
        if (!password) {
            throw new ApiError(400, "Password or face authentication is required");
        }
        const isPasswordValid = await user.isPasswordCorrect(password);
        if (!isPasswordValid) {
            throw new ApiError(401, "Invalid user credentials");
        }
    }

    // Generate tokens
    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id);

    const loggedInUser = await (userType === "organization"
        ? OrgUser.findById(user._id).select("-password -refreshToken")
        : User.findById(user._id).select("-password -refreshToken"));

    const options = {
        httpOnly: true,
        secure: true,
    };

    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(200, {
                user: loggedInUser,
                accessToken,
                refreshToken,
            }, "User logged in successfully")
        );
});

export {registerUser, loginUser}