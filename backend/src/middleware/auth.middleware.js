import asyncHandler from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";
import ApiError from "../utils/ApiError.js";
import User from "../models/user.model.js";

const getAccessToken = (req) => {
  const cookieToken = req.cookies?.accessToken;
  if (typeof cookieToken === "string" && cookieToken.trim()) {
    return cookieToken.trim();
  }

  const authorization = req.get("authorization");
  if (typeof authorization === "string") {
    const match = authorization.match(/^Bearer\s+(.+)$/i);
    if (match?.[1]) return match[1].trim();
  }

  return null;
};

const authenticate = async (req, { optional = false } = {}) => {
  const token = getAccessToken(req);

  // Optional auth allows genuinely anonymous requests. A supplied but invalid
  // token is still rejected, rather than silently treated as anonymous.
  if (!token && optional) {
    req.user = null;
    return;
  }

  if (!token) {
    throw new ApiError(401, "Authentication required. Please log in.");
  }

  if (!process.env.ACCESS_TOKEN_SECRET) {
    throw new ApiError(500, "Authentication server configuration is incomplete");
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, {
      algorithms: ["HS256"],
    });
  } catch (error) {
    if (error?.name === "TokenExpiredError") {
      throw new ApiError(401, "Access token expired. Please refresh your session.");
    }
    throw new ApiError(401, "Invalid access token. Please log in again.");
  }

  if (!decoded?._id) {
    throw new ApiError(401, "Invalid access token payload");
  }

  const user = await User.findById(decoded._id).select("-password -refreshToken");
  if (!user || !user.isActive || user.isBlocked) {
    throw new ApiError(401, "User session is invalid or inactive");
  }

  req.user = user;
};

export const verifyJWT = asyncHandler(async (req, res, next) => {
  await authenticate(req);
  return next();
});

export const optionalJWT = asyncHandler(async (req, res, next) => {
  await authenticate(req, { optional: true });
  return next();
});
