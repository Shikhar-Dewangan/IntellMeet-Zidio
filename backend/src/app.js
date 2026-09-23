import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import registerRoutes from "./routes";


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

// 404 Handler

app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: `Route not found: ${req.method} ${req.originalUrl}`,
    });
});


export default app;

