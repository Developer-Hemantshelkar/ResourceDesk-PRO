// src/components/allocation-modal.tsx
'use client';

import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const allocationSchema = z.object({
  resourceId: z.string().min(1, "Select a resource"),
  startTime: z.string().refine((val) => !isNaN(Date.parse(val)), { message: "Start time is required" }),
  endTime: z.string().refine((val) => !isNaN(Date.parse(val)), { message: "End time is required" }),
}).refine((data) => {
  const start = new Date(data.startTime).getTime();
  const end = new Date(data.endTime).getTime();
  return end > start;
}, {
  message: "End time must be after start time",
  path: ["endTime"],
});

type AllocationForm = z.infer<typeof allocationSchema>;

interface AllocationModalProps {
  requestId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function AllocationModal({ requestId, onClose, onSuccess }: AllocationModalProps) {
  const queryClient = useQueryClient();

  const { control, handleSubmit, reset } = useForm<AllocationForm>({
    resolver: zodResolver(allocationSchema),
    defaultValues: {
      resourceId: "",
      startTime: "",
      endTime: "",
    },
  });

  // Fetch real available resources
  const { data: resources, isLoading: isResourcesLoading } = useQuery<any[]>({
    queryKey: ['resources'],
    queryFn: async () => {
      const res = await fetch('/api/resources');
      const json = await res.json();
      if (!json.success) throw new Error('Failed to load resources');
      return json.data;
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: AllocationForm) => {
      const res = await fetch(`/api/operations/booking-requests/${requestId}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.message || "Failed to approve request");
      }
      return result;
    },
    onSuccess: () => {
      toast.success("Booking request approved and allocation created");
      queryClient.invalidateQueries({ queryKey: ["operations-summary"] });
      queryClient.invalidateQueries({ queryKey: ["pending-requests"] });
      queryClient.invalidateQueries({ queryKey: ["resources"] });
      reset();
      onSuccess();
      onClose();
    },
    onError: (err: any) => toast.error(err.message ?? "Error"),
  });

  const onSubmit = (data: AllocationForm) => mutation.mutate(data);

  return (
    <Dialog open={true} onOpenChange={(open: boolean) => !open && onClose()}>
      <DialogContent className="sm:max-w-md bg-slate-900 border border-slate-800 text-slate-100">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-white">Allocate Resource</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 pt-4">
          <Controller
            name="resourceId"
            control={control}
            render={({ field, fieldState }) => (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-300">Resource</label>
                <Select onValueChange={field.onChange} value={field.value} disabled={mutation.isPending || isResourcesLoading}>
                  <SelectTrigger className={`w-full bg-slate-950 border-slate-800 text-slate-100 focus:ring-indigo-500 focus:border-indigo-500 ${fieldState.error ? "border-red-500 focus:ring-red-500" : ""}`}>
                    <SelectValue placeholder="Select a resource" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-950 border-slate-800 text-slate-100">
                    {resources?.filter((r) => r.status === 'AVAILABLE').map((r) => (
                      <SelectItem key={r.id} value={r.id.toString()} className="focus:bg-indigo-900 focus:text-white">
                        {r.name}
                      </SelectItem>
                    ))}
                    {(!resources || resources.filter((r) => r.status === 'AVAILABLE').length === 0) && (
                      <div className="px-2 py-1.5 text-sm text-slate-500">No resources available</div>
                    )}
                  </SelectContent>
                </Select>
                {fieldState.error && (
                  <p className="text-xs text-red-400 mt-1">{fieldState.error.message}</p>
                )}
              </div>
            )}
          />

          <Controller
            name="startTime"
            control={control}
            render={({ field, fieldState }) => (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-300">Start Date & Time</label>
                <input
                  type="datetime-local"
                  value={field.value}
                  onChange={field.onChange}
                  disabled={mutation.isPending}
                  className={`w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${fieldState.error ? "border-red-500 focus:ring-red-500" : ""}`}
                />
                {fieldState.error && (
                  <p className="text-xs text-red-400 mt-1">{fieldState.error.message}</p>
                )}
              </div>
            )}
          />

          <Controller
            name="endTime"
            control={control}
            render={({ field, fieldState }) => (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-300">End Date & Time</label>
                <input
                  type="datetime-local"
                  value={field.value}
                  onChange={field.onChange}
                  disabled={mutation.isPending}
                  className={`w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${fieldState.error ? "border-red-500 focus:ring-red-500" : ""}`}
                />
                {fieldState.error && (
                  <p className="text-xs text-red-400 mt-1">{fieldState.error.message}</p>
                )}
              </div>
            )}
          />

          <DialogFooter className="pt-4 border-t border-slate-800 flex justify-between gap-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={mutation.isPending} className="border-slate-800 text-slate-300 hover:bg-slate-900 cursor-pointer">
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending} className="bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer transition">
              {mutation.isPending ? 'Allocating...' : 'Approve & Allocate'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
