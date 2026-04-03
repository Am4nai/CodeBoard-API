import { Router } from "express";
import { getLanguages } from "../controllers/languages.controller";

const router = Router();

router.get("/", getLanguages);

export default router;
