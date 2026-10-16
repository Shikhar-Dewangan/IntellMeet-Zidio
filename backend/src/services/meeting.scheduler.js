import Meeting from "../models/meeting.model.js";
import { getSocketServer } from "../sockets/socket.js";
import {
  endMeetingLifecycle,
  clearHostInactivityEnd,
} from "./meeting.service.js";

/**
 * ============================================================
 * Meeting Scheduler
 * ============================================================
 *
 * Rules:
 *  1. Auto-transition: scheduled → live when scheduledAt arrives
 *  2. Auto-end: live meeting with no meaningful activity for
 *     15 min (configurable via MEETING_AUTO_END_GRACE_MS)
 *
 * Runs every 30 seconds. Uses setInterval (no external deps).
 */

const SCHEDULER_INTERVAL_MS = 30 * 1000; // 30 seconds

/**
 * Grace period — no activity for this long → auto-end.
 * Default: 15 minutes.
 */
const getAutoEndGraceMs = () => {
  const configured = Number(process.env.MEETING_AUTO_END_GRACE_MS);
  return Number.isFinite(configured) && configured >= 60000
    ? configured // must be at least 1 minute
    : 15 * 60 * 1000; // 15 min default
};

/* ============================================================
   1. Promote scheduled meetings to live
   ============================================================ */
const promoteScheduledMeetings = async () => {
  const now = new Date();

  try {
    // Find scheduled meetings that are due
    const dueMeetings = await Meeting.find({
      status: "scheduled",
      scheduledAt: { $lte: now },
    }).select("_id host title scheduledAt");

    if (dueMeetings.length === 0) return;

    const io = getSocketServer();

    for (const meeting of dueMeetings) {
      try {
        // Re-fetch to guard against races
        const fresh = await Meeting.findById(meeting._id);
        if (!fresh || fresh.status !== "scheduled") continue;

        fresh.status = "live";
        fresh.startedAt = new Date();
        fresh.lastActivityAt = new Date(); // ← start counts as activity
        await fresh.save();

        // Clear any pending host inactivity timer
        clearHostInactivityEnd(fresh._id);

        console.log(
          `[Scheduler] Meeting ${fresh._id} ("${fresh.title}") is now LIVE (auto-started)`,
        );

        if (io) {
          // Notify room (in case anyone is already waiting)
          io.to(`meeting:${fresh._id.toString()}`).emit("meeting:started", {
            meetingId: fresh._id.toString(),
            startedAt: fresh.startedAt,
            autoStarted: true,
          });

          // Notify host specifically so MeetingDetails updates
          io.to(`user:${fresh.host.toString()}`).emit("meeting:auto-started", {
            meetingId: fresh._id.toString(),
            startedAt: fresh.startedAt,
            title: fresh.title,
          });
        }
      } catch (error) {
        console.error(
          `[Scheduler] Failed to promote meeting ${meeting._id}:`,
          error.message,
        );
      }
    }
  } catch (error) {
    console.error(
      "[Scheduler] promoteScheduledMeetings failed:",
      error.message,
    );
  }
};

/* ============================================================
   2. Auto-end live meetings with no activity
   ============================================================ */
const autoEndInactiveMeetings = async () => {
  const now = new Date();
  const graceMs = getAutoEndGraceMs();
  const cutoff = new Date(now.getTime() - graceMs);

  try {
    // Live meetings with no activity since cutoff
    const inactiveMeetings = await Meeting.find({
      status: "live",
      $or: [
        // Standard case: lastActivityAt is stale
        { lastActivityAt: { $lte: cutoff } },
        // Legacy fallback: no lastActivityAt, use startedAt
        { lastActivityAt: null, startedAt: { $lte: cutoff } },
      ],
    }).select("_id host title startedAt lastActivityAt participants");

    if (inactiveMeetings.length === 0) return;

    const io = getSocketServer();

    for (const meeting of inactiveMeetings) {
      try {
        const endedMeeting = await endMeetingLifecycle(meeting._id, null, {
          reason: "auto-end-no-activity",
        });

        console.log(
          `[Scheduler] Meeting ${endedMeeting._id} ("${endedMeeting.title}") auto-ended (no activity for ${Math.round(graceMs / 60000)} min)`,
        );

        if (io) {
          io.to(`meeting:${endedMeeting._id.toString()}`).emit(
            "meeting:ended",
            {
              meetingId: endedMeeting._id.toString(),
              endedBy: null,
              reason: "auto-end-no-activity",
              endedAt: endedMeeting.endedAt,
            },
          );
        }
      } catch (error) {
        // Ignore already-ended / not-found
        if (error.statusCode !== 409 && error.statusCode !== 404) {
          console.error(
            `[Scheduler] Failed to auto-end meeting ${meeting._id}:`,
            error.message,
          );
        }
      }
    }
  } catch (error) {
    console.error(
      "[Scheduler] autoEndInactiveMeetings failed:",
      error.message,
    );
  }
};

/* ============================================================
   3. Start Scheduler
   ============================================================ */
export const startMeetingScheduler = () => {
  const intervalSeconds = SCHEDULER_INTERVAL_MS / 1000;
  const graceMinutes = Math.round(getAutoEndGraceMs() / 60000);

  console.log(
    `[Scheduler] Started — interval: ${intervalSeconds}s, auto-end grace: ${graceMinutes} min`,
  );

  const tick = async () => {
    await promoteScheduledMeetings();
    await autoEndInactiveMeetings();
  };

  // Immediate first run
  tick();

  // Then recurring
  const interval = setInterval(tick, SCHEDULER_INTERVAL_MS);
  interval.unref?.(); // don't block process exit

  return interval;
};