import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { agentRoutes } from './routes/agents';
import { toolRoutes } from './routes/tools';
import { runRoutes } from './routes/runs';
import { tenantRoutes } from './routes/tenants';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/agents', agentRoutes);
app.use('/api/tools', toolRoutes);
app.use('/api/runs', runRoutes);
app.use('/api/tenants', tenantRoutes);

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal Server Error' });
});

app.listen(PORT, () => {
  console.log(`🚀 AI Control Room API running on http://localhost:${PORT}`);
});
