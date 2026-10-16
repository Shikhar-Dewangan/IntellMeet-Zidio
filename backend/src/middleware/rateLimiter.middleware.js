import rateLimit, { ipKeyGenerator } from "express-rate-limit";

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes

    max: 50,

    standardHeaders: true,
    legacyHeaders: false,

    message: {
        success: false,
        message: "Too many requests. Please try again later.",
    },
});

// AI generation is an expensive, paid operation. Keep the limit scoped to
// the authenticated user so one client cannot exhaust the provider quota.
const aiInsightLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => req.user?._id?.toString() || ipKeyGenerator(req.ip),
    message: {
        success: false,
        message: "Too many AI insight requests. Please try again later.",
    },
});

export {
    authLimiter,
    aiInsightLimiter,
};
