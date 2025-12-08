"use client";

import { cn } from "@/lib/utils";
import { timeAgo } from "@/lib/utils";
import { ActivityItem } from "@/types";
import {
  Play,
  CheckCircle,
  XCircle,
  PlusCircle,
  Link,
  AlertTriangle,
} from "lucide-react";

interface ActivityFeedProps {
  items: ActivityItem[];
}

const activityConfig = {
  run_started: { icon: Play, color: "text-blue-400", bg: "bg-blue-500/10" },
  run_completed: { icon: CheckCircle, color: "text-emerald-400", bg: "bg-emerald-500/10" },
  run_failed: { icon: XCircle, color: "text-rose-400", bg: "bg-rose-500/10" },
  agent_created: { icon: PlusCircle, color: "text-violet-400", bg: "bg-violet-500/10" },
  tool_connected: { icon: Link, color: "text-amber-400", bg: "bg-amber-500/10" },
  alert: { icon: AlertTriangle, color: "text-amber-400", bg: "bg-amber-500/10" },
};

export function ActivityFeed({ items }: ActivityFeedProps) {
  return (
    <div className="glass rounded-xl p-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">Recent Activity</h3>
        <button className="text-sm text-blue-400 hover:text-blue-300 transition-colors">
          View all
        </button>
      </div>
      <div className="space-y-4">
        {items.map((item) => {
          const config = activityConfig[item.type];
          const Icon = config.icon;

          return (
            <div
              key={item.id}
              className="flex items-start gap-3 rounded-lg p-2 transition-colors hover:bg-slate-800/50"
            >
              <div className={cn("rounded-lg p-2", config.bg)}>
                <Icon className={cn("h-4 w-4", config.color)} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-slate-300">{item.message}</p>
                <p className="mt-1 text-xs text-slate-500">
                  {timeAgo(item.timestamp)}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
