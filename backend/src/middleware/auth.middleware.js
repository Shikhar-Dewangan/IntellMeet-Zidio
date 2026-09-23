import asyncHandler from "../Utils/asyncHandler.js";
import jwt from "jsonwebtoken";
import ApiError from "../Utils/ApiError.js";
import User from "../Models/user.model.js";

export const verifyJWT = asyncHandler(async (req, res, next) => {
    try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "")

        if (!token) {
            throw new ApiError(401, "unauthorized access, token not found")
        }
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

        const user = await User.findById(decodedToken?._id).select("-password -refreshToken");

        if (!user) {
            throw new ApiError(404, "Invalid access token");
        }

        req.user = user;
        next();

    } catch (error) {
        throw new ApiError(401, error?.message || "unauthorized access, invalid token")
    }
})