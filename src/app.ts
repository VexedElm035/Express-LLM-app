import express from "express";
import index from "./routes/index";
import cors from "cors";
import { initVectorDB } from "./services/vectorService";

(async () => {
  await initVectorDB();
})();

const app = express();

app.use(express.json());
app.use(cors());
app.use("/api", index);

export default app;