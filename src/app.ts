import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import authRouter from './routes/auth.routes'
import userRouter from './routes/user.routes'

const app: Application = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/api/health', (req: Request, res: Response) => {
  res.status(200).json({
    status:  'success',
    message: 'Backend Corriendo...'
  });
});

app.use('/api/auth', authRouter)
app.use('/api/users', userRouter)

export default app;