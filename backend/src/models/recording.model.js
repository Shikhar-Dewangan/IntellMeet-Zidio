import mongoose from "mongoose";

const recordingSchema = new mongoose.Schema(
    {
        meeting: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Meeting",
            required: true,
        },
        recordedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        title: {
            type: String,
            required: true,
            trim: true,
            minlength: 2,
            maxlength: 200,
        },
        description: {
            type: String,
            trim: true,
            default: "",
            maxlength: 1000,
        },
        recordingUrl: {
            type: String,
            required: true,
            trim: true,
        },
        publicId: {
            type: String,
            trim: true,
            default: "",
        },
        transcription: {
            type: String,
            default: "",
        },
        summary: {
            type: String,
            default: "",
        },
        keyPoints: {
            type: [String],
            default: [],
        },
        processedAt: {
            type: Date,
            default: null,
        },
        duration: {
            type: Number,
            default: 0,
            min: 0,
        },
        recordedAt: {
            type: Date,
            default: Date.now,
        },
    },
    {
        timestamps: true,
    }
);

recordingSchema.index({ meeting: 1, recordedAt: -1 });
recordingSchema.index({ recordedBy: 1, recordedAt: -1 });

const Recording = mongoose.model("Recording", recordingSchema);

export default Recording;
