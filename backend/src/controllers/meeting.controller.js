import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";
import Meeting from "../models/meeting.model.js";

// Create Meeting
const createMeeting = asyncHandler(async (req, res) => {
    // logic
});

// Get Meeting By ID
const getMeetingById = asyncHandler(async (req, res) => {
    // logic
});

// Get My Meetings
const getMyMeetings = asyncHandler(async (req, res) => {
    // logic
});

// Update Meeting
const updateMeeting = asyncHandler(async (req, res) => {
    // logic
});

// Delete Meeting
const deleteMeeting = asyncHandler(async (req, res) => {
    // logic
});

// Join Meeting
const joinMeeting = asyncHandler(async (req, res) => {
    // logic
});

// Leave Meeting
const leaveMeeting = asyncHandler(async (req, res) => {
    // logic
});

export {
    createMeeting,
    getMeetingById,
    getMyMeetings,
    updateMeeting,
    deleteMeeting,
    joinMeeting,
    leaveMeeting
};