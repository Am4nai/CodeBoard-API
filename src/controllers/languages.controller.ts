import { Request, Response } from "express";
import { LanguageModel } from "../models/LanguageModel";

export const getLanguages = async (_req: Request, res: Response) => {
  try {
    const languages = await LanguageModel.getAll();
    return res.json(languages);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Error fetching languages" });
  }
};
