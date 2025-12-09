// Dashboard Routes - Metrics, activity feed, and quick stats
import { Router } from 'express';
import { dashboardService } from '../services';
import { authenticate, mockAuth } from '../middleware/auth';

const router = Router();

// Use mock auth in development
if (process.env.NODE_ENV === 'development') {
  router.use(mockAuth);
}

router.use(authenticate);

// GET /api/dashboard/metrics - Get dashboard KPI metrics
router.get('/metrics', async (req, res, next) => {
  try {
    if (!req.context) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const metrics = await dashboardService.getMetrics(req.context);
    res.json(metrics);
  } catch (error) {
    next(error);
  }
});

// GET /api/dashboard/activity - Get activity feed
router.get('/activity', async (req, res, next) => {
  try {
    if (!req.context) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const limit = parseInt(req.query.limit as string) || 20;
    const activity = await dashboardService.getActivityFeed(req.context, limit);
    res.json(activity);
  } catch (error) {
    next(error);
  }
});

// GET /api/dashboard/agents - Get agent status grid
router.get('/agents', async (req, res, next) => {
  try {
    if (!req.context) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const limit = parseInt(req.query.limit as string) || 12;
    const agents = await dashboardService.getAgentStatusGrid(req.context, limit);
    res.json(agents);
  } catch (error) {
    next(error);
  }
});

// GET /api/dashboard/quick-stats - Get quick stats for header
router.get('/quick-stats', async (req, res, next) => {
  try {
    if (!req.context) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const stats = await dashboardService.getQuickStats(req.context);
    res.json(stats);
  } catch (error) {
    next(error);
  }
});

export { router as dashboardRoutes };
