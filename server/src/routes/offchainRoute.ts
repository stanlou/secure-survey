import { Router, Request, Response } from "express";
import prisma from "../../prisma/client";

const router = Router();

router.get("/getAll", async (req: Request, res: Response) => {
  try {
    const [nullifierList,surveyList,answerList] = await Promise.all([
        prisma.nullifier.findMany(),
        prisma.survey.findMany(),
        prisma.answer.findMany()
    ])

    res.status(200).send({ nullifierList,surveyList,answerList });
  } catch (error) {
    console.error("Error fetching nullifier  list:", error);
    res.status(500).json({ message: "Failed to find nullifier list" });
  }
});

export default router;

