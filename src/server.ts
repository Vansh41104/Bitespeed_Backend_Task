import express, { Request, Response } from 'express';
import { handleIdentify } from './controllers/identifyController';
import prisma from './utils/prismaClient';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.get('/', (req: Request, res: Response) => {
  res.send('Identity Reconciliation Service is running!');
});

app.post('/identify', handleIdentify);

const startServer = async () => {  try {
    await prisma.$connect();
    console.log('Connected to database successfully!');
    
    app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to connect to the database:', error);
    process.exit(1);
  }
};

startServer();

process.on('SIGINT', async () => {
  await prisma.$disconnect();
  console.log('Database connection closed. Server shutting down.');
  process.exit(0);
});