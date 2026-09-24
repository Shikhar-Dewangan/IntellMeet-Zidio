import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";
import User from "../models/user.model.js";
import {uploadFileToCloudinary} from "../utils/FileUplode.js"


// Get Current User
const getCurrentUser = asyncHandler(async (req, res) => {

       const user = await User.findById(req.user._id).select(
        "-password -refreshToken"
    );

    if (!user) {
        throw new ApiError(
            404,
            "User not found"
        );
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                user,
                "Current user fetched successfully"
            )
        );
});

// Get User By ID
const getUserById = asyncHandler(async (req, res) => {
    
    const { userId } = req.params;

    if (!mongoose.isValidObjectId(userId)) {
        throw new ApiError(
            400,
            "Invalid user ID"
        );
    }

    const user = await User.findById(userId).select(
        "-password -refreshToken"
    );

    if (!user) {
        throw new ApiError(
            404,
            "User not found"
        );
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                user,
                "User fetched successfully"
            )
        );

});

// Update Profile
const updateProfile = asyncHandler(async (req, res) => {

     const { fullName } = req.body;

    if (fullName === undefined) {
        throw new ApiError(
            400,
            "Full name is required"
        );
    }

    const trimmedFullName = fullName.trim();

    if (!trimmedFullName) {
        throw new ApiError(
            400,
            "Full name cannot be empty"
        );
    }

    const updatedUser = await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                fullName: trimmedFullName,
            },
        },
        {
            new: true,
            runValidators: true,
        }
    ).select("-password -refreshToken");

    if (!updatedUser) {
        throw new ApiError(
            404,
            "User not found"
        );
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                updatedUser,
                "Profile updated successfully"
            )
        );

});

// Update Avatar
const updateAvatar = asyncHandler(async (req, res) => {
    
     const avatarLocalPath = req.file?.path;

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar is required");
    }

    const uploadedAvatar = await uploadFileToCloudinary(
        avatarLocalPath
    );

    if (!uploadedAvatar?.secure_url) {
        throw new ApiError(
            500,
            "Failed to upload avatar"
        );
    }

    const user = await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                avatar: uploadedAvatar.secure_url,
            },
        },
        {
            new: true,
        }
    ).select("-password -refreshToken");

    if (!user) {
        throw new ApiError(404, "User not found");
    }

    return res.status(200).json(
        new ApiResponse(
            200,
            user,
            "Avatar updated successfully"
        )
    );

});

// Update Phone
const updatePhone = asyncHandler(async (req, res) => {
    
    const { phone } = req.body;


    if (phone === undefined) {
        throw new ApiError(
            400,
            "Phone number is required"
        );
    }


    const trimmedPhone =
        phone.trim();


    if (!trimmedPhone) {
        throw new ApiError(
            400,
            "Phone number cannot be empty"
        );
    }


    const updatedUser =
        await User.findByIdAndUpdate(
            req.user._id,
            {
                $set: {
                    phone: trimmedPhone,
                },
            },
            {
                new: true,
                runValidators: true,
            }
        ).select("-password -refreshToken");


    if (!updatedUser) {
        throw new ApiError(
            404,
            "User not found"
        );
    }


    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                updatedUser,
                "Phone number updated successfully"
            )
        );

});

// Update Location
const updateLocation = asyncHandler(async (req, res) => {

     const { location } = req.body;


    if (location === undefined) {
        throw new ApiError(
            400,
            "Location is required"
        );
    }


    const trimmedLocation =
        location.trim();


    if (!trimmedLocation) {
        throw new ApiError(
            400,
            "Location cannot be empty"
        );
    }


    const updatedUser =
        await User.findByIdAndUpdate(
            req.user._id,
            {
                $set: {
                    location: trimmedLocation,
                },
            },
            {
                new: true,
                runValidators: true,
            }
        ).select("-password -refreshToken");


    if (!updatedUser) {
        throw new ApiError(
            404,
            "User not found"
        );
    }


    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                updatedUser,
                "Location updated successfully"
            )
        );  

});

export {
    getCurrentUser,
    getUserById,
    updateProfile,
    updateAvatar,
    updatePhone,
    updateLocation
};