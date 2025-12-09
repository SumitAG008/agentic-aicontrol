// Agent Routes - Full CRUD with real database
import { Router } from 'express';
import { agentService } from '../services';
import { authenticate, mockAuth } from '../middleware/auth';
import { validateBody, validateQuery, validateParams } from '../middleware/validate';
import {
  CreateAgentSchema,
  UpdateAgentSchema,
  AgentFiltersSchema,
  IdParamSchema,
} from '../lib/validators';

const router = Router();

// Use mock auth in development for easy testing
if (process.env.NODE_ENV === 'development') {
  router.use(mockAuth);
}

// All routes require authentication
router.use(authenticate);

// GET /api/agents - List all agents with filters
router.get('/', validateQuery(AgentFiltersSchema), async (req, res, next) => {
  try {
    if (!req.context) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const result = await agentService.list(req.context, req.query as any);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// GET /api/agents/status-counts - Get agent counts by status
router.get('/status-counts', async (req, res, next) => {
  try {
    if (!req.context) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const counts = await agentService.getStatusCounts(req.context);
    res.json(counts);
  } catch (error) {
    next(error);
  }
});

// GET /api/agents/:id - Get single agent
router.get('/:id', validateParams(IdParamSchema), async (req, res, next) => {
  try {
    if (!req.context) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const agent = await agentService.getById(req.context, req.params.id);

    if (!agent) {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'Agent not found',
        },
      });
    }

    res.json(agent);
  } catch (error) {
    next(error);
  }
});

// POST /api/agents - Create new agent
router.post('/', validateBody(CreateAgentSchema), async (req, res, next) => {
  try {
    if (!req.context) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const agent = await agentService.create(req.context, req.body);
    res.status(201).json(agent);
  } catch (error) {
    next(error);
  }
});

// PUT /api/agents/:id - Update agent
router.put(
  '/:id',
  validateParams(IdParamSchema),
  validateBody(UpdateAgentSchema),
  async (req, res, next) => {
    try {
      if (!req.context) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const agent = await agentService.update(req.context, req.params.id, req.body);

      if (!agent) {
        return res.status(404).json({
          error: {
            code: 'NOT_FOUND',
            message: 'Agent not found',
          },
        });
      }

      res.json(agent);
    } catch (error) {
      next(error);
    }
  }
);

// DELETE /api/agents/:id - Delete agent
router.delete('/:id', validateParams(IdParamSchema), async (req, res, next) => {
  try {
    if (!req.context) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const deleted = await agentService.delete(req.context, req.params.id);

    if (!deleted) {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'Agent not found',
        },
      });
    }

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

// POST /api/agents/:id/start - Start agent
router.post('/:id/start', validateParams(IdParamSchema), async (req, res, next) => {
  try {
    if (!req.context) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const agent = await agentService.start(req.context, req.params.id);

    if (!agent) {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'Agent not found',
        },
      });
    }

    res.json(agent);
  } catch (error) {
    next(error);
  }
});

// POST /api/agents/:id/stop - Stop agent
router.post('/:id/stop', validateParams(IdParamSchema), async (req, res, next) => {
  try {
    if (!req.context) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const agent = await agentService.stop(req.context, req.params.id);

    if (!agent) {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'Agent not found',
        },
      });
    }

    res.json(agent);
  } catch (error) {
    next(error);
  }
});

// POST /api/agents/:id/pause - Pause agent
router.post('/:id/pause', validateParams(IdParamSchema), async (req, res, next) => {
  try {
    if (!req.context) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const agent = await agentService.pause(req.context, req.params.id);

    if (!agent) {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'Agent not found',
        },
      });
    }

    res.json(agent);
  } catch (error) {
    next(error);
  }
});

export { router as agentRoutes };
