import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import ordersRouter from "./orders";
import invoicesRouter from "./invoices";
import analyticsRouter from "./analytics";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/auth", authRouter);
router.use("/orders", ordersRouter);
router.use("/invoices", invoicesRouter);
router.use("/analytics", analyticsRouter);

export default router;
