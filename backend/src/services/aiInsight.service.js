import AIInsight from "../models/aiInsight.model.js";
import Meeting from "../models/meeting.model.js";

import {
    getMeetingTranscript,
    buildTranscriptText,
} from "./transcript.service.js";

import {
    generateMeetingInsights,
} from "./ai.service.js";

const processMeetingAI = async (meetingId) => {
    let insight;

    try {
        const meeting = await Meeting.findById(
            meetingId
        ).select(
            "title description host participants status"
        );

        if (!meeting) {
            throw new Error("Meeting not found");
        }

        const segments =
            await getMeetingTranscript(meetingId);

        const transcript =
            buildTranscriptText(segments);

        if (!transcript.trim()) {
            insight =
                await AIInsight.findOneAndUpdate(
                    { meeting: meetingId },

                    {
                        $set: {
                            status: "unavailable",

                            error:
                                "No meeting transcript is available for AI analysis.",

                            processedAt: new Date(),
                        },

                        $setOnInsert: {
                            meeting: meetingId,
                            transcript: "",
                        },
                    },

                    {
                        new: true,
                        upsert: true,
                    }
                );

            return insight;
        }

        insight =
            await AIInsight.findOneAndUpdate(
                { meeting: meetingId },

                {
                    $set: {
                        status: "processing",
                        error: "",
                        transcript,
                    },

                    $setOnInsert: {
                        meeting: meetingId,
                    },
                },

                {
                    new: true,
                    upsert: true,
                }
            );

        const result =
            await generateMeetingInsights({
                transcript,

                meetingTitle:
                    meeting.title,

                meetingDescription:
                    meeting.description,
            });

        insight.summary =
            result.summary;

        insight.keyPoints =
            result.keyPoints;

        insight.decisions =
            result.decisions;

        insight.actionItems =
            result.actionItems;

        insight.status =
            "completed";

        insight.error = "";

        insight.processedAt =
            new Date();

        await insight.save();

        return insight;
    } catch (error) {
        console.error(
            "Meeting AI processing failed:",
            error.message
        );

        if (insight) {
            insight.status = "failed";
            insight.error =
                error.message ||
                "AI analysis failed";

            await insight.save();
        } else {
            await AIInsight.findOneAndUpdate(
                { meeting: meetingId },

                {
                    $set: {
                        status: "failed",

                        error:
                            error.message ||
                            "AI analysis failed",
                    },

                    $setOnInsert: {
                        meeting: meetingId,
                        transcript: "",
                    },
                },

                {
                    upsert: true,
                }
            );
        }

        throw error;
    }
};

export {
    processMeetingAI,
};