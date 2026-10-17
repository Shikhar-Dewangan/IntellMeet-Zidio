import mongoose from "mongoose";

const transcriptSegmentSchema = new mongoose.Schema(
    {
        meeting: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Meeting",
            required: true,
            index: true,
        },

        speaker: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        text: {
            type: String,
            required: true,
            trim: true,
            maxlength: 5000,
        },

        language: {
            type: String,
            trim: true,
            default: "unknown",
        },

        sequence: {
            type: Number,
            required: true,
            min: 0,
        },

        startedAt: {
            type: Date,
            required: true,
        },

        endedAt: {
            type: Date,
            required: true,
        },
    },
    {
        timestamps: true,
    }
);

transcriptSegmentSchema.index({
    meeting: 1,
    sequence: 1,
});

transcriptSegmentSchema.index({
    meeting: 1,
    createdAt: 1,
});

const MeetingTranscript = mongoose.model(
    "MeetingTranscript",
    transcriptSegmentSchema
);

export default MeetingTranscript;