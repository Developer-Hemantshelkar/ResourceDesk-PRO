import * as React from "react";

export function Select({
  value,
  onValueChange,
  disabled,
  children,
}: {
  value?: string;
  onValueChange?: (val: string) => void;
  disabled?: boolean;
  children?: React.ReactNode;
}) {
  const options: { value: string; label: React.ReactNode }[] = [];
  let triggerClassName = "";

  const traverse = (node: React.ReactNode) => {
    React.Children.forEach(node, (child) => {
      if (!React.isValidElement(child)) return;
      
      const element = child as React.ReactElement<any>;
      if (element.type === SelectItem) {
        options.push({
          value: element.props.value,
          label: element.props.children,
        });
      } else if (element.type === SelectTrigger) {
        if (element.props.className) {
          triggerClassName = element.props.className;
        }
      } else if (element.props && element.props.children) {
        traverse(element.props.children);
      }
    });
  };

  traverse(children);

  return (
    <select
      value={value}
      onChange={(e) => onValueChange?.(e.target.value)}
      disabled={disabled}
      className={`w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 ${triggerClassName}`}
    >
      <option value="" disabled>
        Select a resource
      </option>
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {String(opt.label)}
        </option>
      ))}
    </select>
  );
}

export function SelectTrigger({ children, className }: any) {
  return null;
}

export function SelectValue({ placeholder }: any) {
  return null;
}

export function SelectContent({ children }: any) {
  return <>{children}</>;
}

export function SelectItem({ value, children }: any) {
  return null;
}
