import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";
import ActionItem from "../models/actionItem.model.js";

// Create Action Item
const createActionItem = asyncHandler(async (req, res) => {
    // logic
});

// Get Meeting Action Items
const getMeetingActionItems = asyncHandler(async (req, res) => {
    // logic
});

// Get My Action Items
const getMyActionItems = asyncHandler(async (req, res) => {
    // logic
});

// Update Action Item
const updateActionItem = asyncHandler(async (req, res) => {
    // logic
});

// Delete Action Item
const deleteActionItem = asyncHandler(async (req, res) => {
    // logic
});

// Assign Action Item
const assignActionItem = asyncHandler(async (req, res) => {
    // logic
});

// Update Action Item Status
const updateActionItemStatus = asyncHandler(async (req, res) => {
    // logic
});

export {
    createActionItem,
    getMeetingActionItems,
    getMyActionItems,
    updateActionItem,
    deleteActionItem,
    assignActionItem,
    updateActionItemStatus
};