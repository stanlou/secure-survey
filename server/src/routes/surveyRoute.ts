import { Router, Request, Response } from "express";
import prisma from "../../prisma/client";
import { Model } from "survey-core";

const router = Router();

router.post("/saveSurvey", async (req: Request, res: Response) : Promise<any> => {
  try {
    const surveyJson = req.body; 
    console.log(surveyJson)
    const survey = new Model(surveyJson);
    const correctSurveyJson = survey.toJSON();

    if (!correctSurveyJson) {
      return res.status(400).json({ message: "Missing 'data' in request body" });
    }

    const createdSurvey = await prisma.survey.create({
      data: {
        data:correctSurveyJson, 
      },
    }); 

    res.status(201).json({ message: "Survey saved successfully", createdSurvey });
  } catch (error) {
    console.error("Error saving survey:", error);
    res.status(500).json({ message: "Failed to save survey" });
  }
});

router.get("/findMany", async (req: Request, res: Response) : Promise<any> => {
  try {
    const surveyList = await prisma.survey.findMany(); 
    res.status(200).json({ surveyList });
  } catch (error) {
    console.error("Error saving survey:", error);
    res.status(500).json({ message: "Failed to find survey list" });
  }
});

router.get("/findOne/:id", async (req: Request, res: Response) : Promise<any> => {
  try {
    const survey = await prisma.survey.findUnique({
      where:{
        id: req.params.id,
      }
    }); 
    res.status(200).json({ survey });
  } catch (error) {
    console.error("Error saving survey:", error);
    res.status(500).json({ message: "Failed to find survey" });
  }
});

export default router;

