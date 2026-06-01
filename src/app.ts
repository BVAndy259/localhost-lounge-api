import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import authRouter from './routes/auth.routes';
import userRouter from './routes/user.routes';
import waiterRouter from './routes/waiter.routes';
import plateRouter from './routes/plate.routes';
import tableRouter from './routes/table.routes';
import reservationRouter from './routes/reservation.routes';
import chatRouter from './routes/chat.routes';
import orderRouter from './routes/order.routes';
import requestLogger from './middlewares/logger.middleware';
import errorHandler from './middlewares/error.middleware';

const app: Application = express();

app.use(cors());
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
app.use('/api/chat', chatRouter);
app.use('/api/orders', orderRouter);

app.use(errorHandler);

export default app;
