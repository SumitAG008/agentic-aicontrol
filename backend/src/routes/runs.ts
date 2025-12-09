// Run Routes - Execution tracking and management
import { Router } from 'express';
import { runService } from '../services';
import { authenticate, mockAuth } from '../middleware/auth';
import { validateBody, validateQuery, validateParams } from '../middleware/validate';
import { CreateRunSchema, RunFiltersSchema, IdParamSchema } from '../lib/validators';

const router = Router();

// Use mock auth in development
if (process.env.NODE_ENV === 'development') {
  router.use(mockAuth);
}

router.use(authenticate);

// GET /api/runs - List runs with filters
router.get('/', validateQuery(RunFiltersSchema), async (req, res, next) => {
  try {
    if (!req.context) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const result = await runService.list(req.context, req.query as any);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// GET /api/runs/recent - Get recent runs
router.get('/recent', async (req, res, next) => {
  try {
    if (!req.context) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const limit = parseInt(req.query.limit as string) || 10;
    const runs = await runService.getRecent(req.context, limit);
    res.json(runs);
  } catch (error) {
    next(error);
  }
});

// GET /api/runs/stats - Get run statistics
router.get('/stats', async (req, res, next) => {
  try {
    if (!req.context) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const period = (req.query.period as 'day' | 'week' | 'month') || 'day';
    const stats = await runService.getStats(req.context, period);
    res.json(stats);
  } catch (error) {
    next(error);
  }
});

// GET /api/runs/today-count - Get today's run count
router.get('/today-count', async (req, res, next) => {
  try {
    if (!req.context) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const count = await runService.getTodayCount(req.context);
    res.json({ count });
  } catch (error) {
    next(error);
  }
});

// GET /api/runs/:id - Get single run
router.get('/:id', validateParams(IdParamSchema), async (req, res, next) => {
  try {
    if (!req.context) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const run = await runService.getById(req.context, req.params.id);

    if (!run) {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'Run not found',
        },
      });
    }

    res.json(run);
  } catch (error) {
    next(error);
  }
});

// GET /api/runs/:id/steps - Get execution steps
router.get('/:id/steps', validateParams(IdParamSchema), async (req, res, next) => {
  try {
    if (!req.context) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const steps = await runService.getSteps(req.context, req.params.id);

    if (!steps) {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'Run not found',
        },
      });
    }

    res.json(steps);
  } catch (error) {
    next(error);
  }
});

// POST /api/runs - Create a new run (trigger agent execution)
router.post('/', validateBody(CreateRunSchema), async (req, res, next) => {
  try {
    if (!req.context) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const run = await runService.create(req.context, req.body);
    res.status(201).json(run);
  } catch (error) {
    if (error instanceof Error && error.message === 'Agent not found') {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'Agent not found',
        },
      });
    }
    next(error);
  }
});

// POST /api/runs/:id/cancel - Cancel a run
router.post('/:id/cancel', validateParams(IdParamSchema), async (req, res, next) => {
  try {
    if (!req.context) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const run = await runService.cancel(req.context, req.params.id);

    if (!run) {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'Run not found or cannot be cancelled',
        },
      });
    }

    res.json(run);
  } catch (error) {
    next(error);
  }
});

export { router as runRoutes };
