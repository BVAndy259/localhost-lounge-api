import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import { env } from './shared/config/env';
import authRouter from './modules/auth/auth.routes';
import userRouter from './modules/users/user.routes';
import waiterRouter from './modules/waiters/waiter.routes';
import plateRouter from './modules/plates/plate.routes';
import tableRouter from './modules/tables/table.routes';
import reservationRouter from './modules/reservations/reservation.routes';
import orderRouter from './modules/orders/order.routes';
import requestLogger from './shared/middlewares/logger.middleware';
import errorHandler from './shared/middlewares/error.middleware';

const app: Application = express();

const corsOptions = {
  origin: [env.URL_ORIGIN],
  credentials: true,
};

app.use(cors(corsOptions));
app.set('etag', false);
app.use((req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  next();
});
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(requestLogger);

app.get('/api/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'success',
    message: 'Backend Corriendo...',
  });
});

app.use('/api/auth', authRouter);
app.use('/api/users', userRouter);
app.use('/api/waiters', waiterRouter);
app.use('/api/plates', plateRouter);
app.use('/api/tables', tableRouter);
app.use('/api/reservations', reservationRouter);
app.use('/api/orders', orderRouter);

app.use(errorHandler);

export default app;
