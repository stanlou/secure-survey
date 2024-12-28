import { Router, Request, Response } from "express";
import { reduceActions } from "../reducer/reducer";

const router = Router();

router.get("", async (req: Request, res: Response) => {
  try {
    await  reduceActions()
    res.status(200).json({ message: "Reduced successfully" });
  } catch (error) {
    console.error("Failed reducing actions:", error);
    res.status(500).json({ message: "Failed Error reducing actions" });
  }
});

export default router;

