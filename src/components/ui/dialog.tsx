import React from 'react';

interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}

export function Dialog({ open, onOpenChange, children }: DialogProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => onOpenChange(false)}>
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 max-w-lg w-full mx-4 relative" onClick={e => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}

export function DialogTrigger({ children, asChild = false }: { children: React.ReactNode; asChild?: boolean }) {
  return <>{children}</>;
}

export function DialogContent({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={className}>{children}</div>;
}

export function DialogHeader({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`mb-4 ${className}`}>{children}</div>;
}

export function DialogTitle({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <h2 className={`text-xl font-semibold text-gray-900 dark:text-gray-100 ${className}`}>{children}</h2>;
}

export function DialogFooter({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`flex justify-end space-x-2 mt-6 ${className}`}>{children}</div>;
}

export function DialogClose({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors" onClick={onClick}>
      ✕
    </button>
  );
}
