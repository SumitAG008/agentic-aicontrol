"use client";

import { cn } from "@/lib/utils";
import { Agent, AgentStatus } from "@/types";
import { Bot, Play, Pause, AlertCircle, Square } from "lucide-react";

interface AgentStatusGridProps {
  agents: Agent[];
}

const statusConfig: Record<AgentStatus, { color: string; icon: typeof Play; label: string }> = {
  running: { color: "bg-emerald-500", icon: Play, label: "Running" },
  idle: { color: "bg-slate-500", icon: Square, label: "Idle" },
  paused: { color: "bg-amber-500", icon: Pause, label: "Paused" },
  error: { color: "bg-rose-500", icon: AlertCircle, label: "Error" },
  terminated: { color: "bg-slate-700", icon: Square, label: "Terminated" },
};

export function AgentStatusGrid({ agents }: AgentStatusGridProps) {
  return (
    <div className="glass rounded-xl p-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">Agent Status</h3>
        <span className="text-sm text-slate-400">{agents.length} total</span>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {agents.slice(0, 6).map((agent) => {
          const config = statusConfig[agent.status];
          const StatusIcon = config.icon;

          return (
            <div
              key={agent.id}
              className={cn(
                "relative rounded-lg border border-slate-700 bg-slate-800/50 p-4 transition-all hover:border-slate-600 cursor-pointer",
                agent.status === "running" && "border-emerald-500/30"
              )}
            >
              {agent.status === "running" && (
                <div className="absolute right-2 top-2">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                  </span>
                </div>
              )}

              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-lg",
                    agent.status === "running"
                      ? "bg-emerald-500/10"
                      : agent.status === "error"
                      ? "bg-rose-500/10"
                      : "bg-slate-700"
                  )}
                >
                  <Bot
                    className={cn(
                      "h-5 w-5",
                      agent.status === "running"
                        ? "text-emerald-400"
                        : agent.status === "error"
                        ? "text-rose-400"
                        : "text-slate-400"
                    )}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-white">
                    {agent.name}
                  </p>
                  <div className="flex items-center gap-1 mt-1">
                    <div className={cn("h-1.5 w-1.5 rounded-full", config.color)} />
                    <span className="text-xs text-slate-400">{config.label}</span>
                  </div>
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                <span>{agent.metrics.successRate}% success</span>
                <span>{agent.metrics.totalRuns} runs</span>
              </div>
            </div>
          );
        })}
      </div>
      {agents.length > 6 && (
        <button className="mt-4 w-full rounded-lg border border-slate-700 py-2 text-sm text-slate-400 hover:border-slate-600 hover:text-white transition-colors">
          View all {agents.length} agents
        </button>
      )}
    </div>
  );
}
