import jwt from "jsonwebtoken";
import  User  from "../models/user.model.js";
import {ApiError } from "../utils/API_Error.js";
import asyncHandler from "../utils/asynchandler.utils.js";

export const verifyJWT = asyncHandler(async (req, res, next) => {
  try {
    const token =
      req.cookies?.accessToken ||
      req.header("Authorization")?.replace("Bearer ", "");
    if (!token) {
      return next(new ApiError(401, "Unauthorized: No token provided"));
    }

    let decodedToken;
    try {
      decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    } catch (error) {
      return next(new ApiError(401, "Invalid or expired access token"));
    }

    if (!decodedToken?._id) {
      return next(new ApiError(401, "Invalid token payload"));
    }

    const user = await User.findById(decodedToken._id).select(
      "-password -refreshToken"
    );

    if (!user) {
      return next(new ApiError(401, "User not found, invalid token"));
    }

    req.user = user;
    next();
  } catch (error) {
    next(new ApiError(500, "Server error while verifying token"));
  }
});
