// Tenant Routes - Multi-tenant management
import { Router } from 'express';
import { tenantService } from '../services';
import { authenticate, mockAuth, requireRole } from '../middleware/auth';
import { validateBody, validateParams } from '../middleware/validate';
import { UpdateTenantSchema, IdParamSchema } from '../lib/validators';

const router = Router();

// Use mock auth in development
if (process.env.NODE_ENV === 'development') {
  router.use(mockAuth);
}

router.use(authenticate);

// GET /api/tenants/current - Get current tenant
router.get('/current', async (req, res, next) => {
  try {
    if (!req.context) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const tenant = await tenantService.getById(req.context.tenantId);

    if (!tenant) {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'Tenant not found',
        },
      });
    }

    res.json(tenant);
  } catch (error) {
    next(error);
  }
});

// GET /api/tenants/current/usage - Get current tenant usage stats
router.get('/current/usage', async (req, res, next) => {
  try {
    if (!req.context) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const usage = await tenantService.getUsage(req.context.tenantId);
    res.json(usage);
  } catch (error) {
    next(error);
  }
});

// GET /api/tenants/current/limits - Check current tenant limits
router.get('/current/limits', async (req, res, next) => {
  try {
    if (!req.context) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const tenant = await tenantService.getById(req.context.tenantId);
    const usage = await tenantService.getUsage(req.context.tenantId);

    if (!tenant) {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'Tenant not found',
        },
      });
    }

    res.json({
      limits: tenant.limits,
      usage: {
        agents: usage.agentsCount,
        users: usage.usersCount,
        executions: usage.executionsThisMonth,
      },
    });
  } catch (error) {
    next(error);
  }
});

// PUT /api/tenants/current - Update current tenant (admin only)
router.put(
  '/current',
  requireRole('OWNER', 'ADMIN'),
  validateBody(UpdateTenantSchema),
  async (req, res, next) => {
    try {
      if (!req.context) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const tenant = await tenantService.update(req.context.tenantId, req.body);

      if (!tenant) {
        return res.status(404).json({
          error: {
            code: 'NOT_FOUND',
            message: 'Tenant not found',
          },
        });
      }

      res.json(tenant);
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/tenants - List all tenants (super admin only - for future use)
router.get('/', async (req, res, next) => {
  try {
    // In production, this would require super admin role
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 20;

    const result = await tenantService.list(page, pageSize);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// GET /api/tenants/:id - Get tenant by ID
router.get('/:id', validateParams(IdParamSchema), async (req, res, next) => {
  try {
    if (!req.context) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Only allow accessing own tenant (or super admin in future)
    if (req.params.id !== req.context.tenantId) {
      return res.status(403).json({
        error: {
          code: 'FORBIDDEN',
          message: 'Cannot access other tenant data',
        },
      });
    }

    const tenant = await tenantService.getById(req.params.id);

    if (!tenant) {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'Tenant not found',
        },
      });
    }

    res.json(tenant);
  } catch (error) {
    next(error);
  }
});

// GET /api/tenants/:id/usage - Get tenant usage (backward compatibility)
router.get('/:id/usage', validateParams(IdParamSchema), async (req, res, next) => {
  try {
    if (!req.context) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Only allow accessing own tenant
    if (req.params.id !== req.context.tenantId) {
      return res.status(403).json({
        error: {
          code: 'FORBIDDEN',
          message: 'Cannot access other tenant data',
        },
      });
    }

    const usage = await tenantService.getUsage(req.params.id);
    res.json(usage);
  } catch (error) {
    next(error);
  }
});

export { router as tenantRoutes };
