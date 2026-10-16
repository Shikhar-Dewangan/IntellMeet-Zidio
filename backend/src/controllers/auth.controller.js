import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";
import ApiError from "../utils/ApiError.js";
import dotenv from "dotenv";
import User from "../models/user.model.js";
import jwt from "jsonwebtoken";
import { verifyGoogleToken } from "../utils/googleAuth.js";

dotenv.config({ path: "./.env" });

const isProduction = process.env.NODE_ENV === "production";

const baseCookieOptions = {
  httpOnly: true,
    sameSite: "none",
    secure: process.env.NODE_ENV === "production",
    path: "/",
};

const accessCookieOptions = {
  ...baseCookieOptions,
  maxAge: 60 * 60 * 1000, // 1 hour
};

const refreshCookieOptions = {
  ...baseCookieOptions,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

const clearAuthCookies = (res) =>
  res
    .clearCookie("refreshToken", baseCookieOptions)
    .clearCookie("accessToken", baseCookieOptions);

const setAuthCookies = (res, accessToken, refreshToken) =>
  res
    .cookie("accessToken", accessToken, accessCookieOptions)
    .cookie("refreshToken", refreshToken, refreshCookieOptions);

const generateAccessTokenAndRefreshToken = async (user) => {
  const accessToken = user.generateAccessToken();
  const refreshToken = user.generateRefreshToken();

  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false });

  return { accessToken, refreshToken };
};

// Register User
const registerUser = asyncHandler(async (req, res) => {
  const { fullName, phone, password, email } = req.body;

  if (!fullName || !email || !password || !phone) {
    throw new ApiError(400, "Please provide all required fields");
  }

  const normalizedEmail = email.trim().toLowerCase();
  const normalizedPhone = phone.trim().replace(/[\s-]/g, "");

  if (!/^\+?[1-9]\d{7,14}$/.test(normalizedPhone)) {
    throw new ApiError(400, "Please provide a valid phone number");
  }

  const existingUser = await User.findOne({ email: normalizedEmail });

  if (existingUser) {
    throw new ApiError(409, "User with this email already exists");
  }

  const user = await User.create({
    fullName: fullName.trim(),
    email: normalizedEmail,
    password,
    role: "member",
    phone: normalizedPhone,
    authProvider: "local",
  });

  const { accessToken, refreshToken } =
    await generateAccessTokenAndRefreshToken(user);

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken",
  );

  if (!createdUser) {
    throw new ApiError(500, "User creation failed");
  }

  return res
    .status(201)
    .cookie("accessToken", accessToken, accessCookieOptions)
    .cookie("refreshToken", refreshToken, refreshCookieOptions)
    .json(
      new ApiResponse(
        201,
        { user: createdUser },
        "User registered successfully",
      ),
    );
});

// Login User
const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new ApiError(400, "Please provide email and password");
  }

  const normalizedEmail = email.trim().toLowerCase();

  const user = await User.findOne({ email: normalizedEmail }).select(
    "+password +refreshToken",
  );

  if (!user) {
    throw new ApiError(401, "Invalid email or password");
  }

  if (!user.isActive) {
    throw new ApiError(403, "User account is inactive. Please contact support.");
  }

  if (user.isBlocked) {
    throw new ApiError(
      403,
      user.blockedReason || "User account is blocked. Please contact support.",
    );
  }

  if (!user.password) {
    throw new ApiError(
      400,
      "This account does not have a password. Please use Google login.",
    );
  }

  const isPasswordCorrect = await user.isPasswordCorrect(password);

  if (!isPasswordCorrect) {
    throw new ApiError(401, "Invalid email or password");
  }

  const { accessToken, refreshToken } =
    await generateAccessTokenAndRefreshToken(user);

  const userData = await User.findById(user._id).select(
    "-password -refreshToken",
  );

  return res
    .status(200)
    .cookie("accessToken", accessToken, accessCookieOptions)
    .cookie("refreshToken", refreshToken, refreshCookieOptions)
    .json(
      new ApiResponse(
        200,
        { user: userData },
        "User logged in successfully",
      ),
    );
});

// Refresh Access Token
const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies?.refreshToken || req.body?.refreshToken;

  if (!incomingRefreshToken) {
    clearAuthCookies(res);
    throw new ApiError(401, "Refresh token is missing. Please login again.");
  }

  let decodedToken;

  try {
    decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET,
    );
  } catch {
    clearAuthCookies(res);
    throw new ApiError(401, "Refresh token is invalid or expired. Please login again.");
  }

  const user = await User.findById(decodedToken?._id).select("+refreshToken");

  if (!user || !user.isActive || !user.refreshToken) {
    clearAuthCookies(res);
    throw new ApiError(401, "Session is invalid. Please login again.");
  }

  if (user.refreshToken !== incomingRefreshToken) {
    clearAuthCookies(res);
    throw new ApiError(401, "Refresh token does not match the active session. Please login again.");
  }

  const { accessToken, refreshToken: newRefreshToken } =
    await generateAccessTokenAndRefreshToken(user);

  return res
    .status(200)
    .cookie("accessToken", accessToken, accessCookieOptions)
    .cookie("refreshToken", newRefreshToken, refreshCookieOptions)
    .json(
      new ApiResponse(
        200,
        { accessTokenRefreshed: true },
        "Access token refreshed successfully",
      ),
    );
});

// Logout User
const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    { $set: { refreshToken: null } },
    { new: true },
  );

  clearAuthCookies(res);

  return res
    .status(200)
    .json(new ApiResponse(200, null, "User logged out successfully"));
});

// Google OAuth Login
const googleAuth = asyncHandler(async (req, res) => {
  const { idToken } = req.body;

  if (!idToken) {
    throw new ApiError(400, "Google ID token is required");
  }

  let googlePayload;

  try {
    googlePayload = await verifyGoogleToken(idToken);
  } catch {
    throw new ApiError(401, "Invalid or expired Google ID token");
  }

  if (!googlePayload) {
    throw new ApiError(401, "Unable to verify Google account");
  }

  const {
    sub: googleId,
    email,
    email_verified: emailVerified,
    name,
    picture,
  } = googlePayload;

  if (!googleId || !email) {
    throw new ApiError(400, "Google account information is incomplete");
  }

  if (!emailVerified) {
    throw new ApiError(401, "Google email is not verified");
  }

  const normalizedEmail = email.trim().toLowerCase();

  let user = await User.findOne({ googleId });
  let isNewUser = false;

  if (!user) {
    user = await User.findOne({ email: normalizedEmail });

    if (user && user.authProvider !== "google") {
      throw new ApiError(
        409,
        "An account with this email already exists. Please use password login.",
      );
    }
  }

  if (!user) {
    user = await User.create({
      fullName: name?.trim() || normalizedEmail.split("@")[0],
      email: normalizedEmail,
      googleId,
      role: "member",
      authProvider: "google",
      avatar: picture || "",
      isActive: true,
    });

    isNewUser = true;
  } else {
    if (user.isBlocked) {
      throw new ApiError(
        403,
        user.blockedReason || "Your account has been blocked",
      );
    }

    if (!user.isActive) {
      throw new ApiError(403, "Your account is inactive");
    }

    if (!user.googleId) {
      user.googleId = googleId;
      await user.save({ validateBeforeSave: false });
    }
  }

  const { accessToken, refreshToken } =
    await generateAccessTokenAndRefreshToken(user);
  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken",
  );

  return res
    .status(200)
    .cookie("accessToken", accessToken, accessCookieOptions)
    .cookie("refreshToken", refreshToken, refreshCookieOptions)
    .json(
      new ApiResponse(
        200,
        { user: loggedInUser, isNewUser },
        "Google login successful",
      ),
    );
});

// Password recovery is not configured
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
