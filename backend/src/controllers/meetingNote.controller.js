import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";
import MeetingNote from "../models/meetingNote.model.js";

// Create Meeting Note
const createMeetingNote = asyncHandler(async (req, res) => {
    // logic
});

// Get Meeting Notes
const getMeetingNotes = asyncHandler(async (req, res) => {
    // logic
});

// Update Meeting Note
const updateMeetingNote = asyncHandler(async (req, res) => {
    // logic
});

// Delete Meeting Note
const deleteMeetingNote = asyncHandler(async (req, res) => {
    // logic
});

export {
    createMeetingNote,
    getMeetingNotes,
    updateMeetingNote,
    deleteMeetingNote
};