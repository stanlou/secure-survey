import express, { Express } from "express";
import dotenv from "dotenv";
import surveyRoute from "./routes/surveyRoute";
import answerRoute from "./routes/answerRoute";

import cors from "cors";

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

app.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);
});
  