import mongoose from 'mongoose';
import { DB_NAME } from "../constent.js";
import dns from 'dns';

dns.setServers(["8.8.8.8", "1.1.1.1"]);

async function connectDB() {

    try {
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
        console.log(`MongoDB Connected !! DB HOST: ${connectionInstance.connection.host}`);
    } catch (error) {
        console.log("MongoDB Error =>", error);
    }
}   

export default connectDB;