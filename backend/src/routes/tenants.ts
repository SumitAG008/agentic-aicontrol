import { Router } from 'express';

const router = Router();

const mockTenants = [
  {
    id: 'tenant-1',
    name: 'Acme Corp',
    slug: 'acme-corp',
    plan: 'enterprise',
    settings: {
      theme: 'dark',
      timezone: 'America/New_York',
    },
    limits: {
      maxAgents: 50,
      maxUsers: 100,
      maxExecutionsPerMonth: 100000,
    },
    createdAt: new Date('2024-01-01').toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// GET /api/tenants - List tenants (admin only)
router.get('/', (req, res) => {
  res.json({ tenants: mockTenants, total: mockTenants.length });
});

// GET /api/tenants/:id - Get tenant
router.get('/:id', (req, res) => {
  const tenant = mockTenants.find(t => t.id === req.params.id);
  if (!tenant) {
    return res.status(404).json({ error: 'Tenant not found' });
  }
  res.json(tenant);
});

// PUT /api/tenants/:id - Update tenant
router.put('/:id', (req, res) => {
  const index = mockTenants.findIndex(t => t.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Tenant not found' });
  }
  mockTenants[index] = {
    ...mockTenants[index],
    ...req.body,
    updatedAt: new Date().toISOString(),
  };
  res.json(mockTenants[index]);
});

// GET /api/tenants/:id/usage - Get tenant usage stats
router.get('/:id/usage', (req, res) => {
  const tenant = mockTenants.find(t => t.id === req.params.id);
  if (!tenant) {
    return res.status(404).json({ error: 'Tenant not found' });
  }

  res.json({
    tenantId: req.params.id,
    period: 'current_month',
    usage: {
      agents: 12,
      users: 25,
      executions: 45230,
      tokensUsed: 2340000,
      storageGB: 5.2,
    },
    limits: tenant.limits,
  });
});

export { router as tenantRoutes };
