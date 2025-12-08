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
const isDev = process.env.NODE_ENV !== 'production';

// Middleware
// In development, disable strict CSP to avoid Chrome DevTools issues
if (isDev) {
  app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  }));
} else {
  app.use(helmet());
}

// CORS - allow all origins in development
app.use(cors({
  origin: isDev ? true : (process.env.FRONTEND_URL || 'http://localhost:3000'),
  credentials: true,
}));

app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API info
app.get('/api', (req, res) => {
  res.json({
    name: 'AI Control Room API',
    version: '0.1.0',
    endpoints: {
      agents: '/api/agents',
      tools: '/api/tools',
      runs: '/api/runs',
      tenants: '/api/tenants',
    },
  });
});

// API Routes
app.use('/api/agents', agentRoutes);
app.use('/api/tools', toolRoutes);
app.use('/api/runs', runRoutes);
app.use('/api/tenants', tenantRoutes);

// 404 handler for API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Ignore Chrome DevTools requests
app.use('/.well-known/*', (req, res) => {
  res.status(204).send();
});

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal Server Error' });
});

app.listen(PORT, () => {
  console.log(`🚀 AI Control Room API running on http://localhost:${PORT}`);
  console.log(`📚 API docs: http://localhost:${PORT}/api`);
  console.log(`❤️  Health: http://localhost:${PORT}/health`);
});
