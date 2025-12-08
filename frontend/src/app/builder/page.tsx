"use client";

import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Sparkles,
  Send,
  Save,
  Play,
  Rocket,
  MessageSquare,
  Database,
  Mail,
  Github,
  FileText,
  Zap,
} from "lucide-react";
import { useState } from "react";

const toolPalette = [
  { id: "slack", name: "Slack", icon: MessageSquare, color: "bg-purple-500" },
  { id: "database", name: "Database", icon: Database, color: "bg-blue-500" },
  { id: "email", name: "Email", icon: Mail, color: "bg-red-500" },
  { id: "github", name: "GitHub", icon: Github, color: "bg-slate-500" },
  { id: "notion", name: "Notion", icon: FileText, color: "bg-orange-500" },
  { id: "webhook", name: "Webhook", icon: Zap, color: "bg-emerald-500" },
];

export default function BuilderPage() {
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = () => {
    setIsGenerating(true);
    // Simulate generation
    setTimeout(() => setIsGenerating(false), 2000);
  };

  return (
    <div className="min-h-screen">
      <Header title="Agent Builder" subtitle="Create agents with natural language" />

      <div className="p-6 space-y-6">
        {/* NL Input Section */}
        <Card className="border-violet-500/20 bg-gradient-to-r from-violet-500/5 to-blue-500/5">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="h-5 w-5 text-violet-400" />
              <h2 className="text-lg font-semibold text-white">
                Describe Your Agent
              </h2>
            </div>
            <div className="relative">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Create an agent that monitors our Slack workspace for HR questions, looks up answers in our Notion knowledge base, and responds automatically..."
                className="w-full h-32 rounded-xl border border-slate-700 bg-slate-900 p-4 text-white placeholder:text-slate-500 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 resize-none"
              />
              <div className="absolute bottom-4 right-4 flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-slate-400 hover:text-white"
                >
                  Clear
                </Button>
                <Button
                  onClick={handleGenerate}
                  disabled={!prompt || isGenerating}
                  className="bg-gradient-to-r from-violet-500 to-blue-500 hover:from-violet-600 hover:to-blue-600"
                >
                  {isGenerating ? (
                    <>
                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Generate
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Builder Area */}
        <div className="grid grid-cols-12 gap-6">
          {/* Tool Palette */}
          <div className="col-span-2">
            <Card>
              <CardContent className="p-4">
                <h3 className="text-sm font-semibold text-slate-400 mb-4">
                  TOOLS
                </h3>
                <div className="space-y-2">
                  {toolPalette.map((tool) => (
                    <button
                      key={tool.id}
                      className="flex w-full items-center gap-3 rounded-lg p-2 text-slate-300 hover:bg-slate-800 transition-colors"
                      draggable
                    >
                      <div
                        className={`flex h-8 w-8 items-center justify-center rounded-lg ${tool.color}/20`}
                      >
                        <tool.icon className="h-4 w-4 text-white" />
                      </div>
                      <span className="text-sm">{tool.name}</span>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Canvas */}
          <div className="col-span-7">
            <Card className="h-[500px]">
              <CardContent className="h-full p-6 flex items-center justify-center">
                <div className="text-center">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-800">
                    <Sparkles className="h-8 w-8 text-violet-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-white">
                    Visual Workflow Canvas
                  </h3>
                  <p className="mt-2 text-sm text-slate-400 max-w-md">
                    Describe your agent above or drag tools from the palette to
                    build your workflow visually. Connect nodes to define the
                    agent&apos;s behavior.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Config Panel */}
          <div className="col-span-3">
            <Card>
              <CardContent className="p-4 space-y-4">
                <h3 className="text-sm font-semibold text-slate-400">
                  CONFIGURATION
                </h3>

                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-slate-500">Agent Name</label>
                    <input
                      type="text"
                      placeholder="My Agent"
                      className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-blue-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-slate-500">Model</label>
                    <select className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none">
                      <option>Claude 3 Sonnet</option>
                      <option>Claude 3 Opus</option>
                      <option>Claude 3 Haiku</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs text-slate-500">
                      Temperature: 0.7
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      defaultValue="0.7"
                      className="mt-1 w-full"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-slate-500">Memory</label>
                    <select className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none">
                      <option>Long-term</option>
                      <option>Short-term</option>
                      <option>None</option>
                    </select>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-700 space-y-2">
                  <Button variant="outline" className="w-full">
                    <Save className="mr-2 h-4 w-4" />
                    Save Draft
                  </Button>
                  <Button variant="outline" className="w-full">
                    <Play className="mr-2 h-4 w-4" />
                    Test Agent
                  </Button>
                  <Button className="w-full bg-gradient-to-r from-emerald-500 to-blue-500">
                    <Rocket className="mr-2 h-4 w-4" />
                    Deploy Agent
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
