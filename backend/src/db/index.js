import mongoose from 'mongoose';
import { DB_NAME } from "../constent.js";
import dns from 'dns';

dns.setServers(["8.8.8.8", "1.1.1.1"]);

async function connectDB() {
    try {
        if (!process.env.MONGODB_URI) {
            throw new Error("MONGODB_URI is not configured");
        }

        const connectionInstance = await mongoose.connect(process.env.MONGODB_URI, {
            dbName: DB_NAME,
        });
        console.log(`MongoDB Connected !! DB HOST: ${connectionInstance.connection.host}`);
    } catch (error) {
        console.error("MongoDB Error =>", error.message);
        throw error;
    }
}

export default connectDB;