import dotenv from "dotenv";
import connectDB from "./db/index.js";
import app from "./app.js";
import { initSocketServer } from "./sockets/socket.js";

dotenv.config({ path: "./.env" });

const startServer = async () => {
    try {
        await connectDB();

        const server = app.listen(process.env.PORT || 8000, () => {
            console.log(`Server is running on port ${process.env.PORT || 8000}`);
        });

        initSocketServer(server);
    } catch (error) {
        console.error("Error connecting to the database:", error);
        process.exit(1);
    }
};

startServer();