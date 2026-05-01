import { Router, type IRouter } from "express";
import healthRouter from "./health";
import hadithRouter from "./hadith";

const router: IRouter = Router();

router.use(healthRouter);
router.use(hadithRouter);

export default router;
