import { Router, type IRouter } from "express";
import healthRouter from "./health";
import gridtradeRouter from "./gridtrade";

const router: IRouter = Router();

router.use(healthRouter);
router.use(gridtradeRouter);

export default router;
