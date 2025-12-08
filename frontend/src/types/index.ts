// Core entity types for AI Control Room

export type AgentStatus = 'idle' | 'running' | 'paused' | 'error' | 'terminated';

export interface Agent {
  id: string;
  name: string;
  description: string;
  avatar: string;
  domainPackId: string | null;
  tenantId: string;
  status: AgentStatus;
  configuration: {
    model: string;
    temperature: number;
    maxTokens: number;
    systemPrompt: string;
    tools: string[];
    memory: 'none' | 'short-term' | 'long-term';
    autonomyLevel: 'supervised' | 'semi-autonomous' | 'autonomous';
  };
  metrics: {
    totalRuns: number;
    successRate: number;
    avgExecutionTime: number;
    lastRunAt: Date | null;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface DomainPack {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  category: 'hr-crm' | 'healthcare' | 'life-sciences' | 'finance' | 'legal' | 'custom';
  agentCount: number;
  version: string;
  status: 'active' | 'beta' | 'deprecated';
}

export interface Tool {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  category: 'communication' | 'data' | 'analytics' | 'integration' | 'custom';
  provider: string;
  status: 'active' | 'inactive' | 'deprecated';
  isConnected: boolean;
}

export interface AgentRun {
  id: string;
  agentId: string;
  agentName: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  trigger: 'manual' | 'scheduled' | 'webhook' | 'event';
  duration: number | null;
  tokensUsed: number;
  createdAt: Date;
}

export interface ActivityItem {
  id: string;
  type: 'run_started' | 'run_completed' | 'run_failed' | 'agent_created' | 'tool_connected' | 'alert';
  message: string;
  timestamp: Date;
  agentId?: string;
  agentName?: string;
}

export interface DashboardMetrics {
  activeAgents: number;
  runsToday: number;
  successRate: number;
  avgExecutionTime: number;
  activeAgentsTrend: number;
  runsTodayTrend: number;
  successRateTrend: number;
  avgExecutionTimeTrend: number;
}
