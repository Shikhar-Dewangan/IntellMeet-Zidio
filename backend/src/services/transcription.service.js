import {
    createReadStream,
    createWriteStream,
} from "node:fs";

import {
    rm,
} from "node:fs/promises";

import {
    tmpdir,
} from "node:os";

import path from "node:path";

import {
    randomUUID,
} from "node:crypto";

import {
    Readable,
    Transform,
} from "node:stream";

import {
    pipeline,
} from "node:stream/promises";

import OpenAI from "openai";

import ApiError from "../utils/ApiError.js";

import {
    buildCloudinaryFolder,
} from "../utils/FileUplode.js";

let openAIClient;

const getOpenAIClient = () => {
    if (!process.env.OPENAI_API_KEY) {
        throw new ApiError(
            503,
            "Transcription service is not configured"
        );
    }

    openAIClient ||= new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
    });

    return openAIClient;
};

const getAllowedExtension = (
    recordingUrl
) => {
    const extension =
        path
            .extname(
                new URL(
                    recordingUrl
                ).pathname
            )
            .toLowerCase();

    const allowedExtensions =
        new Set([
            ".webm",
            ".mp4",
            ".mp3",
            ".wav",
            ".m4a",
            ".mpeg",
            ".mpga",
            ".oga",
            ".ogg",
            ".flac",
            ".aac",
        ]);

    return allowedExtensions.has(
        extension
    )
        ? extension
        : ".webm";
};

// ----------------------------------------------------
// Download Cloudinary Recording
// ----------------------------------------------------

const downloadCloudinaryRecording =
    async (recording) => {
        let recordingUrl;

        try {
            recordingUrl =
                new URL(
                    recording.recordingUrl
                );
        } catch {
            throw new ApiError(
                400,
                "Recording URL is invalid"
            );
        }

        const expectedFolder =
            buildCloudinaryFolder({
                entityType:
                    "recordings",

                userId:
                    recording.recordedBy.toString(),
            });

        const expectedPublicIdPrefix =
            `${expectedFolder}/`;

        /*
         * Security:
         * Only allow Cloudinary recording
         * belonging to the recording owner.
         */
        if (
            recordingUrl.protocol !==
                "https:" ||

            recordingUrl.hostname !==
                "res.cloudinary.com" ||

            !recording.publicId?.startsWith(
                expectedPublicIdPrefix
            )
        ) {
            throw new ApiError(
                400,
                "Only Cloudinary recordings owned by the recording user can be transcribed"
            );
        }

        let response;

        try {
            response = await fetch(
                recordingUrl,
                {
                    redirect: "error",
                }
            );
        } catch {
            throw new ApiError(
                502,
                "Unable to retrieve the recording for transcription"
            );
        }

        if (
            !response.ok ||
            !response.body
        ) {
            throw new ApiError(
                502,
                "Unable to retrieve the recording for transcription"
            );
        }

        const maxBytes =
            Number(
                process.env
                    .TRANSCRIPTION_MAX_FILE_BYTES
            ) ||
            150 *
                1024 *
                1024;

        const contentLength =
            Number(
                response.headers.get(
                    "content-length"
                )
            );

        if (
            Number.isFinite(
                contentLength
            ) &&
            contentLength >
                maxBytes
        ) {
            await response.body.cancel();

            throw new ApiError(
                413,
                "Recording exceeds the transcription file-size limit"
            );
        }

        const localFilePath =
            path.join(
                tmpdir(),
                `intellmeet-${randomUUID()}${getAllowedExtension(
                    recordingUrl.href
                )}`
            );

        let downloadedBytes = 0;

        const sizeLimiter =
            new Transform({
                transform(
                    chunk,
                    encoding,
                    callback
                ) {
                    downloadedBytes +=
                        chunk.length;

                    if (
                        downloadedBytes >
                        maxBytes
                    ) {
                        callback(
                            new ApiError(
                                413,
                                "Recording exceeds the transcription file-size limit"
                            )
                        );

                        return;
                    }

                    callback(
                        null,
                        chunk
                    );
                },
            });

        try {
            await pipeline(
                Readable.fromWeb(
                    response.body
                ),
                sizeLimiter,
                createWriteStream(
                    localFilePath,
                    {
                        flags: "wx",
                    }
                )
            );

            return localFilePath;
        } catch (error) {
            await rm(
                localFilePath,
                {
                    force: true,
                }
            );

            if (
                error.statusCode ===
                413
            ) {
                throw error;
            }

            throw new ApiError(
                502,
                "Unable to download the recording for transcription"
            );
        }
    };

// ----------------------------------------------------
// Transcribe Saved Recording
// ----------------------------------------------------

const transcribeRecording =
    async (recording) => {
        if (
            !recording?.recordingUrl ||
            !recording?.recordedBy
        ) {
            throw new ApiError(
                400,
                "Recording is missing its URL or owner"
            );
        }

        const localFilePath =
            await downloadCloudinaryRecording(
                recording
            );

        try {
            const result =
                await getOpenAIClient()
                    .audio
                    .transcriptions
                    .create({
                        file:
                            createReadStream(
                                localFilePath
                            ),

                        model:
                            process.env
                                .OPENAI_TRANSCRIPTION_MODEL ||
                            "gpt-4o-mini-transcribe",
                    });

            const text =
                result?.text?.trim();

            if (!text) {
                throw new ApiError(
                    502,
                    "Transcription provider returned empty text"
                );
            }

            return text;
        } catch (error) {
            if (
                error.statusCode
            ) {
                throw error;
            }

            console.error(
                "Recording transcription failed:",
                error.message
            );

            throw new ApiError(
                502,
                "Recording transcription failed"
            );
        } finally {
            await rm(
                localFilePath,
                {
                    force: true,
                }
            );
        }
    };

// ----------------------------------------------------
// Transcribe Live Audio Chunk
// ----------------------------------------------------

const transcribeAudioChunk =
    async ({
        buffer,
        filename = "audio.webm",
    }) => {
        if (
            !Buffer.isBuffer(buffer) ||
            buffer.length === 0
        ) {
            throw new ApiError(
                400,
                "Audio chunk is required"
            );
        }

        /*
         * Keep individual live chunks small.
         *
         * Default: 10 MB
         */
        const maxChunkBytes =
            Number(
                process.env
                    .LIVE_TRANSCRIPTION_MAX_CHUNK_BYTES
            ) ||
            10 *
                1024 *
                1024;

        if (
            buffer.length >
            maxChunkBytes
        ) {
            throw new ApiError(
                413,
                "Audio chunk is too large"
            );
        }

        const safeExtension =
            path
                .extname(filename)
                .toLowerCase();

        const allowedExtensions =
            new Set([
                ".webm",
                ".mp4",
                ".mp3",
                ".wav",
                ".m4a",
                ".ogg",
                ".oga",
                ".flac",
                ".aac",
            ]);

        const extension =
            allowedExtensions.has(
                safeExtension
            )
                ? safeExtension
                : ".webm";

        const localFilePath =
            path.join(
                tmpdir(),
                `intellmeet-live-${randomUUID()}${extension}`
            );

        try {
            /*
             * Write the browser MediaRecorder
             * chunk to a temporary file.
             */
            await import(
                "node:fs/promises"
            ).then(
                ({ writeFile }) =>
                    writeFile(
                        localFilePath,
                        buffer,
                        {
                            flag: "wx",
                        }
                    )
            );

            /*
             * Do not provide a language.
             *
             * This allows the transcription
             * provider to process the original
             * spoken language rather than forcing
             * English.
             */
            const result =
                await getOpenAIClient()
                    .audio
                    .transcriptions
                    .create({
                        file:
                            createReadStream(
                                localFilePath
                            ),

                        model:
                            process.env
                                .OPENAI_LIVE_TRANSCRIPTION_MODEL ||
                            process.env
                                .OPENAI_TRANSCRIPTION_MODEL ||
                            "gpt-4o-mini-transcribe",

                        response_format:
                            "json",
                    });

            const text =
                result?.text?.trim();

            if (!text) {
                return {
                    text: "",
                    language:
                        result?.language ||
                        null,
                };
            }

            return {
                text,
                language:
                    result?.language ||
                    null,
            };
        } catch (error) {
            if (
                error.statusCode
            ) {
                throw error;
            }

            console.error(
                "Live audio transcription failed:",
                error.message
            );

            throw new ApiError(
                502,
                "Live audio transcription failed"
            );
        } finally {
            await rm(
                localFilePath,
                {
                    force: true,
                }
            );
        }
    };

export {
    transcribeRecording,
    transcribeAudioChunk,
};