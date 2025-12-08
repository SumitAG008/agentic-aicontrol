import { Router } from 'express';

const router = Router();

// Mock data for development
const mockAgents = [
  {
    id: '1',
    name: 'HR Assistant',
    description: 'Handles employee inquiries and HR documentation',
    status: 'running',
    domainPackId: 'hr-crm',
    tenantId: 'tenant-1',
    configuration: {
      model: 'claude-3-sonnet',
      temperature: 0.7,
      maxTokens: 4096,
    },
    metrics: {
      totalRuns: 1247,
      successRate: 98.5,
      avgExecutionTime: 2340,
      lastRunAt: new Date().toISOString(),
    },
    createdAt: new Date('2024-01-15').toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// GET /api/agents - List all agents
router.get('/', (req, res) => {
  const { status, domainPackId } = req.query;
  let agents = [...mockAgents];

  if (status) {
    agents = agents.filter(a => a.status === status);
  }
  if (domainPackId) {
    agents = agents.filter(a => a.domainPackId === domainPackId);
  }

  res.json({ agents, total: agents.length });
});

// GET /api/agents/:id - Get single agent
router.get('/:id', (req, res) => {
  const agent = mockAgents.find(a => a.id === req.params.id);
  if (!agent) {
    return res.status(404).json({ error: 'Agent not found' });
  }
  res.json(agent);
});

// POST /api/agents - Create agent
router.post('/', (req, res) => {
  const newAgent = {
    id: String(mockAgents.length + 1),
    ...req.body,
    status: 'idle',
    metrics: {
      totalRuns: 0,
      successRate: 0,
      avgExecutionTime: 0,
      lastRunAt: null,
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  mockAgents.push(newAgent);
  res.status(201).json(newAgent);
});

// PUT /api/agents/:id - Update agent
router.put('/:id', (req, res) => {
  const index = mockAgents.findIndex(a => a.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Agent not found' });
  }
  mockAgents[index] = {
    ...mockAgents[index],
    ...req.body,
    updatedAt: new Date().toISOString(),
  };
  res.json(mockAgents[index]);
});

// DELETE /api/agents/:id - Delete agent
router.delete('/:id', (req, res) => {
  const index = mockAgents.findIndex(a => a.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Agent not found' });
  }
  mockAgents.splice(index, 1);
  res.status(204).send();
});

// POST /api/agents/:id/start - Start agent
router.post('/:id/start', (req, res) => {
  const agent = mockAgents.find(a => a.id === req.params.id);
  if (!agent) {
    return res.status(404).json({ error: 'Agent not found' });
  }
  agent.status = 'running';
  agent.updatedAt = new Date().toISOString();
  res.json(agent);
});

// POST /api/agents/:id/stop - Stop agent
router.post('/:id/stop', (req, res) => {
  const agent = mockAgents.find(a => a.id === req.params.id);
  if (!agent) {
    return res.status(404).json({ error: 'Agent not found' });
  }
  agent.status = 'idle';
  agent.updatedAt = new Date().toISOString();
  res.json(agent);
});

export { router as agentRoutes };
