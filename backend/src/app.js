import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import registerRoutes from "./routes/index.js";
import errorMiddleware from "./middleware/error.middleware.js";
import notFoundMiddleware from "./middleware/notFound.middleware.js";


const app = express();

const allowedOrigins = ["http://localhost:5173"];

app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
            return;
        }

        callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
}));

app.use(cookieParser());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));
app.use(express.static("public"));



// Health Check

app.get("/api/v1/health", (req, res) => {
    res.status(200).json({
        success: true,
        message: "IntellMeet API is running",
    });
});


// App Routes
registerRoutes(app);


// 404 - Route not found
app.use(notFoundMiddleware);


// Centralized error handler
app.use(errorMiddleware);


export default app;

