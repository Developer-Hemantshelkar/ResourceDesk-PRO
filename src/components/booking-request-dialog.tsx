// src/components/booking-request-dialog.tsx
'use client';

import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";

const bookingRequestSchema = z.object({
  resourceId: z.string().min(1, "Select a resource"),
  startTime: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Start time is required",
  }),
  endTime: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "End time is required",
  }),
}).refine((data) => {
  const start = new Date(data.startTime).getTime();
  const end = new Date(data.endTime).getTime();
  return end > start;
}, {
  message: "End time must be after start time",
  path: ["endTime"],
});

type BookingRequestForm = z.infer<typeof bookingRequestSchema>;

interface BookingRequestDialogProps {
  resources: { id: number; name: string; status: string }[];
}

export function BookingRequestDialog({ resources }: BookingRequestDialogProps) {
  const [open, setOpen] = React.useState(false);
  const queryClient = useQueryClient();

  const { control, handleSubmit, reset } = useForm<BookingRequestForm>({
    resolver: zodResolver(bookingRequestSchema),
    defaultValues: {
      resourceId: "",
      startTime: "",
      endTime: "",
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: BookingRequestForm) => {
      const response = await fetch("/api/booking-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Failed to create booking request");
      return result;
    },
    onSuccess: () => {
      toast.success("Booking request submitted successfully!");
      queryClient.invalidateQueries({ queryKey: ["booking-requests"] });
      queryClient.invalidateQueries({ queryKey: ["resources"] });
      setOpen(false);
      reset();
    },
    onError: (err: any) => {
      toast.error(err.message ?? "Failed to create booking request");
    },
  });

  const onSubmit = (data: BookingRequestForm) => mutation.mutate(data);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="default" className="bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer shadow-lg hover:shadow-indigo-500/20 transition-all duration-200">
          New Booking Request
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md bg-slate-900 border border-slate-800 text-slate-100">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-white">Request a Booking</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 pt-4">
          <Controller
            name="resourceId"
            control={control}
            render={({ field, fieldState }) => (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-300">Resource</label>
                <Select
                  onValueChange={field.onChange}
                  value={field.value}
                  disabled={mutation.isPending}
                >
                  <SelectTrigger className={`w-full bg-slate-950 border-slate-800 text-slate-100 focus:ring-indigo-500 focus:border-indigo-500 ${fieldState.error ? "border-red-500 focus:ring-red-500" : ""}`}>
                    <SelectValue placeholder="Select a resource" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-950 border-slate-800 text-slate-100">
                    {resources
                      .filter((r) => r.status === "AVAILABLE")
                      .map((r) => (
                        <SelectItem key={r.id} value={r.id.toString()} className="focus:bg-indigo-900 focus:text-white">
                          {r.name}
                        </SelectItem>
                      ))}
                    {resources.filter((r) => r.status === "AVAILABLE").length === 0 && (
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

          <DialogFooter className="pt-4 border-t border-slate-800">
             <Button
               type="submit"
               disabled={mutation.isPending}
               className="bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer transition w-full sm:w-auto"
             >
               {mutation.isPending ? 'Submitting...' : 'Submit Request'}
             </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
