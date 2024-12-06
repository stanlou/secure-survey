import { Router, Request, Response } from "express";
import prisma from "../../prisma/client";
import { Model } from "survey-core";

const router = Router();

router.post("/save", async (req: Request, res: Response) : Promise<any> => {
  try {
    const answerJson = req.body; 
    const createAnswer = await prisma.answer.create({
      data: {
        data:answerJson, 
        survey:{
          connect:{
            id:answerJson.surveyId
          }
        }
      },
    }); 

    res.status(201).json({ message: "Answer saved successfully", createAnswer });
  } catch (error) {
    console.error("Error saving answer:", error);
    res.status(500).json({ message: "Failed to save answer" });
  }
});


router.get("/findOne/:id", async (req: Request, res: Response) : Promise<any> => {
  try {  
    const answer = await prisma.answer.findUnique({
      where:{
        id: req.params.id,
      }
    }); 
    if (answer) {
       
    res.status(200).json({ answer });
    }
  } catch (error) {
    console.error("Error fetching answer:", error);
    res.status(500).json({ message: "Failed to find answer" });
  }
});

export default router;

