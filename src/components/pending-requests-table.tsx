'use client';

// src/components/pending-requests-table.tsx
import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import { CalendarIcon, CheckCircle2, XCircle } from "lucide-react";
import { AllocationModal } from "./allocation-modal";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Type for a pending booking request (includes requester & resource data)
interface PendingRequest {
  id: number;
  resource: { id: number; name: string };
  user: { id: number; name: string; email: string };
  startTime: string; // ISO string
  endTime: string;   // ISO string
  createdAt: string;
}

export function PendingRequestsTable() {
  const queryClient = useQueryClient();
  const [selectedRequestId, setSelectedRequestId] = React.useState<string | null>(null);

  const { data: pending, isLoading, error } = useQuery<PendingRequest[]>({
    queryKey: ["pending-requests"],
    queryFn: async () => {
      const res = await fetch("/api/operations/booking-requests/pending");
      if (!res.ok) throw new Error("Failed to load pending requests");
      return res.json();
    },
    staleTime: 60_000,
  });

  const denyMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/operations/booking-requests/${id}/deny`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Deny failed");
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success("Request denied");
      queryClient.invalidateQueries({ queryKey: ["pending-requests"] });
    },
    onError: (err: any) => toast.error(err.message ?? "Error"),
  });

  if (isLoading) return <p className="text-gray-600">Loading pending requests…</p>;
  if (error) return <p className="text-red-500">{(error as Error).message}</p>;
  if (!pending || pending.length === 0)
    return <p className="text-gray-600">No pending booking requests at the moment.</p>;

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2">
        Pending Booking Requests
      </h2>
      <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/50 backdrop-blur-md shadow-2xl">
        <table className="w-full table-auto text-sm">
          <thead className="bg-slate-950/80 border-b border-slate-800">
            <tr>
              <th className="px-6 py-4 text-left font-semibold text-slate-300">ID</th>
              <th className="px-6 py-4 text-left font-semibold text-slate-300">Resource</th>
              <th className="px-6 py-4 text-left font-semibold text-slate-300">Requester</th>
              <th className="px-6 py-4 text-left font-semibold text-slate-300">Schedule</th>
              <th className="px-6 py-4 text-center font-semibold text-slate-300">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {pending.map((req) => (
              <tr key={req.id} className="hover:bg-slate-800/50 transition-colors group">
                <td className="px-6 py-4 font-mono text-xs text-slate-500">#{req.id}</td>
                <td className="px-6 py-4 font-medium text-white">{req.resource.name}</td>
                <td className="px-6 py-4">
                  <div className="text-slate-200">{req.user.name || 'Unknown User'}</div>
                  <div className="text-xs text-slate-500">{req.user.email}</div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-slate-300">{new Date(req.startTime).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</div>
                  <div className="text-xs text-slate-500">to {new Date(req.endTime).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</div>
                </td>
                <td className="px-6 py-4 text-center space-x-2">
                  <Button
                    size="sm"
                    onClick={() => setSelectedRequestId(String(req.id))}
                    className="bg-emerald-600/10 text-emerald-400 hover:bg-emerald-600 hover:text-white border border-emerald-500/20 cursor-pointer shadow-sm transition"
                  >
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => denyMutation.mutate(String(req.id))}
                    disabled={denyMutation.isPending}
                    className="bg-rose-600/10 text-rose-400 hover:bg-rose-600 hover:text-white border border-rose-500/20 cursor-pointer shadow-sm transition"
                  >
                    Deny
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Allocation Modal */}
      {selectedRequestId && (
        <AllocationModal
          requestId={selectedRequestId}
          onClose={() => setSelectedRequestId(null)}
          onSuccess={() => queryClient.invalidateQueries({ queryKey: ["pending-requests"] })}
        />
      )}
    </div>
  );
}
