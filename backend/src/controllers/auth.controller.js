import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";
import User from "../models/user.model.js";
import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";
import crypto from "node:crypto";


const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    path: "/",
};

const generateAccessTokenAndRefreshToken = async (user) => {
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;

    await user.save({
        validateBeforeSave: false,
    });

    return {
        accessToken,
        refreshToken,
    };
};


// Register User
const registerUser = asyncHandler(async (req, res) => {
    const { fullName, phone, password, email } = req.body

    if (!fullName || !email || !password || !phone) {
        throw new ApiError(400, "Please provide all required fields");
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await User.findOne(
        {
            email: normalizedEmail
        });

    if (existingUser) {
        throw new ApiError(409, "User with this email already exists");
    }

    const user = await User.create({
        fullName : fullName.trim(),
        email: normalizedEmail,
        password,
        role: "member",
        phone,
        authProvider: "local",
    });

    const createdUser = await User.findById(user._id).select("-password -refreshToken");

    if (!createdUser) {
        throw new ApiError(500, "User creation failed");
    };

    return res
        .status(201)
        .json(new ApiResponse(201, "User registered successfully", createdUser));

});

// Login User
const loginUser = asyncHandler(async (req, res) => {

  const { email, password } = req.body;

  if (!email || !password) {
    throw new ApiError(400, "Please provide email and password");
  };

  const normalizedEmail = email.trim().toLowerCase();

  const user = await User.findOne(
    {
      email: normalizedEmail
    }.select("+password ")
  );

  if (!user) {
    throw new ApiError(401, "Invalid email or password");
  }

  if (!user.isActive) {
    throw new ApiError(403, "User account is inactive. Please contact support.");
  }

  if (user.isBlocked) {
    throw new ApiError(403, user.blockedReason || "User account is blocked. Please contact support.");
  }

  if (!user.password) {
    throw new ApiError(
      400,
      "This account does not have a password. Please use Google login."
    )
  };

  const isPasswordCorrecet = await user.IsPasswordCorrect(password);

  if (!isPasswordCorrecet) {
    throw new ApiError(401, "Invalid email or password")
  };

  const { accessToken, refreshToken } = await genrateAccessTokenAndRefreshToken(user);

  const userData = await User.findById(user._id).select("-password -refreshToken");

  return res
    .status(200)
    .cookie("refreshToken", refreshToken, cookieOptions)
    .cookie("accessToken", accessToken, cookieOptions)
    .json(new ApiResponse(200, "User logged in successfully", { user: userData, accessToken, refreshToken }));


});

// Refresh Access Token
const refreshAccessToken = asyncHandler(async (req, res) => {

    const incomingRefreshToken = req.cookies?.refreshToken || req.body?.refreshToken;

  if (!incomingRefreshToken) {
    throw new ApiError(401, "refresh token is missing. Please login again.");
  }

  try {

    const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET);

    const user = await User.findById(decodedToken?._id)

    if (!user) {
      throw new ApiError(401, "User not found. Please login again.");
    }

    if (user.refreshToken !== incomingRefreshToken) {
      throw new ApiError(401, "Refresh token does not match. Please login again.");
    }

    const { accessToken, refreshToken: newRefreshToken } = await genrateAccessTokenAndRefreshToken(user);

    return res
      .status(200)
      .json(new ApiResponse(200, { accessToken, refreshToken: newRefreshToken }, "Access token refreshed successfully"));

  } catch (error) {

    throw new ApiError(401, "Invalid refresh token. Please login again.");
  }
});

// Logout User
const logoutUser = asyncHandler(async (req, res) => {

   await User.findByIdAndUpdate(
    req.user._id,
    { $set: { refreshToken: null } },
    { new: true }
  );

  return res
    .clearCookie("refreshToken", cookieOptions)
    .clearCookie("accessToken", cookieOptions)
    .status(200)
    .json(new ApiResponse(200, "User logged out successfully", null));

});

// Google OAuth Login

// Forgot Password
const forgotPassword = asyncHandler(async (req, res) => {
    // logic
});

// Reset Password
const resetPassword = asyncHandler(async (req, res) => {
    // logic
});

const googleAuth = asyncHandler(async (req, res) => {
    const { idToken,} = req.body;

  if (!idToken) {
    throw new ApiError(400, "Google ID token is required");
  }

  // 2. Verify Google ID token

  let googlePayload;

  try {
    googlePayload = await verifyGoogleToken(idToken)
  } catch (error) {
    throw new ApiError(
      401,
      "Invalid or expired Google ID token"
    );
  }

  if (!googlePayload) {
    throw new ApiError(
      401,
      "Unable to verify Google account"
    );
  }

  // 3. Get verified Google information

  const {
    sub: googleId,
    email,
    email_verified: emailVerified,
    name,
    picture,
  } = googlePayload;

  if (!googleId || !email) {
    throw new ApiError(
      400,
      "Google account information is incomplete"
    );
  }

  if (!emailVerified) {
    throw new ApiError(
      401,
      "Google email is not verified"
    );
  }

  const normalizedEmail = email.trim().toLowerCase();

  // 4. Find user using Google ID
  let user = await User.findOne({ googleId });

  let isNewUser = false;

  if (!user) {
    user = await User.findOne({ email: normalizedEmail });

    if (user && user.authProvider !== "google") {
      throw new ApiError(
        409,
        "An account with this email already exists. Please use password login."
      );
    }
  }

  if (!user) {
    user = await User.create({
      fullName: name?.trim() || normalizedEmail.split("@")[0],
      email: normalizedEmail,
      googleId,
      role : "member",
      authProvider: "google",
      avatar: {
        url: picture || null,
        publicId: null,
      },
      isEmailVerified: true,
      isActive: true,
      lastLoginAt: new Date(),
    });

    isNewUser = true;
  }

  if (user) {
    if (user.isBlocked) {
      throw new ApiError(
        403,
        user.blockedReason || "Your account has been blocked"
      );
    }

    if (!user.isActive) {
      throw new ApiError(
        403,
        "Your account is inactive"
      );
    }

    // Never change existing role from frontend input.
    if (user.role !== role) {
      throw new ApiError(
        409,
        `This Google account is already registered as a ${user.role}`
      );
    }

    if (!user.googleId) {
      user.googleId = googleId;
      await user.save({ validateBeforeSave: false });
    }
  }

  user.lastLoginAt = new Date();

  const { accessToken, refreshToken } =
    await generateAccessTokenAndRefreshToken(user);
  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  return res
    .status(200)
    .cookie("accessToken", accessToken, cookieOptions)
    .cookie("refreshToken", refreshToken, cookieOptions)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          isNewUser,
          requiresOnboarding:
            user.role === "provider" &&
            !user.onboardingCompleted,
        },
        "Google login successful"
      )
    );
});


export {
    registerUser,
    loginUser,
    refreshAccessToken,
    logoutUser,
    googleAuth,
    forgotPassword,
    resetPassword
};