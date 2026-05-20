'use client';

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { toast } from "react-hot-toast";
import { PendingRequestsTable } from "@/components/pending-requests-table";
import { ActiveAllocationsTable } from "@/components/active-allocations-table";
import { useSession, signOut } from "next-auth/react";
import { LogOut, LayoutGrid, CalendarRange, Clock, Folder, CheckCircle2 } from "lucide-react";

interface SummaryData {
  totalResources: number;
  pendingRequests: number;
  activeAllocations: number;
}

type TabType = 'overview' | 'pending' | 'allocations';

function StatusCard({ title, count, icon: Icon, gradient }: { title: string; count: number; icon: React.ComponentType<any>; gradient: string }) {
  return (
    <div className={`p-6 rounded-2xl shadow-lg border border-white/5 bg-gradient-to-br ${gradient} flex items-center justify-between transition-all duration-300 hover:scale-[1.02]`}>
      <div>
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{title}</h3>
        <p className="text-3xl font-extrabold text-white mt-2">{count}</p>
      </div>
      <div className="p-3 bg-white/10 rounded-xl">
        <Icon className="h-6 w-6 text-white" />
      </div>
    </div>
  );
}

export default function OperationsDashboard() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = React.useState<TabType>('overview');

  const { data: summary, isLoading, error } = useQuery<SummaryData>({
    queryKey: ["operations-summary"],
    queryFn: async () => {
      const res = await fetch("/api/operations/summary");
      if (!res.ok) throw new Error("Failed to load summary");
      return res.json();
    },
    refetchOnWindowFocus: false,
  });

  if (isLoading) return <div className="p-12 text-center text-slate-400">Loading operations dashboard...</div>;
  if (error) return <div className="p-12 text-center text-rose-500">Error loading data.</div>;

  return (
    <div className="p-8 space-y-8 bg-slate-950/20 min-h-screen">
      
      {/* Header */}
      <header className="flex justify-between items-center pb-6 border-b border-slate-900">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Operations Console</h1>
          <p className="text-sm text-slate-400 mt-1">
            Welcome back, {session?.user?.name || 'Operations Manager'} • Coordinate resources and manage live allocations.
          </p>
        </div>
        <Button
          onClick={() => signOut({ callbackUrl: '/login' })}
          variant="outline"
          className="border-slate-800 hover:bg-slate-900 hover:text-white text-slate-300 font-medium px-4 py-2 cursor-pointer rounded-xl flex items-center gap-2"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </Button>
      </header>

      {/* Tabs Switcher */}
      <div className="flex border-b border-slate-900 overflow-x-auto gap-2">
        {(['overview', 'pending', 'allocations'] as TabType[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`py-3 px-6 text-sm font-semibold border-b-2 capitalize transition-all duration-300 whitespace-nowrap cursor-pointer ${
              activeTab === tab
                ? 'border-indigo-500 text-white bg-indigo-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-800'
            }`}
          >
            {tab === 'allocations' ? 'Active Allocations' : tab === 'pending' ? 'Pending Requests' : tab}
          </button>
        ))}
      </div>

      {/* Tab Panels */}
      <div className="space-y-6">
        
        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="animate-fadeIn">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
              <StatusCard
                title="Total Resources"
                count={summary?.totalResources ?? 0}
                icon={LayoutGrid}
                gradient="from-indigo-600/20 to-blue-600/10 border-indigo-500/20"
              />
              <StatusCard
                title="Pending Requests"
                count={summary?.pendingRequests ?? 0}
                icon={Clock}
                gradient="from-amber-600/20 to-yellow-600/10 border-amber-500/20"
              />
              <StatusCard
                title="Active Allocations"
                count={summary?.activeAllocations ?? 0}
                icon={CheckCircle2}
                gradient="from-emerald-600/20 to-teal-600/10 border-emerald-500/20"
              />
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-10">
              <div className="bg-slate-900/40 backdrop-blur-md rounded-2xl border border-slate-900 p-8 text-center flex flex-col items-center justify-center">
                <Clock className="h-12 w-12 text-amber-500/50 mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">Needs Attention</h3>
                <p className="text-sm text-slate-400 mb-6">You have {summary?.pendingRequests ?? 0} booking requests awaiting approval.</p>
                <Button onClick={() => setActiveTab('pending')} className="bg-amber-600 hover:bg-amber-700 text-white border-none cursor-pointer">
                  Review Pending Requests
                </Button>
              </div>

              <div className="bg-slate-900/40 backdrop-blur-md rounded-2xl border border-slate-900 p-8 text-center flex flex-col items-center justify-center">
                <CheckCircle2 className="h-12 w-12 text-emerald-500/50 mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">Live Tracking</h3>
                <p className="text-sm text-slate-400 mb-6">There are {summary?.activeAllocations ?? 0} resources currently checked out.</p>
                <Button onClick={() => setActiveTab('allocations')} className="bg-emerald-600 hover:bg-emerald-700 text-white border-none cursor-pointer">
                  Manage Allocations
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: PENDING REQUESTS */}
        {activeTab === 'pending' && (
          <div className="animate-fadeIn">
            <PendingRequestsTable />
          </div>
        )}

        {/* TAB 3: ACTIVE ALLOCATIONS */}
        {activeTab === 'allocations' && (
          <div className="animate-fadeIn">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <CalendarRange className="h-5 w-5 text-emerald-400" />
                Checked Out Resources
              </h2>
            </div>
            <ActiveAllocationsTable />
          </div>
        )}

      </div>
    </div>
  );
}
