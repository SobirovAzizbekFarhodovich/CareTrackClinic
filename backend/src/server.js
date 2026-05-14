import app from "./app.js";

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
    console.log(`Server is running on ${PORT} port`)
});

server.on("error", (error) => {
    console.error("Server failed to start:", error.message);
    process.exit(1);
});
