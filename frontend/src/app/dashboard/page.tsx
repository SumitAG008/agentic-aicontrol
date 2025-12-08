"use client";

import { Header } from "@/components/layout/header";
import { MetricCard } from "@/components/dashboard/metric-card";
import { AgentStatusGrid } from "@/components/dashboard/agent-status-grid";
import { ActivityFeed } from "@/components/dashboard/activity-feed";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { mockAgents, mockActivity, mockDashboardMetrics } from "@/lib/mock-data";
import { Bot, Zap, CheckCircle, Clock } from "lucide-react";
import { formatDuration } from "@/lib/utils";

export default function DashboardPage() {
  return (
    <div className="min-h-screen">
      <Header
        title="Mission Control"
        subtitle="Monitor and manage your AI agents"
      />

      <div className="p-6 space-y-6">
        {/* Welcome Banner */}
        <div className="glass rounded-xl p-6 bg-gradient-to-r from-blue-500/10 to-violet-500/10 border-blue-500/20">
          <h2 className="text-2xl font-bold text-white">
            Welcome back to AI Control Room
          </h2>
          <p className="mt-2 text-slate-400">
            Your agents have processed{" "}
            <span className="text-blue-400 font-semibold">
              {mockDashboardMetrics.runsToday} tasks
            </span>{" "}
            today with a{" "}
            <span className="text-emerald-400 font-semibold">
              {mockDashboardMetrics.successRate}% success rate
            </span>
            .
          </p>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            title="Active Agents"
            value={mockDashboardMetrics.activeAgents}
            change={mockDashboardMetrics.activeAgentsTrend}
            icon={Bot}
            color="blue"
          />
          <MetricCard
            title="Runs Today"
            value={mockDashboardMetrics.runsToday}
            change={mockDashboardMetrics.runsTodayTrend}
            icon={Zap}
            color="violet"
          />
          <MetricCard
            title="Success Rate"
            value={`${mockDashboardMetrics.successRate}%`}
            change={mockDashboardMetrics.successRateTrend}
            icon={CheckCircle}
            color="emerald"
          />
          <MetricCard
            title="Avg. Execution"
            value={formatDuration(mockDashboardMetrics.avgExecutionTime)}
            change={mockDashboardMetrics.avgExecutionTimeTrend}
            icon={Clock}
            color="amber"
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Agent Status Grid - Takes 2 columns */}
          <div className="lg:col-span-2">
            <AgentStatusGrid agents={mockAgents} />
          </div>

          {/* Activity Feed + Quick Actions - Takes 1 column */}
          <div className="space-y-6">
            <QuickActions />
            <ActivityFeed items={mockActivity} />
          </div>
        </div>
      </div>
    </div>
  );
}
