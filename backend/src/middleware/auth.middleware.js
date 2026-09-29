import asyncHandler from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";
import ApiError from "../utils/ApiError.js";
import User from "../models/user.model.js";

export const verifyJWT = asyncHandler(async (req, res, next) => {
    let decodedToken;

    try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "")

        if (!token) {
            throw new ApiError(401, "unauthorized access, token not found")
        }
        decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    } catch (error) {
        throw new ApiError(401, error?.message || "unauthorized access, invalid token")
    }

    const user = await User.findById(decodedToken?._id).select("-password -refreshToken");

    if (!user || !user.isActive) {
        throw new ApiError(401, "Invalid or inactive user session");
    }

    req.user = user;
    next();
})