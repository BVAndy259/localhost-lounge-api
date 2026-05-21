import express, { Application, Request, Response } from "express";
import cors from "cors";
import authRouter from "./routes/auth.routes";
import userRouter from "./routes/user.routes";
import waiterRouter from "./routes/waiter.routes";
import plateRouter from "./routes/plate.routes";
import tableRouter from "./routes/table.routes";
import reservationRouter from "./routes/reservation.routes";

const app: Application = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/api/health", (req: Request, res: Response) => {
  res.status(200).json({
    status: "success",
    message: "Backend Corriendo...",
  });
});

app.use("/api/auth", authRouter);
app.use("/api/users", userRouter);
app.use("/api/waiters", waiterRouter);
app.use("/api/plates", plateRouter);
app.use("/api/tables", tableRouter);
app.use("/api/reservations", reservationRouter);

export default app;
