"use client";

import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { mockAgents } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import { timeAgo, formatDuration } from "@/lib/utils";
import {
  Bot,
  PlusCircle,
  Play,
  Pause,
  Square,
  AlertCircle,
  MoreVertical,
  Search,
  Filter,
  Grid,
  List,
} from "lucide-react";
import { useState } from "react";
import { AgentStatus } from "@/types";

const statusConfig: Record<AgentStatus, { color: string; bgColor: string; label: string }> = {
  running: { color: "text-emerald-400", bgColor: "bg-emerald-500/10", label: "Running" },
  idle: { color: "text-slate-400", bgColor: "bg-slate-500/10", label: "Idle" },
  paused: { color: "text-amber-400", bgColor: "bg-amber-500/10", label: "Paused" },
  error: { color: "text-rose-400", bgColor: "bg-rose-500/10", label: "Error" },
  terminated: { color: "text-slate-500", bgColor: "bg-slate-700/10", label: "Terminated" },
};

export default function AgentsPage() {
  const [view, setView] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredAgents = mockAgents.filter((agent) =>
    agent.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen">
      <Header title="Agents" subtitle="Manage your AI agents" />

      <div className="p-6 space-y-6">
        {/* Actions Bar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search agents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-9 w-64 rounded-lg border border-slate-700 bg-slate-900 pl-10 pr-4 text-sm text-white placeholder:text-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* Filter */}
            <Button variant="outline" size="sm">
              <Filter className="mr-2 h-4 w-4" />
              Filter
            </Button>
          </div>

          <div className="flex items-center gap-4">
            {/* View Toggle */}
            <div className="flex items-center rounded-lg border border-slate-700 p-1">
              <button
                onClick={() => setView("grid")}
                className={cn(
                  "rounded-md p-1.5 transition-colors",
                  view === "grid" ? "bg-slate-700 text-white" : "text-slate-400 hover:text-white"
                )}
              >
                <Grid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setView("list")}
                className={cn(
                  "rounded-md p-1.5 transition-colors",
                  view === "list" ? "bg-slate-700 text-white" : "text-slate-400 hover:text-white"
                )}
              >
                <List className="h-4 w-4" />
              </button>
            </div>

            {/* New Agent */}
            <Button variant="glow">
              <PlusCircle className="mr-2 h-4 w-4" />
              New Agent
            </Button>
          </div>
        </div>

        {/* Agent Grid */}
        <div className={cn(
          "grid gap-4",
          view === "grid" ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3" : "grid-cols-1"
        )}>
          {filteredAgents.map((agent) => {
            const config = statusConfig[agent.status];

            return (
              <div
                key={agent.id}
                className={cn(
                  "glass rounded-xl p-5 transition-all cursor-pointer hover:border-slate-600",
                  agent.status === "running" && "border-emerald-500/30",
                  agent.status === "error" && "border-rose-500/30"
                )}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "flex h-12 w-12 items-center justify-center rounded-xl",
                        config.bgColor
                      )}
                    >
                      <Bot className={cn("h-6 w-6", config.color)} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white">{agent.name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <div className={cn(
                          "h-2 w-2 rounded-full",
                          agent.status === "running" ? "bg-emerald-500 animate-pulse" :
                          agent.status === "error" ? "bg-rose-500" :
                          agent.status === "paused" ? "bg-amber-500" : "bg-slate-500"
                        )} />
                        <span className={cn("text-xs", config.color)}>{config.label}</span>
                      </div>
                    </div>
                  </div>

                  <button className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors">
                    <MoreVertical className="h-4 w-4" />
                  </button>
                </div>

                <p className="mt-3 text-sm text-slate-400 line-clamp-2">
                  {agent.description}
                </p>

                <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
                  <div className="flex items-center gap-4">
                    <span>{agent.metrics.totalRuns} runs</span>
                    <span>{agent.metrics.successRate}% success</span>
                  </div>
                  <span>
                    {agent.metrics.lastRunAt
                      ? timeAgo(agent.metrics.lastRunAt)
                      : "Never run"}
                  </span>
                </div>

                <div className="mt-4 flex items-center gap-2">
                  {agent.status === "running" ? (
                    <Button size="sm" variant="outline" className="flex-1">
                      <Pause className="mr-2 h-3 w-3" />
                      Pause
                    </Button>
                  ) : agent.status === "error" ? (
                    <Button size="sm" variant="outline" className="flex-1 border-rose-500/30 text-rose-400 hover:bg-rose-500/10">
                      <AlertCircle className="mr-2 h-3 w-3" />
                      View Error
                    </Button>
                  ) : (
                    <Button size="sm" variant="outline" className="flex-1">
                      <Play className="mr-2 h-3 w-3" />
                      Start
                    </Button>
                  )}
                  <Button size="sm" variant="ghost">
                    Configure
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
