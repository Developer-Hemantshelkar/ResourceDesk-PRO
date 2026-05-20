import React from 'react';
import { SidebarNav } from '@/components/sidebar-nav';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100 font-sans">
      {/* Left Sidebar Navigation */}
      <aside className="w-64 hidden lg:block border-r border-slate-900 bg-slate-900/40 p-5 flex flex-col justify-between shrink-0">
        <div>
          <div className="mb-8 px-2 py-2">
            <h2 className="text-lg font-extrabold text-white tracking-tight">Resource Desk Pro</h2>
            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mt-0.5">Control Center</p>
          </div>
          <SidebarNav />
        </div>
        <div className="px-2 py-2 border-t border-slate-900/60 pt-4">
          <p className="text-[10px] text-slate-600">© 2026 Resource Desk Pro</p>
        </div>
      </aside>
      
      {/* Dashboard Main Panel */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
