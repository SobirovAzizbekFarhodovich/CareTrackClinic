import app from "./app.js";
import { config } from "./config/env.js";

const PORT = config.port;

const server = app.listen(PORT, () => {
    console.log(`Server is running on ${PORT} port`)
});

server.on("error", (error) => {
    console.error("Server failed to start:", error.message);
    process.exit(1);
});
