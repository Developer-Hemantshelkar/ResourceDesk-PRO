'use client';

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import { Send, CalendarClock } from "lucide-react";

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

interface InlineBookingFormProps {
  resources: { id: number; name: string; status: string }[];
}

export function InlineBookingForm({ resources }: InlineBookingFormProps) {
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
      reset();
    },
    onError: (err: any) => {
      toast.error(err.message ?? "Failed to create booking request");
    },
  });

  const onSubmit = (data: BookingRequestForm) => mutation.mutate(data);

  const availableResources = resources.filter((r) => r.status === "AVAILABLE");

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-indigo-100 dark:bg-indigo-500/10 rounded-lg">
          <CalendarClock className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Quick Booking</h2>
          <p className="text-xs text-slate-600 dark:text-slate-500">Request a resource instantly</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 flex-1">
        <Controller
          name="resourceId"
          control={control}
          render={({ field, fieldState }) => (
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Select Resource</label>
              <Select
                onValueChange={field.onChange}
                value={field.value}
                disabled={mutation.isPending || availableResources.length === 0}
              >
                <SelectTrigger className={`w-full bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:ring-indigo-500 h-11 ${fieldState.error ? "border-red-500 focus:ring-red-500" : ""}`}>
                  <SelectValue placeholder={availableResources.length === 0 ? "No resources available" : "Choose from available"} />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100">
                  {availableResources.map((r) => (
                    <SelectItem key={r.id} value={r.id.toString()} className="focus:bg-indigo-50 dark:focus:bg-indigo-900 focus:text-indigo-900 dark:focus:text-white">
                      {r.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {fieldState.error && (
                <p className="text-xs text-red-400 mt-1">{fieldState.error.message}</p>
              )}
            </div>
          )}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <Controller
            name="startTime"
            control={control}
            render={({ field, fieldState }) => (
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Start Time</label>
                <input
                  type="datetime-local"
                  value={field.value}
                  onChange={field.onChange}
                  disabled={mutation.isPending}
                  className={`w-full h-11 rounded-lg bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${fieldState.error ? "border-red-500 focus:ring-red-500" : ""}`}
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
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">End Time</label>
                <input
                  type="datetime-local"
                  value={field.value}
                  onChange={field.onChange}
                  disabled={mutation.isPending}
                  className={`w-full h-11 rounded-lg bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${fieldState.error ? "border-red-500 focus:ring-red-500" : ""}`}
                />
                {fieldState.error && (
                  <p className="text-xs text-red-400 mt-1">{fieldState.error.message}</p>
                )}
              </div>
            )}
          />
        </div>

        <div className="pt-4 mt-auto">
           <Button
             type="submit"
             disabled={mutation.isPending || availableResources.length === 0}
             className="bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer transition w-full h-12 text-base font-medium flex items-center gap-2 shadow-lg shadow-indigo-500/20"
           >
             <Send className="h-4 w-4" />
             {mutation.isPending ? 'Submitting...' : 'Submit Booking Request'}
           </Button>
        </div>
      </form>
    </div>
  );
}
