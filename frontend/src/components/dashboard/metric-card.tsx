"use client";

import { cn } from "@/lib/utils";
import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react";

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon: LucideIcon;
  color: "blue" | "violet" | "emerald" | "amber";
}

const colorClasses = {
  blue: {
    icon: "bg-blue-500/10 text-blue-400",
    glow: "shadow-blue-500/20",
  },
  violet: {
    icon: "bg-violet-500/10 text-violet-400",
    glow: "shadow-violet-500/20",
  },
  emerald: {
    icon: "bg-emerald-500/10 text-emerald-400",
    glow: "shadow-emerald-500/20",
  },
  amber: {
    icon: "bg-amber-500/10 text-amber-400",
    glow: "shadow-amber-500/20",
  },
};

export function MetricCard({ title, value, change, icon: Icon, color }: MetricCardProps) {
  const isPositive = change !== undefined && change >= 0;

  return (
    <div
      className={cn(
        "glass rounded-xl p-6 transition-all duration-300 hover:border-white/20",
        `shadow-lg ${colorClasses[color].glow}`
      )}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-400">{title}</p>
          <p className="mt-2 text-3xl font-bold text-white">{value}</p>
          {change !== undefined && (
            <div className="mt-2 flex items-center gap-1">
              {isPositive ? (
                <TrendingUp className="h-4 w-4 text-emerald-400" />
              ) : (
                <TrendingDown className="h-4 w-4 text-rose-400" />
              )}
              <span
                className={cn(
                  "text-sm font-medium",
                  isPositive ? "text-emerald-400" : "text-rose-400"
                )}
              >
                {isPositive ? "+" : ""}
                {change}%
              </span>
              <span className="text-xs text-slate-500">vs last week</span>
            </div>
          )}
        </div>
        <div className={cn("rounded-lg p-3", colorClasses[color].icon)}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
}
