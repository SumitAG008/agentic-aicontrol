"use client";

import { Button } from "@/components/ui/button";
import { PlusCircle, Play, FileText, Wrench } from "lucide-react";

export function QuickActions() {
  return (
    <div className="glass rounded-xl p-6">
      <h3 className="mb-4 text-lg font-semibold text-white">Quick Actions</h3>
      <div className="grid grid-cols-2 gap-3">
        <Button className="h-auto flex-col gap-2 py-4" variant="outline">
          <PlusCircle className="h-5 w-5 text-blue-400" />
          <span>New Agent</span>
        </Button>
        <Button className="h-auto flex-col gap-2 py-4" variant="outline">
          <Play className="h-5 w-5 text-emerald-400" />
          <span>Run All</span>
        </Button>
        <Button className="h-auto flex-col gap-2 py-4" variant="outline">
          <FileText className="h-5 w-5 text-violet-400" />
          <span>View Logs</span>
        </Button>
        <Button className="h-auto flex-col gap-2 py-4" variant="outline">
          <Wrench className="h-5 w-5 text-amber-400" />
          <span>Add Tool</span>
        </Button>
      </div>
    </div>
  );
}
