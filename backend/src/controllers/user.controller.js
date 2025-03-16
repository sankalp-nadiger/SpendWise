import User from "../models/user.model.js";
import OrganizationUser from "../models/orgUser.model.js";
import asyncHandler from "../utils/asynchandler.utils.js";
import {ApiError} from "../utils/API_Error.js";
import ApiResponse from "../utils/API_Response.js";
import jwt from "jsonwebtoken";

const registerUser = asyncHandler(async (req, res) => {
  try {
    const { 
      fullName, 
      email, 
      username, 
      password, 
      gender, 
      mobile, 
      profession,
      careerStage,
      usageType,
      faceDescriptor 
    } = req.body;

    // Check if required fields are present
    if ([fullName, email, username, password, gender, mobile, profession, careerStage, usageType]
      .some((field) => field?.trim() === "")) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }

    // Check if user exists
    const existedUser = await User.findOne({ 
      $or: [{ username }, { email }, { mobileNumber: mobile }] 
    });
    
    if (existedUser) {
      return res.status(409).json({ 
        success: false, 
        message: "User with email, username, or mobile number already exists" 
      });
    }

    // Create user
    const user = await User.create({
      name: fullName,
      email,
      username: username.toLowerCase(),
      password,
      gender,
      mobileNumber: mobile,
      profession,
      careerStage,
      usageType,
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
    return res.status(500).json({ 
      success: false, 
      message: "Internal Server Error", 
      error: error.message 
    });
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

  /**
 * Compares two face descriptors and determines if they match
 * 
 * @param {Array} storedDescriptor - The face descriptor stored in the database
 * @param {Array} loginDescriptor - The face descriptor provided during login
 * @param {Number} threshold - Similarity threshold (lower is more strict, default: 0.5)
 * @returns {Boolean} - True if faces match, false otherwise
 */
const compareFaceDescriptors = (storedDescriptor, loginDescriptor, threshold = 0.5) => {
  if (!storedDescriptor || !loginDescriptor) return false;
  if (storedDescriptor.length !== loginDescriptor.length) return false;
  
  // Calculate Euclidean distance between the descriptors
  let distance = 0;
  for (let i = 0; i < storedDescriptor.length; i++) {
    distance += Math.pow(storedDescriptor[i] - loginDescriptor[i], 2);
  }
  distance = Math.sqrt(distance);
  
  console.log(`Face similarity distance: ${distance}`);
  
  // Lower distance means more similar faces
  return distance < threshold;
};

const loginUser = asyncHandler(async (req, res) => {
  const { username, password, email, usageType, faceDescriptor } = req.body;
  console.log("Request body:", req.body);

  if (!username && !email) {
      throw new ApiError(400, "Username or email is required");
  }

  // Find the user
  const user = await User.findOne({ $or: [{ username }, { email }] });

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
      
      console.log("Face authentication successful for user:", user.username);
  } else {
      // Otherwise, use password authentication
      if (!password) {
          throw new ApiError(400, "Password or face authentication is required");
      }
      const isPasswordValid = await user.isPasswordCorrect(password);
      if (!isPasswordValid) {
          throw new ApiError(401, "Invalid user credentials");
      }
      
      console.log("Password authentication successful for user:", user.username);
  }

  // Generate tokens
  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id);

  // Get user data without sensitive information
  // Fixed the userType reference issue - using usageType from the request
  const loggedInUser = await User.findById(user._id).select("-password -refreshToken");

  const options = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // Only in production
      sameSite: "lax"
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

const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $unset: {
        refreshToken: 1, // this removes the field from document
      },
    },
    {
      new: true,
    },
  );

  const options = {
    httpOnly: true,
    //secure: true,
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged Out"));
});
const formatDate = (date) => {
  return new Date(date).toISOString().split("T")[0].split("-").reverse().join("-");
};
export const getUserProfile = asyncHandler(async (req, res) => {
  try {
    const userId = req.user._id; // Extracted from authentication middleware

    // Fetch user from database
    const user = await User.findById(userId).select("-password -faceDescriptor");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    let userData = {
      _id: user._id,
      name: user.name,
      email: user.email,
      username: user.username,
      gender: user.gender,
      mobileNumber: user.mobileNumber,
      profession: user.profession,
      careerStage: user.careerStage,
      usageType: user.usageType,
      createdAt: formatDate(user.createdAt), // Format date to DD-MM-YY
    };

    // If user belongs to an organization, fetch organization details
    if (user.usageType === "organization") {
      const orgMember = await OrganizationUser.findOne({ user: userId }).populate("organization");

      if (!orgMember) {
        return res.status(404).json({ message: "Organization user details not found" });
      }

      userData = {
        ...userData,
        organization: {
          name: orgMember.organization.name,
          role: orgMember.role,
          team: orgMember.team,
          joinedAt: formatDate(orgMember.joinedAt),
        },
      };
    }

    res.status(200).json({ success: true, user: userData });
  } catch (error) {
    console.error("Error fetching profile:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});
export {registerUser, logoutUser, loginUser}