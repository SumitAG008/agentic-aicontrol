// Tool Routes - Tool management and tenant configurations
import { Router } from 'express';
import { toolService } from '../services';
import { authenticate, mockAuth } from '../middleware/auth';
import { validateQuery, validateParams, validateBody } from '../middleware/validate';
import { ToolFiltersSchema, IdParamSchema, UpdateToolConfigSchema } from '../lib/validators';

const router = Router();

// Use mock auth in development
if (process.env.NODE_ENV === 'development') {
  router.use(mockAuth);
}

router.use(authenticate);

// GET /api/tools - List all tools with tenant connection status
router.get('/', validateQuery(ToolFiltersSchema), async (req, res, next) => {
  try {
    if (!req.context) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const result = await toolService.listWithTenantStatus(req.context, req.query as any);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// GET /api/tools/categories - Get tools grouped by category
router.get('/categories', async (req, res, next) => {
  try {
    const categories = [
      'COMMUNICATION',
      'DATA',
      'ANALYTICS',
      'INTEGRATION',
      'HRTECH',
      'PRODUCTIVITY',
      'AI',
      'CUSTOM',
    ];

    const result: Record<string, any[]> = {};

    for (const category of categories) {
      result[category] = await toolService.getByCategory(category as any);
    }

    res.json(result);
  } catch (error) {
    next(error);
  }
});

// GET /api/tools/hr - Get HR-specific tools
router.get('/hr', async (req, res, next) => {
  try {
    const tools = await toolService.getHRTools();
    res.json(tools);
  } catch (error) {
    next(error);
  }
});

// GET /api/tools/connected-count - Get count of connected tools
router.get('/connected-count', async (req, res, next) => {
  try {
    if (!req.context) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const count = await toolService.getConnectedCount(req.context);
    res.json({ count });
  } catch (error) {
    next(error);
  }
});

// GET /api/tools/:id - Get single tool with tenant config
router.get('/:id', validateParams(IdParamSchema), async (req, res, next) => {
  try {
    if (!req.context) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const tool = await toolService.getWithTenantConfig(req.context, req.params.id);

    if (!tool) {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'Tool not found',
        },
      });
    }

    res.json(tool);
  } catch (error) {
    next(error);
  }
});

// POST /api/tools/:id/test - Test tool connection
router.post('/:id/test', validateParams(IdParamSchema), async (req, res, next) => {
  try {
    if (!req.context) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const result = await toolService.testConnection(req.context, req.params.id);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// PUT /api/tools/:id/config - Update tenant tool configuration
router.put(
  '/:id/config',
  validateParams(IdParamSchema),
  validateBody(UpdateToolConfigSchema),
  async (req, res, next) => {
    try {
      if (!req.context) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const config = await toolService.updateTenantConfig(
        req.context,
        req.params.id,
        req.body
      );

      if (!config) {
        return res.status(404).json({
          error: {
            code: 'NOT_FOUND',
            message: 'Tool not found',
          },
        });
      }

      res.json(config);
    } catch (error) {
      next(error);
    }
  }
);

export { router as toolRoutes };
