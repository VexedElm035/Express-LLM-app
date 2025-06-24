import { ChromaClient } from "chromadb";
import { Chroma } from "@langchain/community/vectorstores/chroma";
import express from "express";
import index from "./routes/index";

const app = express();
app.use(express.json());


app.use("/api", index);

// const client = new ChromaClient();
// const vectorStore = new Chroma(embeddings, {
//   collectionName: "a-test-collection",
// });

export default app;