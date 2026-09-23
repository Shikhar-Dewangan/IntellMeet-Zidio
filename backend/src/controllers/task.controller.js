import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";
import Task from "../models/task.model.js";

// Create Task
const createTask = asyncHandler(async (req, res) => {
    // logic
});

// Get Tasks
const getTasks = asyncHandler(async (req, res) => {
    // logic
});

// Get Task By ID
const getTaskById = asyncHandler(async (req, res) => {
    // logic
});

// Update Task
const updateTask = asyncHandler(async (req, res) => {
    // logic
});

// Delete Task
const deleteTask = asyncHandler(async (req, res) => {
    // logic
});

// Assign Task
const assignTask = asyncHandler(async (req, res) => {
    // logic
});

// Update Task Status
const updateTaskStatus = asyncHandler(async (req, res) => {
    // logic
});

export {
    createTask,
    getTasks,
    getTaskById,
    updateTask,
    deleteTask,
    assignTask,
    updateTaskStatus
};