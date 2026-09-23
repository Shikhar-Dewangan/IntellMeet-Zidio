import mongoose from "mongoose";

const meetingNoteSchema = new mongoose.Schema(
    {
        meeting: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Meeting",
            required: true,
        },

        author: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        content: {
            type: String,
            required: true,
        },
    },
    {
        timestamps: true,
    }
);

const MeetingNote = mongoose.model(
    "MeetingNote",
    meetingNoteSchema
);

export default MeetingNote;