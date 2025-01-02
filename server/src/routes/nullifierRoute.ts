import { Router, Request, Response } from "express";
import prisma from "../../prisma/client";

const router = Router();

router.post("/save", async (req: Request, res: Response)  => {
  try {
    const nullifierJson = req.body; 
    const existingNullifier = await prisma.nullifier.findUnique({
      where:{
        key:nullifierJson.key
      }
    })
    if(!existingNullifier){
      const createNullifier = await prisma.nullifier.create({
        data: nullifierJson,
      }); 
  
    }else{
      res.status(500).json({ message: "Nullifier already exist" });
      return
    }

    res.status(201).json({ message: "Nullifier saved successfully", nullifierJson });
  } catch (error) {
    console.error("Error saving nullifier:", error);
    res.status(500).json({ message: "Failed to save nullifier" });
  }
});


router.get("/findOne/:key", async (req: Request, res: Response) => {
  try {  
    const nullifier = await prisma.nullifier.findUnique({
      where:{
        key: req.params.key,
      }
    }); 
    if (nullifier) {
       
    res.status(200).json({ nullifier });
    }
  } catch (error) {
    console.error("Error fetching nullifier:", error);
    res.status(500).json({ message: "Failed to find nullifier" });
  }
});

router.get("/findMany", async (req: Request, res: Response) => {
  try {
    const nullifierList = await prisma.nullifier.findMany();
    res.status(200).send({ nullifierList });
  } catch (error) {
    console.error("Error fetching nullifier  list:", error);
    res.status(500).json({ message: "Failed to find nullifier list" });
  }
});

export default router;

