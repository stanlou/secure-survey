import express, { Express } from "express";
import dotenv from "dotenv";
import surveyRoute from "./routes/surveyRoute";
import answerRoute from "./routes/answerRoute";
import nullifierRoute from "./routes/nullifierRoute";

import cors from "cors";
import offchainRoute from "./routes/offchainRoute";
import cron from "node-cron"
import { reduceActions } from "./reducer/reducer";
import { cacheZkApp } from "./cacheZkApp";
import reduceRoute from "./routes/reduceRoute";

dotenv.config();

const app: Express = express();
const port = process.env.PORT || 3000;
app.use(cors());

// Middleware to parse JSON requests
app.use(express.json());

// Register survey routes
app.use("/survey", surveyRoute);
// Register answer routes
app.use("/answer", answerRoute);
// Register nullifier routes  
app.use("/nullifier", nullifierRoute);
// offChainStorage managemenet
app.use("/offchain", offchainRoute);
app.use("/reduce", reduceRoute);

app.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);
});


//cacheZkApp()
cron.schedule('0 * * * *', reduceActions);
