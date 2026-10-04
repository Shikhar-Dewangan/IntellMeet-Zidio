import mongoose from "mongoose";

import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";

import Recording from "../models/recording.model.js";
import Meeting from "../models/meeting.model.js";

import {
    uploadRecordingToCloudinary,
    deleteRecordingFromCloudinary,
} from "../services/recording.service.js";

import {
    transcribeRecording,
} from "../services/transcription.service.js";

import {
    processMeetingAI,
} from "../services/aiInsight.service.js";

const isValidObjectId = (value) =>
    mongoose.Types.ObjectId.isValid(value);

const idString = (value) =>
    (value?._id || value)?.toString();

const parseOptionalDate = (
    value,
    fieldName
) => {
    if (
        value === undefined ||
        value === null ||
        value === ""
    ) {
        return undefined;
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        throw new ApiError(
            400,
            `Invalid ${fieldName}`
        );
    }

    return date;
};

const ensureMeetingAccess = async (
    user,
    meetingId
) => {
    if (
        !meetingId ||
        !isValidObjectId(meetingId)
    ) {
        throw new ApiError(
            400,
            "Invalid meeting id"
        );
    }

    const meeting =
        await Meeting.findById(meetingId);

    if (!meeting) {
        throw new ApiError(
            404,
            "Meeting not found"
        );
    }

    const isHost =
        meeting.host.toString() ===
        user._id.toString();

    const isParticipant =
        meeting.participants.some(
            (participantId) =>
                participantId.toString() ===
                user._id.toString()
        );

    const isAdmin =
        user.role === "admin";

    if (
        !isHost &&
        !isParticipant &&
        !isAdmin
    ) {
        throw new ApiError(
            403,
            "You are not authorized to access this meeting recording"
        );
    }

    return meeting;
};

// ----------------------------------------------------
// Create Recording
// ----------------------------------------------------

const createRecording = asyncHandler(
    async (req, res) => {
        const {
            meeting,
            title,
            description,
            duration,
            recordedAt,
        } = req.body;

        if (
            !meeting ||
            !isValidObjectId(meeting)
        ) {
            throw new ApiError(
                400,
                "Valid meeting id is required"
            );
        }

        const meetingDoc =
            await ensureMeetingAccess(
                req.user,
                meeting
            );

        /*
         * A recording can be uploaded while the
         * meeting is live or after it has completed.
         *
         * It cannot belong to a scheduled/cancelled
         * meeting.
         */
        if (
            meetingDoc.status ===
                "scheduled" ||
            meetingDoc.status ===
                "cancelled"
        ) {
            throw new ApiError(
                400,
                "Recording cannot be created for this meeting"
            );
        }

        if (
            !title ||
            typeof title !== "string" ||
            title.trim() === ""
        ) {
            throw new ApiError(
                400,
                "Recording title is required"
            );
        }

        let recordingUrl =
            req.body.recordingUrl || "";

        let publicId = "";

        /*
         * Upload browser recording to Cloudinary.
         */
        if (req.file) {
            const uploaded =
                await uploadRecordingToCloudinary(
                    req.file.path,
                    {
                        userId:
                            req.user._id.toString(),

                        meetingId:
                            meetingDoc._id.toString(),
                    }
                );

            recordingUrl =
                uploaded?.secure_url ||
                uploaded?.url ||
                recordingUrl;

            publicId =
                uploaded?.public_id ||
                "";
        }

        if (!recordingUrl) {
            throw new ApiError(
                400,
                "Recording file or recordingUrl is required"
            );
        }

        const parsedDuration =
            Number(duration);

        const finalDuration =
            Number.isFinite(
                parsedDuration
            ) &&
            parsedDuration >= 0
                ? parsedDuration
                : 0;

        const recording =
            await Recording.create({
                meeting:
                    meetingDoc._id,

                recordedBy:
                    req.user._id,

                title:
                    title.trim(),

                description:
                    description
                        ? description.trim()
                        : "",

                recordingUrl:
                    recordingUrl.trim(),

                publicId,

                duration:
                    finalDuration,

                recordedAt:
                    parseOptionalDate(
                        recordedAt,
                        "recordedAt"
                    ) || new Date(),
            });

        const populatedRecording =
            await Recording.findById(
                recording._id
            )
                .populate(
                    "meeting",
                    "title status scheduledAt"
                )
                .populate(
                    "recordedBy",
                    "fullName email avatar"
                );

        return res
            .status(201)
            .json(
                new ApiResponse(
                    201,
                    populatedRecording,
                    "Recording created successfully"
                )
            );
    }
);

// ----------------------------------------------------
// Process Recording
// ----------------------------------------------------

const processRecording = asyncHandler(
    async (req, res) => {
        const {
            recordingId,
        } = req.params;

        if (
            !isValidObjectId(
                recordingId
            )
        ) {
            throw new ApiError(
                400,
                "Invalid recording id"
            );
        }

        const recording =
            await Recording.findById(
                recordingId
            );

        if (!recording) {
            throw new ApiError(
                404,
                "Recording not found"
            );
        }

        /*
         * Only recorder or admin can
         * process recording.
         */
        if (
            req.user.role !== "admin" &&
            recording.recordedBy.toString() !==
                req.user._id.toString()
        ) {
            throw new ApiError(
                403,
                "You are not allowed to process this recording"
            );
        }

        const meeting =
            await ensureMeetingAccess(
                req.user,
                recording.meeting.toString()
            );

        if (
            meeting.status !==
            "completed"
        ) {
            throw new ApiError(
                409,
                "Recording can only be processed after the meeting has ended"
            );
        }

        /*
         * If transcription already exists,
         * do not call provider again.
         */
        const transcript =
            recording.transcription?.trim() ||
            await transcribeRecording(
                recording
            );

        if (!transcript) {
            throw new ApiError(
                502,
                "Recording transcription returned empty text"
            );
        }

        recording.transcription =
            transcript;

        /*
         * Recording is now processed.
         *
         * IMPORTANT:
         * We DO NOT generate AI insights here.
         *
         * AI generation belongs to the meeting
         * lifecycle and AIInsight service.
         */
        recording.processedAt =
            new Date();

        await recording.save();

        /*
         * The meeting may already have attempted AI
         * generation when it ended before this recording
         * finished transcribing.
         *
         * Calling processMeetingAI here acts only as a
         * fallback/retry path.
         *
         * It does NOT make recording mandatory.
         */
        void processMeetingAI(
            meeting._id
        ).catch((error) => {
            console.error(
                "Unable to refresh meeting AI after recording transcription:",
                error.message
            );
        });

        return res.status(200).json(
            new ApiResponse(
                200,
                {
                    recording:
                        await Recording.findById(
                            recording._id
                        ),

                    meeting: {
                        _id:
                            meeting._id,

                        status:
                            meeting.status,
                    },

                    transcript,
                },
                "Recording transcription completed successfully"
            )
        );
    }
);

// ----------------------------------------------------
// Get Recordings
// ----------------------------------------------------

const getRecordings = asyncHandler(
    async (req, res) => {
        /*
         * Each normal user sees only recordings
         * created by their own account.
         *
         * Admin can see all recordings.
         */
        const filter =
            req.user.role === "admin"
                ? {}
                : {
                      recordedBy:
                          req.user._id,
                  };

        const recordings =
            await Recording.find(
                filter
            )
                .populate(
                    "meeting",
                    "title status scheduledAt"
                )
                .populate(
                    "recordedBy",
                    "fullName email avatar"
                )
                .sort({
                    recordedAt: -1,
                });

        return res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    recordings,
                    "Recordings fetched successfully"
                )
            );
    }
);

// ----------------------------------------------------
// Get Recording By ID
// ----------------------------------------------------

const getRecordingById = asyncHandler(
    async (req, res) => {
        const {
            recordingId,
        } = req.params;

        if (
            !isValidObjectId(
                recordingId
            )
        ) {
            throw new ApiError(
                400,
                "Invalid recording id"
            );
        }

        const recording =
            await Recording.findById(
                recordingId
            )
                .populate(
                    "meeting",
                    "title status scheduledAt"
                )
                .populate(
                    "recordedBy",
                    "fullName email avatar"
                );

        if (!recording) {
            throw new ApiError(
                404,
                "Recording not found"
            );
        }

        if (
            req.user.role !== "admin" &&
            idString(
                recording.recordedBy
            ) !==
                req.user._id.toString()
        ) {
            throw new ApiError(
                403,
                "You are not allowed to access this recording"
            );
        }

        return res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    recording,
                    "Recording fetched successfully"
                )
            );
    }
);

// ----------------------------------------------------
// Update Recording
// ----------------------------------------------------

const updateRecording = asyncHandler(
    async (req, res) => {
        const {
            recordingId,
        } = req.params;

        const {
            title,
            description,
            duration,
            recordedAt,
            recordingUrl,
        } = req.body;

        if (
            !isValidObjectId(
                recordingId
            )
        ) {
            throw new ApiError(
                400,
                "Invalid recording id"
            );
        }

        const recording =
            await Recording.findById(
                recordingId
            );

        if (!recording) {
            throw new ApiError(
                404,
                "Recording not found"
            );
        }

        if (
            req.user.role !== "admin" &&
            recording.recordedBy.toString() !==
                req.user._id.toString()
        ) {
            throw new ApiError(
                403,
                "You are not allowed to update this recording"
            );
        }

        if (title !== undefined) {
            if (
                typeof title !==
                    "string" ||
                title.trim() === ""
            ) {
                throw new ApiError(
                    400,
                    "Recording title is required"
                );
            }

            recording.title =
                title.trim();
        }

        if (
            description !==
            undefined
        ) {
            recording.description =
                description
                    ? description.trim()
                    : "";
        }

        if (
            duration !==
            undefined
        ) {
            const parsed =
                Number(duration);

            if (
                !Number.isFinite(
                    parsed
                ) ||
                parsed < 0
            ) {
                throw new ApiError(
                    400,
                    "Invalid recording duration"
                );
            }

            recording.duration =
                parsed;
        }

        if (
            recordedAt !==
            undefined
        ) {
            recording.recordedAt =
                parseOptionalDate(
                    recordedAt,
                    "recordedAt"
                ) || new Date();
        }

        /*
         * Replace externally supplied recording URL.
         */
        if (
            recordingUrl !==
                undefined &&
            recordingUrl !== ""
        ) {
            const oldUrl =
                recording.recordingUrl;

            if (
                oldUrl &&
                oldUrl !==
                    recordingUrl &&
                recording.publicId
            ) {
                await deleteRecordingFromCloudinary(
                    recording.publicId,
                    recording.recordedBy.toString()
                );
            }

            recording.recordingUrl =
                recordingUrl.trim();

            recording.publicId =
                "";

            /*
             * Existing transcription belongs
             * to the old recording.
             *
             * Clear it so it cannot be reused
             * accidentally.
             */
            recording.transcription =
                "";

            recording.processedAt =
                null;
        }

        await recording.save();

        const updatedRecording =
            await Recording.findById(
                recording._id
            )
                .populate(
                    "meeting",
                    "title status scheduledAt"
                )
                .populate(
                    "recordedBy",
                    "fullName email avatar"
                );

        return res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    updatedRecording,
                    "Recording updated successfully"
                )
            );
    }
);

// ----------------------------------------------------
// Delete Recording
// ----------------------------------------------------

const deleteRecording = asyncHandler(
    async (req, res) => {
        const {
            recordingId,
        } = req.params;

        if (
            !isValidObjectId(
                recordingId
            )
        ) {
            throw new ApiError(
                400,
                "Invalid recording id"
            );
        }

        const recording =
            await Recording.findById(
                recordingId
            );

        if (!recording) {
            throw new ApiError(
                404,
                "Recording not found"
            );
        }

        if (
            req.user.role !== "admin" &&
            recording.recordedBy.toString() !==
                req.user._id.toString()
        ) {
            throw new ApiError(
                403,
                "You are not allowed to delete this recording"
            );
        }

        /*
         * Delete actual Cloudinary file.
         */
        if (recording.publicId) {
            await deleteRecordingFromCloudinary(
                recording.publicId,
                recording.recordedBy.toString()
            );
        }

        /*
         * Delete DB document.
         *
         * This does NOT delete the meeting
         * or AIInsight.
         */
        await recording.deleteOne();

        return res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    null,
                    "Recording deleted successfully"
                )
            );
    }
);

export {
    createRecording,
    processRecording,
    getRecordings,
    getRecordingById,
    updateRecording,
    deleteRecording,
};