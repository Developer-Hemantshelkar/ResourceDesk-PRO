'use client';

import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Calendar, User, MapPin } from "lucide-react";

export function ActiveAllocationsTable() {
  const queryClient = useQueryClient();

  const { data: allocations, isLoading, error } = useQuery<any[]>({
    queryKey: ["active-allocations"],
    queryFn: async () => {
      const res = await fetch("/api/operations/allocations");
      if (!res.ok) throw new Error("Failed to load active allocations");
      const json = await res.json();
      return json.data;
    },
    staleTime: 60_000,
  });

  const releaseMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/operations/allocations/${id}/release`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Release failed");
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success("Resource successfully released and returned to available pool");
      queryClient.invalidateQueries({ queryKey: ["active-allocations"] });
      queryClient.invalidateQueries({ queryKey: ["operations-summary"] });
      queryClient.invalidateQueries({ queryKey: ["resources"] });
    },
    onError: (err: any) => toast.error(err.message ?? "Error releasing resource"),
  });

  if (isLoading) return (
    <div className="p-8 text-center text-slate-400">
      Loading active allocations...
    </div>
  );

  if (error) return (
    <div className="p-8 text-center text-rose-500">
      {(error as Error).message}
    </div>
  );

  if (!allocations || allocations.length === 0) return (
    <div className="p-12 text-center border border-dashed border-slate-800 rounded-2xl bg-slate-900/20 text-slate-400">
      No resources are currently checked out.
    </div>
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {allocations.map((allocation) => {
        const req = allocation.bookingRequest;
        const res = allocation.resource;
        const usr = req?.user;

        return (
          <div key={allocation.id} className="bg-slate-900/60 backdrop-blur-md rounded-2xl border border-slate-800 p-6 flex flex-col justify-between hover:border-slate-700 transition-all">
            <div>
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-bold text-white">{res.name}</h3>
                  {res.location && (
                    <span className="text-xs text-slate-400 flex items-center gap-1 mt-1">
                      <MapPin className="h-3 w-3" />
                      {res.location.name}
                    </span>
                  )}
                </div>
                <span className="bg-indigo-950/80 text-indigo-400 border border-indigo-500/20 text-[10px] font-bold px-2 py-1 rounded-full uppercase">
                  Allocated
                </span>
              </div>
              
              <div className="space-y-3 mt-4 bg-slate-950/50 p-4 rounded-xl border border-slate-800">
                <div className="flex items-center gap-3">
                  <User className="h-4 w-4 text-slate-500" />
                  <div>
                    <p className="text-sm font-medium text-slate-200">{usr?.name || 'Unknown User'}</p>
                    <p className="text-xs text-slate-500">{usr?.email}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-slate-500" />
                  <div>
                    <p className="text-xs text-slate-400">
                      Started: <span className="text-slate-300">{new Date(req?.startTime).toLocaleString()}</span>
                    </p>
                    <p className="text-xs text-slate-400">
                      Ends: <span className="text-slate-300">{new Date(req?.endTime).toLocaleString()}</span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-6">
              <Button
                onClick={() => releaseMutation.mutate(String(allocation.id))}
                disabled={releaseMutation.isPending}
                className="w-full bg-slate-800 hover:bg-emerald-600 text-white cursor-pointer transition-colors border border-slate-700 hover:border-emerald-500"
              >
                {releaseMutation.isPending ? 'Releasing...' : 'Release & Return Resource'}
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
