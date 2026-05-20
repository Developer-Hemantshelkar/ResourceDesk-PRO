'use client';

import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { signOut, useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/theme-toggle';
import { InlineBookingForm } from '@/components/inline-booking-form';
import { LogOut, Calendar, LayoutGrid, CheckCircle2, ShieldAlert, X } from 'lucide-react';
import { toast } from 'react-hot-toast';
// import { ThemeToggle } from '@/components/theme-toggle';

function StatusCard({
  title,
  count,
  icon: Icon,
  gradient,
}: {
  title: string;
  count: number;
  icon: React.ComponentType<any>;
  gradient: string;
}) {
  return (
    <div className={`p-6 rounded-2xl shadow-lg border border-slate-200 dark:border-white/5 bg-white dark:bg-transparent dark:bg-gradient-to-br ${gradient} flex items-center justify-between transition-all duration-300 hover:scale-[1.02]`}>
      <div>
        <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{title}</h3>
        <p className="text-3xl font-extrabold text-slate-900 dark:text-white mt-2">{count}</p>
      </div>
      <div className="p-3 bg-slate-100 dark:bg-white/10 rounded-xl">
        <Icon className="h-6 w-6 text-slate-700 dark:text-white" />
      </div>
    </div>
  );
}

export default function MemberDashboard() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();

  // Fetch resources
  const { data: resources, isLoading: isResourcesLoading } = useQuery<any[]>({
    queryKey: ['resources'],
    queryFn: async () => {
      const res = await fetch('/api/resources');
      const json = await res.json();
      if (!json.success) throw new Error('Failed to load resources');
      return json.data;
    },
  });

  // Fetch booking requests
  const { data: requests, isLoading: isRequestsLoading } = useQuery<any[]>({
    queryKey: ['booking-requests'],
    queryFn: async () => {
      const res = await fetch('/api/booking-requests');
      if (!res.ok) throw new Error('Failed to load booking requests');
      return res.json();
    },
  });

  const cancelMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/booking-requests/${id}/cancel`, { method: 'POST' });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Failed to cancel request');
      return json;
    },
    onSuccess: () => {
      toast.success('Booking request cancelled successfully');
      queryClient.invalidateQueries({ queryKey: ['booking-requests'] });
    },
    onError: (err: any) => {
      toast.error(err.message || 'Cancellation failed');
    }
  });

  // KPI Calculations
  const totalCount = resources?.length ?? 0;
  const availableCount = resources?.filter((r) => r.status === 'AVAILABLE').length ?? 0;
  // NOTE: Active resources are those that are ALLOCATED or IN_USE. Since our system uses AVAILABLE, UNDER_MAINTENANCE, and others.
  const activeCount = resources?.filter((r) => r.status !== 'AVAILABLE' && r.status !== 'UNDER_MAINTENANCE').length ?? 0;
  const maintenanceCount = resources?.filter((r) => r.status === 'UNDER_MAINTENANCE').length ?? 0;

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString([], {
      dateStyle: 'short',
      timeStyle: 'short',
    });
  };

  return (
    <div className="p-8">
      {/* Header */}
      <header className="flex justify-between items-center mb-8 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Welcome back, {session?.user?.name || 'Member'}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Explore available resources and track your request statuses in real-time.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Button
            onClick={() => signOut({ callbackUrl: '/login' })}
            variant="outline"
            className="border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-700 dark:text-slate-300 font-medium px-4 py-2 cursor-pointer rounded-xl flex items-center gap-2"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </Button>
          <ThemeToggle />
        </div>
      </header>

      {/* Status cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatusCard
          title="Total Resources"
          count={totalCount}
          icon={LayoutGrid}
          gradient="from-slate-700/40 to-slate-800/10 border-slate-600/20"
        />
        <StatusCard
          title="Available"
          count={availableCount}
          icon={Calendar}
          gradient="from-indigo-600/20 to-blue-600/10 border-indigo-500/20"
        />
        <StatusCard
          title="Active / In-Use"
          count={activeCount}
          icon={CheckCircle2}
          gradient="from-emerald-600/20 to-teal-600/10 border-emerald-500/20"
        />
        <StatusCard
          title="In Maintenance"
          count={maintenanceCount}
          icon={ShieldAlert}
          gradient="from-rose-600/20 to-red-600/10 border-rose-500/20"
        />
      </div>

      {/* Dynamic Grid Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Resource Catalog */}
        <section className="bg-white/60 dark:bg-slate-900/40 backdrop-blur-md rounded-2xl border border-slate-200 dark:border-slate-800 p-6 flex flex-col shadow-sm dark:shadow-none">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Resource Catalog</h2>
              <p className="text-xs text-slate-500 mt-0.5">Browse available items and spaces</p>
            </div>
          </div>

          {isResourcesLoading ? (
            <p className="text-sm text-slate-500 dark:text-slate-400 py-6">Loading resources...</p>
          ) : resources && resources.length > 0 ? (
            <div className="divide-y divide-slate-100 dark:divide-slate-800/60 overflow-y-auto max-h-[480px] pr-2">
              {resources.map((r) => (
                <div key={r.id} className="py-4 flex justify-between items-start first:pt-0 last:pb-0 hover:bg-slate-50 dark:hover:bg-slate-800/20 px-2 rounded-lg transition-colors">
                  <div>
                    <h4 className="font-semibold text-slate-900 dark:text-white text-sm">{r.name}</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm line-clamp-1">{r.description || 'No description provided'}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-[10px] bg-slate-100 dark:bg-slate-950 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded-full border border-slate-200 dark:border-slate-800">
                        Capacity: {r.capacity || 'N/A'}
                      </span>
                    </div>
                  </div>
                  <div>
                    <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full uppercase tracking-wider ${r.status === 'AVAILABLE'
                        ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20'
                        : r.status === 'UNDER_MAINTENANCE'
                          ? 'bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20'
                          : 'bg-slate-100 dark:bg-slate-950 text-slate-500 border border-slate-200 dark:border-slate-800'
                      }`}>
                      {r.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center text-slate-500 text-sm">No resources found.</div>
          )}
        </section>

        {/* Quick Booking Form */}
        <section className="bg-white/60 dark:bg-slate-900/40 backdrop-blur-md rounded-2xl border border-slate-200 dark:border-slate-800 p-6 flex flex-col shadow-sm dark:shadow-none">
          <InlineBookingForm resources={resources ?? []} />
        </section>

        {/* User's Booking Requests */}
        <section className="bg-white/60 dark:bg-slate-900/40 backdrop-blur-md rounded-2xl border border-slate-200 dark:border-slate-800 p-6 flex flex-col shadow-sm dark:shadow-none">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">My Booking Requests</h2>
            <p className="text-xs text-slate-500 mt-0.5">Track and manage your requests</p>
          </div>

          {isRequestsLoading ? (
            <p className="text-sm text-slate-500 dark:text-slate-400 py-6">Loading request log...</p>
          ) : requests && requests.length > 0 ? (
            <div className="divide-y divide-slate-100 dark:divide-slate-800/60 overflow-y-auto max-h-[480px] mt-4 pr-2">
              {requests.map((req) => (
                <div key={req.id} className="py-4 flex justify-between items-center first:pt-0 last:pb-0 hover:bg-slate-50 dark:hover:bg-slate-800/20 px-2 rounded-lg transition-colors">
                  <div>
                    <h4 className="font-semibold text-slate-900 dark:text-white text-sm">{req.resource?.name || 'Unknown Resource'}</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      {formatDate(req.startTime)} – {formatDate(req.endTime)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                      <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                        req.status === 'CONFIRMED'
                          ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20'
                          : req.status === 'PENDING'
                          ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20'
                          : 'bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20'
                      }`}>
                        {req.status}
                      </span>
                      {req.status === 'PENDING' && (
                        <Button
                          onClick={() => cancelMutation.mutate(req.id)}
                          disabled={cancelMutation.isPending}
                          size="sm"
                          variant="outline"
                          className="h-7 px-2.5 text-rose-500 dark:text-rose-400 hover:text-white hover:bg-rose-600 rounded-full border-rose-200 dark:border-rose-900/50 flex items-center gap-1"
                          title="Cancel Request"
                        >
                          <X className="h-3.5 w-3.5" />
                          <span className="text-xs font-medium">Cancel</span>
                        </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center text-slate-500 text-sm mt-4">
              You haven't requested any resources yet.
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
