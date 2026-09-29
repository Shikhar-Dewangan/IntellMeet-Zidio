import mongoose from "mongoose";

const meetingNoteSchema = new mongoose.Schema(
    {
        meeting: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Meeting",
            required: true,
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        content: {
            type: String,
            required: true,
            trim: true,
            minlength: 1,
            maxlength: 5000,
        },
    },
    {
        timestamps: true,
    }
);

meetingNoteSchema.index({ meeting: 1, createdAt: -1 });
meetingNoteSchema.index({ createdBy: 1 });

const MeetingNote = mongoose.model("MeetingNote", meetingNoteSchema);

export default MeetingNote;