import * as React from "react";

interface CalendarProps {
  selected?: Date;
  onSelect?: (date: Date | null) => void;
  disabled?: boolean;
  mode?: "single";
}

export function Calendar({
  selected,
  onSelect,
  disabled,
}: CalendarProps) {
  // Get date in YYYY-MM-DD format based on local timezone to prevent off-by-one day issues
  const getValue = () => {
    if (!selected) return "";
    const year = selected.getFullYear();
    const month = String(selected.getMonth() + 1).padStart(2, "0");
    const day = String(selected.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (!val) {
      onSelect?.(null);
    } else {
      // Parse local date parts to construct a correct Date object
      const [year, month, day] = val.split("-").map(Number);
      const date = new Date(year, month - 1, day);
      onSelect?.(date);
    }
  };

  return (
    <input
      type="date"
      value={getValue()}
      onChange={handleChange}
      disabled={disabled}
      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
    />
  );
}
