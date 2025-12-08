"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Bot,
  Wrench,
  Package,
  FileText,
  Shield,
  Settings,
  Users,
  Sparkles,
  ChevronDown,
} from "lucide-react";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Agents", href: "/agents", icon: Bot },
  { name: "Agent Builder", href: "/builder", icon: Sparkles },
  { name: "Tools Registry", href: "/tools", icon: Wrench },
  { name: "Domain Packs", href: "/domain-packs", icon: Package },
  { name: "Tenants", href: "/tenants", icon: Users },
  { name: "Logs", href: "/logs", icon: FileText },
  { name: "Security", href: "/security", icon: Shield },
  { name: "Settings", href: "/settings", icon: Settings },
];

const domainPacks = [
  { name: "HR & CRM", slug: "hr-crm", color: "bg-blue-500" },
  { name: "Healthcare", slug: "healthcare", color: "bg-emerald-500" },
  { name: "Life Sciences", slug: "life-sciences", color: "bg-violet-500" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-slate-800 bg-slate-950">
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="flex h-16 items-center gap-2 border-b border-slate-800 px-6">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-violet-500">
            <Bot className="h-5 w-5 text-white" />
          </div>
          <span className="text-lg font-semibold text-white">AI Control</span>
        </div>

        {/* Domain Switcher */}
        <div className="border-b border-slate-800 p-4">
          <button className="flex w-full items-center justify-between rounded-lg bg-slate-900 px-3 py-2 text-sm text-slate-300 hover:bg-slate-800 transition-colors">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-blue-500" />
              <span>All Domains</span>
            </div>
            <ChevronDown className="h-4 w-4" />
          </button>
          <div className="mt-2 space-y-1">
            {domainPacks.map((pack) => (
              <div
                key={pack.slug}
                className="flex items-center gap-2 rounded px-3 py-1 text-xs text-slate-400"
              >
                <div className={cn("h-1.5 w-1.5 rounded-full", pack.color)} />
                <span>{pack.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 overflow-y-auto p-4">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all",
                  isActive
                    ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                    : "text-slate-400 hover:bg-slate-800 hover:text-white"
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="border-t border-slate-800 p-4">
          <div className="flex items-center gap-3 rounded-lg bg-slate-900 px-3 py-2">
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-violet-500 to-blue-500" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">Acme Corp</p>
              <p className="text-xs text-slate-400">Enterprise Plan</p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
