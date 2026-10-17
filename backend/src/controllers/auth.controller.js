import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";
import ApiError from "../utils/ApiError.js";
import dotenv from "dotenv";
import User from "../models/user.model.js";
import jwt from "jsonwebtoken";
import { verifyGoogleToken } from "../utils/googleAuth.js";

dotenv.config({ path: "./.env" });

const isProduction = process.env.NODE_ENV === "production";
const ACCESS_TOKEN_TTL_MS = 60 * 60 * 1000;
const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;

// Production frontend and API usually have different sites, so cross-site
// cookies require SameSite=None; Secure. Local development uses Lax over HTTP.
const baseCookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? "none" : "lax",
  path: "/",
};

const accessCookieOptions = {
  ...baseCookieOptions,
  maxAge: ACCESS_TOKEN_TTL_MS,
};

const refreshCookieOptions = {
  ...baseCookieOptions,
  maxAge: REFRESH_TOKEN_TTL_MS,
};

const clearAuthCookies = (res) => {
  // Keep the same path/security/sameSite attributes used when setting cookies.
  res.clearCookie("accessToken", baseCookieOptions);
  res.clearCookie("refreshToken", baseCookieOptions);
};

const setAuthCookies = (res, accessToken, refreshToken) => {
  res.cookie("accessToken", accessToken, accessCookieOptions);
  res.cookie("refreshToken", refreshToken, refreshCookieOptions);
};

const assertAuthSecrets = () => {
  if (!process.env.ACCESS_TOKEN_SECRET || !process.env.REFRESH_TOKEN_SECRET) {
    throw new ApiError(500, "Authentication server configuration is incomplete");
  }
};

const issueTokens = async (user) => {
  assertAuthSecrets();

  const accessToken = user.generateAccessToken();
  const refreshToken = user.generateRefreshToken();

  // This app currently stores one active refresh token per user/session.
  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false });

  return { accessToken, refreshToken };
};

const publicUserById = async (userId) =>
  User.findById(userId).select("-password -refreshToken");

// Register
const registerUser = asyncHandler(async (req, res) => {
  const { fullName, phone, password, email } = req.body ?? {};

  if (
    typeof fullName !== "string" ||
    typeof email !== "string" ||
    typeof password !== "string" ||
    typeof phone !== "string" ||
    !fullName.trim() ||
    !email.trim() ||
    !password ||
    !phone.trim()
  ) {
    throw new ApiError(400, "Please provide all required fields");
  }

  if (password.length < 8) {
    throw new ApiError(400, "Password must be at least 8 characters long");
  }

  const normalizedEmail = email.trim().toLowerCase();
  const normalizedPhone = phone.trim().replace(/[\s-]/g, "");

  if (!/^\+?[1-9]\d{7,14}$/.test(normalizedPhone)) {
    throw new ApiError(400, "Please provide a valid phone number");
  }

  const existingUser = await User.findOne({
    $or: [{ email: normalizedEmail }, { phone: normalizedPhone }],
  }).select("_id email phone");

  if (existingUser) {
    if (existingUser.email === normalizedEmail) {
      throw new ApiError(409, "User with this email already exists");
    }
    throw new ApiError(409, "User with this phone number already exists");
  }

  let user;
  try {
    user = await User.create({
      fullName: fullName.trim(),
      email: normalizedEmail,
      password,
      role: "member",
      phone: normalizedPhone,
      authProvider: "local",
    });
  } catch (error) {
    // Handle unique-index races without leaking database internals.
    if (error?.code === 11000) {
      throw new ApiError(409, "An account with these details already exists");
    }
    throw error;
  }

  const { accessToken, refreshToken } = await issueTokens(user);
  const createdUser = await publicUserById(user._id);

  if (!createdUser) {
    throw new ApiError(500, "User registration could not be completed");
  }

  setAuthCookies(res, accessToken, refreshToken);
  return res.status(201).json(
    new ApiResponse(201, { user: createdUser }, "User registered successfully"),
  );
});

// Login
const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body ?? {};

  if (typeof email !== "string" || typeof password !== "string" || !email.trim() || !password) {
    throw new ApiError(400, "Please provide email and password");
  }

  const normalizedEmail = email.trim().toLowerCase();
  const user = await User.findOne({ email: normalizedEmail }).select("+password +refreshToken");

  // Same message for unknown email and incorrect password.
  if (!user || !user.password) {
    throw new ApiError(401, "Invalid email or password");
  }

  if (user.isBlocked) {
    throw new ApiError(403, user.blockedReason || "User account is blocked");
  }
  if (!user.isActive) {
    throw new ApiError(403, "User account is inactive. Please contact support.");
  }

  const passwordIsValid = await user.isPasswordCorrect(password);
  if (!passwordIsValid) {
    throw new ApiError(401, "Invalid email or password");
  }

  const { accessToken, refreshToken } = await issueTokens(user);
  const userData = await publicUserById(user._id);

  setAuthCookies(res, accessToken, refreshToken);
  return res.status(200).json(
    new ApiResponse(200, { user: userData }, "User logged in successfully"),
  );
});

// Refresh: verify signature/expiry, verify active DB session, rotate token.
const refreshAccessToken = asyncHandler(async (req, res) => {
  assertAuthSecrets();

  const incomingRefreshToken = req.cookies?.refreshToken;
  if (!incomingRefreshToken || typeof incomingRefreshToken !== "string") {
    clearAuthCookies(res);
    throw new ApiError(401, "Refresh token is missing. Please log in again.");
  }

  let decodedToken;
  try {
    decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET);
  } catch {
    clearAuthCookies(res);
    throw new ApiError(401, "Refresh token is invalid or expired. Please log in again.");
  }

  if (!decodedToken?._id) {
    clearAuthCookies(res);
    throw new ApiError(401, "Refresh token payload is invalid. Please log in again.");
  }

  const user = await User.findById(decodedToken._id).select("+refreshToken");
  if (!user || !user.isActive || user.isBlocked || !user.refreshToken) {
    clearAuthCookies(res);
    throw new ApiError(401, "Session is invalid. Please log in again.");
  }

  if (user.refreshToken !== incomingRefreshToken) {
    clearAuthCookies(res);
    throw new ApiError(401, "Refresh token does not match the active session. Please log in again.");
  }

  const { accessToken, refreshToken } = await issueTokens(user);
  setAuthCookies(res, accessToken, refreshToken);

  return res.status(200).json(
    new ApiResponse(200, { accessTokenRefreshed: true }, "Access token refreshed successfully"),
  );
});

// Logout. Route should be protected by verifyJWT.
const logoutUser = asyncHandler(async (req, res) => {
  if (!req.user?._id) {
    throw new ApiError(401, "Authentication is required to log out");
  }

  await User.findByIdAndUpdate(
    req.user._id,
    { $set: { refreshToken: null } },
    { runValidators: false },
  );

  clearAuthCookies(res);
  return res.status(200).json(new ApiResponse(200, null, "User logged out successfully"));
});

// Google OAuth login
const googleAuth = asyncHandler(async (req, res) => {
  const { idToken } = req.body ?? {};
  if (typeof idToken !== "string" || !idToken) {
    throw new ApiError(400, "Google ID token is required");
  }

  let googlePayload;
  try {
    googlePayload = await verifyGoogleToken(idToken);
  } catch {
    throw new ApiError(401, "Invalid or expired Google ID token");
  }

  const googleId = googlePayload?.sub;
  const normalizedEmail = googlePayload?.email?.trim().toLowerCase();
  if (!googleId || !normalizedEmail) {
    throw new ApiError(401, "Google account information is incomplete");
  }
  if (googlePayload.email_verified !== true) {
    throw new ApiError(401, "Google email is not verified");
  }

  let user = await User.findOne({ googleId }).select("+refreshToken");
  let isNewUser = false;

  if (!user) {
    const emailUser = await User.findOne({ email: normalizedEmail }).select("+refreshToken");
    if (emailUser && emailUser.authProvider !== "google") {
      throw new ApiError(409, "An account with this email already exists. Please use password login.");
    }
    user = emailUser;
  }

  if (!user) {
    try {
      user = await User.create({
        fullName: googlePayload.name?.trim() || normalizedEmail.split("@")[0],
        email: normalizedEmail,
        googleId,
        role: "member",
        authProvider: "google",
        avatar: googlePayload.picture || "",
        isActive: true,
      });
      isNewUser = true;
    } catch (error) {
      if (error?.code === 11000) {
        throw new ApiError(409, "An account with this Google email already exists. Please sign in again.");
      }
      throw error;
    }
  } else {
    if (user.isBlocked) {
      throw new ApiError(403, user.blockedReason || "Your account has been blocked");
    }
    if (!user.isActive) {
      throw new ApiError(403, "Your account is inactive");
    }
    if (!user.googleId) {
      user.googleId = googleId;
    }
    if (googlePayload.picture && !user.avatar) {
      user.avatar = googlePayload.picture;
    }
    await user.save({ validateBeforeSave: false });
  }

  const { accessToken, refreshToken } = await issueTokens(user);
  const loggedInUser = await publicUserById(user._id);
  setAuthCookies(res, accessToken, refreshToken);

  return res.status(200).json(
    new ApiResponse(200, { user: loggedInUser, isNewUser }, "Google login successful"),
  );
});

const forgotPassword = asyncHandler(async () => {
  throw new ApiError(501, "Password recovery is not configured");
});

const resetPassword = asyncHandler(async () => {
  throw new ApiError(501, "Password recovery is not configured");
});

export {
  registerUser,
  loginUser,
  refreshAccessToken,
  logoutUser,
  googleAuth,
  forgotPassword,
  resetPassword,
};
