import { Sidebar } from "@/components/layout/sidebar";

export default function AgentsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-950">
      <Sidebar />
      <main className="pl-64">{children}</main>
    </div>
  );
}
