import { Router } from 'express';

const router = Router();

const mockRuns = [
  { id: '1', agentId: '1', agentName: 'HR Assistant', status: 'completed', trigger: 'manual', duration: 2340, tokensUsed: 1560, createdAt: new Date().toISOString() },
  { id: '2', agentId: '2', agentName: 'Data Analyst', status: 'running', trigger: 'scheduled', duration: null, tokensUsed: 890, createdAt: new Date().toISOString() },
];

// GET /api/runs - List all runs
router.get('/', (req, res) => {
  const { agentId, status, limit = 50, offset = 0 } = req.query;
  let runs = [...mockRuns];

  if (agentId) {
    runs = runs.filter(r => r.agentId === agentId);
  }
  if (status) {
    runs = runs.filter(r => r.status === status);
  }

  const total = runs.length;
  runs = runs.slice(Number(offset), Number(offset) + Number(limit));

  res.json({ runs, total, limit: Number(limit), offset: Number(offset) });
});

// GET /api/runs/:id - Get single run
router.get('/:id', (req, res) => {
  const run = mockRuns.find(r => r.id === req.params.id);
  if (!run) {
    return res.status(404).json({ error: 'Run not found' });
  }
  res.json(run);
});

// GET /api/runs/:id/steps - Get run execution steps
router.get('/:id/steps', (req, res) => {
  const run = mockRuns.find(r => r.id === req.params.id);
  if (!run) {
    return res.status(404).json({ error: 'Run not found' });
  }

  const steps = [
    { id: '1', sequence: 1, type: 'thought', content: 'Analyzing the request...', timestamp: new Date().toISOString() },
    { id: '2', sequence: 2, type: 'tool_call', content: 'Calling Slack API', toolId: 'slack', timestamp: new Date().toISOString() },
    { id: '3', sequence: 3, type: 'tool_result', content: 'Retrieved 5 messages', timestamp: new Date().toISOString() },
    { id: '4', sequence: 4, type: 'message', content: 'Task completed successfully', timestamp: new Date().toISOString() },
  ];

  res.json({ steps, runId: req.params.id });
});

// POST /api/runs/:id/cancel - Cancel a run
router.post('/:id/cancel', (req, res) => {
  const run = mockRuns.find(r => r.id === req.params.id);
  if (!run) {
    return res.status(404).json({ error: 'Run not found' });
  }
  if (run.status !== 'running' && run.status !== 'pending') {
    return res.status(400).json({ error: 'Can only cancel running or pending runs' });
  }
  run.status = 'cancelled';
  res.json(run);
});

export { router as runRoutes };
