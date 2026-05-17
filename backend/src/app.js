import express from "express";
import cors from "cors";
import apiRoutes from "./routes/index.js";
import { errorHandler, notFound } from "./middlewares/error.middleware.js";
import { openApiDocument, swaggerHtml } from "./config/swagger.js";


const app = express()

app.use(cors());
app.use(express.json());

app.get("/api/swagger.json", (req, res) => {
    res.json(openApiDocument);
});

app.get("/api/swagger", (req, res) => {
    res.type("html").send(swaggerHtml());
});

app.use("/api", apiRoutes);


app.get('/',(req, res) =>{
    res.json({message:"Api is running"});
});

app.use(notFound);
app.use(errorHandler);

export default app;
