import { Router } from 'express';

const router = Router();

const mockTools = [
  { id: '1', name: 'Slack', slug: 'slack', description: 'Team communication', category: 'communication', status: 'active', isConnected: true },
  { id: '2', name: 'Notion', slug: 'notion', description: 'Documentation and wikis', category: 'data', status: 'active', isConnected: true },
  { id: '3', name: 'GitHub', slug: 'github', description: 'Code repository', category: 'integration', status: 'active', isConnected: true },
  { id: '4', name: 'PostgreSQL', slug: 'postgresql', description: 'Database queries', category: 'data', status: 'active', isConnected: false },
];

// GET /api/tools - List all tools
router.get('/', (req, res) => {
  const { category, status } = req.query;
  let tools = [...mockTools];

  if (category) {
    tools = tools.filter(t => t.category === category);
  }
  if (status) {
    tools = tools.filter(t => t.status === status);
  }

  res.json({ tools, total: tools.length });
});

// GET /api/tools/:id - Get single tool
router.get('/:id', (req, res) => {
  const tool = mockTools.find(t => t.id === req.params.id);
  if (!tool) {
    return res.status(404).json({ error: 'Tool not found' });
  }
  res.json(tool);
});

// POST /api/tools/:id/test - Test tool connection
router.post('/:id/test', (req, res) => {
  const tool = mockTools.find(t => t.id === req.params.id);
  if (!tool) {
    return res.status(404).json({ error: 'Tool not found' });
  }
  // Simulate test
  res.json({ success: true, message: 'Connection successful', latency: 45 });
});

// PUT /api/tools/:id/config - Update tool configuration
router.put('/:id/config', (req, res) => {
  const tool = mockTools.find(t => t.id === req.params.id);
  if (!tool) {
    return res.status(404).json({ error: 'Tool not found' });
  }
  // Update config
  res.json({ ...tool, config: req.body });
});

export { router as toolRoutes };
