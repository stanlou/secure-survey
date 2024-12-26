import { Router, Request, Response } from "express";
import prisma from "../../prisma/client";
import { Model } from "survey-core";

const router = Router();

router.post("/save", async (req: Request, res: Response): Promise<any> => {
  try {
    const surveyJson = req.body;
    const survey = new Model(surveyJson);
    const correctSurveyJson = survey.toJSON();

    if (!correctSurveyJson) {
      return res
        .status(400)
        .json({ message: "Missing 'data' in request body" });
    }

    const createdSurvey = await prisma.survey.create({
      data: {
        data: correctSurveyJson,
      },
    });

    res
      .status(201)
      .json({ message: "Survey saved successfully", createdSurvey });
  } catch (error) {
    console.error("Error saving survey:", error);
    res.status(500).json({ message: "Failed to save survey" });
  }
});

router.get("/findMany", async (req: Request, res: Response) => {
  try {
    const surveyList = await prisma.survey.findMany();
    res.status(200).send({ surveyList });
  } catch (error) {
    console.error("Error fetching survey list:", error);
    res.status(500).json({ message: "Failed to find survey list" });
  }
});

router.get(
  "/findOne/answers/:id",
  async (req: Request, res: Response)  => {
    try {
      const survey = await prisma.survey.findUnique({
        where: {
          id: req.params.id,
        }, 
        select:{
          id:true,
          data:true,
          answers:true
        }
      });
      if (survey) {
        res.status(200).json({ survey });
      }
    } catch (error) {
      console.error("Error fetching survey:", error);
      res.status(500).json({ message: "Failed to find survey" });
    }
  }
);


router.get(
  "/findOne/:id",
  async (req: Request, res: Response)  => {
    try {
      const survey = await prisma.survey.findUnique({
        where: {
          id: req.params.id,
        },
      });
      if (survey) {
        res.status(200).json({ survey });
      }
    } catch (error) {
      console.error("Error fetching survey:", error);
      res.status(500).json({ message: "Failed to find survey" });
    }
  }
);

router.get("/search", async (req: Request, res: Response): Promise<any> => {
  try {
    const { key } = req.query;
  
    if (!key || typeof key !== "string") {
      return res
        .status(400)
        .json({ message: "Missing or invalid 'key' query parameter" });
    }

    const surveyList = await prisma.survey.findMany({
      where: {
          OR: [
            {
              data: {
                path: ["title"],
                string_contains: key,
              },
            },
            {
              data: {
                path: ["description"],
                string_contains: key,
              },
            },
          ],
      },
    });

    res.status(200).json({ surveyList });
  } catch (error) {
    console.error("Error searching surveys :", error);
    res.status(500).json({ message: "Failed to search surveys " });
  }
});  

export default router;
