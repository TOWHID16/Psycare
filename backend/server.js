// phycare/backend/server.js

import dotenv from "dotenv";
import http from "http"; // 1. Import the 'http' module
import { app } from "./src/app.js";
import { connectDB } from "./src/config/db.js";
import { initializeSocketIO } from "./src/socket/socket.js"; // 2. Import your socket logic

dotenv.config();

// 3. Create a standard HTTP server from your Express app
const httpServer = http.createServer(app);

// 4. Initialize Socket.IO and attach it to the HTTP server
initializeSocketIO(httpServer);

connectDB()
.then(() => {
    app.on("error", (err) => {
        console.log("EXPRESS APP ERROR :", err);
    });

    // 5. IMPORTANT: Start the httpServer, not the Express app, for sockets to work.
    httpServer.listen(process.env.PORT || 8000, () => {
        // 6. Correctly log the port the server is running on.
        console.log(`🚀 Server is running at PORT : ${process.env.PORT || 8000}`);
    });
})
.catch((err) => {
    console.log("Mongodb connection failed !!! ", err);
});