import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  className?: string;
}

export function Card({ children, className = '', ...rest }: CardProps) {
  return (
    <div
      className={`rounded-xl bg-white dark:bg-gray-800 shadow-xl backdrop-blur-sm border border-gray-200 dark:border-gray-700 ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`p-4 border-b border-gray-200 dark:border-gray-700 ${className}`}>{children}</div>;
}

export function CardTitle({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <h2 className={`text-xl font-semibold text-gray-900 dark:text-gray-100 ${className}`}>{children}</h2>;
}

export function CardContent({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`p-4 ${className}`}>{children}</div>;
}
