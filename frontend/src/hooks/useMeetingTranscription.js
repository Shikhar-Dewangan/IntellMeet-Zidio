import {
    useCallback,
    useEffect,
    useRef,
} from "react";

const CHUNK_INTERVAL = 15000;

const useMeetingTranscription = ({
    meetingId,
    stream,
    enabled = true,
    onTranscript,
}) => {
    const recorderRef =
        useRef(null);

    const sequenceRef =
        useRef(0);

    const intervalRef =
        useRef(null);

    const start = useCallback(() => {
        if (!enabled || !stream) {
            return;
        }

        if (
            recorderRef.current?.state ===
            "recording"
        ) {
            return;
        }

        const audioTracks =
            stream.getAudioTracks();

        if (!audioTracks.length) {
            return;
        }

        const audioStream =
            new MediaStream(
                audioTracks
            );

        const recorder =
            new MediaRecorder(
                audioStream,
                {
                    mimeType:
                        "audio/webm",
                }
            );

        recorderRef.current =
            recorder;

        recorder.ondataavailable =
            async (event) => {
                if (
                    !event.data ||
                    event.data.size === 0
                ) {
                    return;
                }

                const startedAt =
                    new Date();

                const formData =
                    new FormData();

                formData.append(
                    "audio",
                    event.data,
                    `segment-${sequenceRef.current}.webm`
                );

                formData.append(
                    "sequence",
                    sequenceRef.current
                );

                formData.append(
                    "startedAt",
                    startedAt.toISOString()
                );

                formData.append(
                    "endedAt",
                    new Date().toISOString()
                );

                sequenceRef.current += 1;

                try {
                    const response =
                        await fetch(
                            `/api/transcripts/${meetingId}/chunk`,
                            {
                                method: "POST",
                                body: formData,
                                credentials:
                                    "include",
                            }
                        );

                    const result =
                        await response.json();

                    if (
                        result?.data &&
                        onTranscript
                    ) {
                        onTranscript(
                            result.data
                        );
                    }
                } catch (error) {
                    console.error(
                        "Transcript upload failed:",
                        error
                    );
                }
            };

        recorder.start();

        intervalRef.current =
            setInterval(() => {
                if (
                    recorder.state ===
                    "recording"
                ) {
                    recorder.stop();

                    setTimeout(() => {
                        if (
                            recorder.state ===
                            "inactive"
                        ) {
                            recorder.start();
                        }
                    }, 100);
                }
            }, CHUNK_INTERVAL);
    }, [
        enabled,
        meetingId,
        onTranscript,
        stream,
    ]);

    const stop =
        useCallback(() => {
            if (
                intervalRef.current
            ) {
                clearInterval(
                    intervalRef.current
                );

                intervalRef.current =
                    null;
            }

            if (
                recorderRef.current &&
                recorderRef.current.state ===
                    "recording"
            ) {
                recorderRef.current.stop();
            }

            recorderRef.current =
                null;
        }, []);

    useEffect(() => {
        start();

        return () => {
            stop();
        };
    }, [start, stop]);

    return {
        start,
        stop,
    };
};

export default useMeetingTranscription;