'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer 
} from 'recharts';
import { 
  Activity, MapPin, Folder, Layers, Calendar, Plus, Edit, Trash2, 
  Check, X, Loader2, AlertCircle, ShieldAlert, LogOut
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'react-hot-toast';
import { useSession, signOut } from 'next-auth/react';

type TabType = 'overview' | 'resources' | 'locations' | 'categories' | 'bookings' | 'audit logs';

export default function AdminConsole() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const queryClient = useQueryClient();

  // Dialog & Form States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'create' | 'edit'>('create');
  const [targetType, setTargetType] = useState<'resource' | 'location' | 'category' | null>(null);
  
  // Selected Item for Editing/Deleting
  const [selectedItem, setSelectedItem] = useState<any>(null);

  // Form Fields
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [description, setDescription] = useState('');
  const [capacity, setCapacity] = useState<number>(1);
  const [locationId, setLocationId] = useState<string>('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [statusVal, setStatusVal] = useState<'AVAILABLE' | 'ALLOCATED' | 'UNDER_MAINTENANCE' | 'INACTIVE'>('AVAILABLE');

  // --- Queries ---
  const { data: summary, isLoading: isSummaryLoading } = useQuery({
    queryKey: ['admin-summary'],
    queryFn: async () => {
      const res = await fetch('/api/analytics/summary');
      if (!res.ok) throw new Error('Failed to load summary');
      return res.json();
    },
  });

  const { data: auditLogs, isLoading: isAuditLoading } = useQuery({
    queryKey: ['admin-audit-logs'],
    queryFn: async () => {
      const res = await fetch('/api/analytics/audit?take=20');
      if (!res.ok) throw new Error('Failed to load audit logs');
      const json = await res.json();
      return json.logs;
    },
  });

  const { data: locations, isLoading: isLocationsLoading } = useQuery({
    queryKey: ['admin-locations'],
    queryFn: async () => {
      const res = await fetch('/api/locations');
      if (!res.ok) throw new Error('Failed to load locations');
      const json = await res.json();
      return json.data;
    },
  });

  const { data: categories, isLoading: isCategoriesLoading } = useQuery({
    queryKey: ['admin-categories'],
    queryFn: async () => {
      const res = await fetch('/api/categories');
      if (!res.ok) throw new Error('Failed to load categories');
      const json = await res.json();
      return json.data;
    },
  });

  const { data: resources, isLoading: isResourcesLoading } = useQuery({
    queryKey: ['admin-resources'],
    queryFn: async () => {
      const res = await fetch('/api/resources');
      if (!res.ok) throw new Error('Failed to load resources');
      const json = await res.json();
      return json.data;
    },
  });

  const { data: bookings, isLoading: isBookingsLoading } = useQuery({
    queryKey: ['admin-bookings'],
    queryFn: async () => {
      const res = await fetch('/api/admin/bookings');
      if (!res.ok) throw new Error('Failed to load bookings');
      const json = await res.json();
      return json.data;
    },
  });

  // --- Mutations ---
  const createMutation = useMutation({
    mutationFn: async ({ type, payload }: { type: string; payload: any }) => {
      const res = await fetch(`/api/${type}s`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Operation failed');
      return data;
    },
    onSuccess: (_, variables) => {
      toast.success(`${variables.type} created successfully!`);
      queryClient.invalidateQueries({ queryKey: [`admin-${variables.type}s`] });
      queryClient.invalidateQueries({ queryKey: ['admin-summary'] });
      closeFormModal();
    },
    onError: (err: any) => toast.error(err.message),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ type, id, payload }: { type: string; id: number; payload: any }) => {
      const res = await fetch(`/api/${type}s/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Operation failed');
      return data;
    },
    onSuccess: (_, variables) => {
      toast.success(`${variables.type} updated successfully!`);
      queryClient.invalidateQueries({ queryKey: [`admin-${variables.type}s`] });
      queryClient.invalidateQueries({ queryKey: ['admin-summary'] });
      closeFormModal();
    },
    onError: (err: any) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async ({ type, id }: { type: string; id: number }) => {
      const res = await fetch(`/api/${type}s/${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Operation failed');
      return data;
    },
    onSuccess: (_, variables) => {
      toast.success(`${variables.type} deleted successfully!`);
      queryClient.invalidateQueries({ queryKey: [`admin-${variables.type}s`] });
      queryClient.invalidateQueries({ queryKey: ['admin-summary'] });
    },
    onError: (err: any) => toast.error(err.message),
  });

  const bookingStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const res = await fetch(`/api/admin/bookings/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Operation failed');
      return data;
    },
    onSuccess: () => {
      toast.success('Booking status updated successfully!');
      queryClient.invalidateQueries({ queryKey: ['admin-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['admin-summary'] });
      queryClient.invalidateQueries({ queryKey: ['admin-resources'] });
    },
    onError: (err: any) => toast.error(err.message),
  });

  const deleteBookingMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/admin/bookings/${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to delete booking');
      return data;
    },
    onSuccess: () => {
      toast.success('Booking deleted and resource released!');
      queryClient.invalidateQueries({ queryKey: ['admin-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['admin-summary'] });
      queryClient.invalidateQueries({ queryKey: ['admin-resources'] });
    },
    onError: (err: any) => toast.error(err.message),
  });

  // --- Form Modal Helpers ---
  const openCreateModal = (type: 'resource' | 'location' | 'category') => {
    setModalType('create');
    setTargetType(type);
    setSelectedItem(null);
    setName('');
    setAddress('');
    setDescription('');
    setCapacity(1);
    setLocationId('');
    setCategoryId('');
    setStatusVal('AVAILABLE');
    setIsModalOpen(true);
  };

  const openEditModal = (type: 'resource' | 'location' | 'category', item: any) => {
    setModalType('edit');
    setTargetType(type);
    setSelectedItem(item);
    setName(item.name || '');
    setAddress(item.address || '');
    setDescription(item.description || '');
    setCapacity(item.capacity || 1);
    setLocationId(item.locationId?.toString() || '');
    setCategoryId(item.categoryId?.toString() || '');
    setStatusVal(item.status || 'AVAILABLE');
    setIsModalOpen(true);
  };

  const closeFormModal = () => {
    setIsModalOpen(false);
    setTargetType(null);
    setSelectedItem(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Name is required');
      return;
    }

    if (!targetType) return;

    if (modalType === 'create') {
      const payload: any = { name };
      if (targetType === 'location') payload.address = address;
      if (targetType === 'category') payload.description = description;
      if (targetType === 'resource') {
        payload.description = description;
        payload.capacity = Number(capacity);
        if (locationId) payload.locationId = Number(locationId);
        if (categoryId) payload.categoryId = Number(categoryId);
      }
      createMutation.mutate({ type: targetType, payload });
    } else {
      const payload: any = { name };
      if (targetType === 'location') payload.address = address;
      if (targetType === 'category') payload.description = description;
      if (targetType === 'resource') {
        payload.description = description;
        payload.capacity = Number(capacity);
        payload.locationId = locationId ? Number(locationId) : null;
        payload.categoryId = categoryId ? Number(categoryId) : null;
        payload.status = statusVal;
      }
      updateMutation.mutate({ type: targetType, id: selectedItem.id, payload });
    }
  };

  const handleDelete = (type: 'resource' | 'location' | 'category', id: number) => {
    if (confirm(`Are you sure you want to delete this ${type}?`)) {
      deleteMutation.mutate({ type, id });
    }
  };

  return (
    <div className="p-8 space-y-8 bg-slate-950/20 min-h-screen">
      
      {/* Top Banner */}
      <header className="flex justify-between items-center pb-6 border-b border-slate-900">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Admin Console</h1>
          <p className="text-sm text-slate-400 mt-1">
            Welcome back, {session?.user?.name || 'System Administrator'} • Manage resources, categories, locations, and bookings.
          </p>
        </div>
        <Button
          onClick={() => signOut({ callbackUrl: '/login' })}
          variant="outline"
          className="border-slate-800 hover:bg-slate-900 hover:text-white text-slate-300 font-medium px-4 py-2 cursor-pointer rounded-xl flex items-center gap-2"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </Button>
      </header>

      {/* Tabs Switcher */}
      <div className="flex border-b border-slate-900 overflow-x-auto gap-2">
        {(['overview', 'resources', 'locations', 'categories', 'bookings', 'audit logs'] as TabType[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`py-3 px-6 text-sm font-semibold border-b-2 capitalize transition-all duration-300 whitespace-nowrap cursor-pointer ${
              activeTab === tab
                ? 'border-indigo-500 text-white bg-indigo-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-800'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Panels */}
      <div className="space-y-6">
        
        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-8 animate-fadeIn">
            {isSummaryLoading ? (
              <div className="p-8 text-center text-slate-400 flex items-center justify-center gap-2">
                <Loader2 className="animate-spin h-5 w-5 text-indigo-500" />
                Loading analytics summary...
              </div>
            ) : summary ? (
              <>
                {/* Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  <Card className="bg-slate-900/50 border-slate-800 shadow-xl backdrop-blur-md">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Bookings</CardTitle>
                      <Activity className="h-4 w-4 text-indigo-400" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-extrabold text-white">{summary.totalBookings}</div>
                    </CardContent>
                  </Card>
                  <Card className="bg-slate-900/50 border-slate-800 shadow-xl backdrop-blur-md">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Approvals</CardTitle>
                      <Check className="h-4 w-4 text-emerald-400" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-extrabold text-white">{summary.approvals}</div>
                    </CardContent>
                  </Card>
                  <Card className="bg-slate-900/50 border-slate-800 shadow-xl backdrop-blur-md">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Denials</CardTitle>
                      <X className="h-4 w-4 text-rose-400" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-extrabold text-white">{summary.denials}</div>
                    </CardContent>
                  </Card>
                  <Card className="bg-slate-900/50 border-slate-800 shadow-xl backdrop-blur-md">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Allocations</CardTitle>
                      <Layers className="h-4 w-4 text-cyan-400" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-extrabold text-white">{summary.totalAllocations}</div>
                    </CardContent>
                  </Card>
                </div>

                {/* Daily Activity Chart */}
                <Card className="bg-slate-900/40 border-slate-800 shadow-xl backdrop-blur-md">
                  <CardHeader>
                    <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
                      <Activity className="h-5 w-5 text-indigo-400" />
                      Daily Booking Request Activity (last 30 days)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="w-full h-80 pt-4">
                      {summary.daily && summary.daily.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={summary.daily}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                            <XAxis 
                              dataKey="day" 
                              stroke="#64748b" 
                              tickFormatter={(d) => new Date(d).toLocaleDateString([], { month: 'short', day: 'numeric' })} 
                            />
                            <YAxis stroke="#64748b" allowDecimals={false} />
                            <Tooltip 
                              contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f8fafc' }}
                              labelFormatter={(d) => new Date(d).toLocaleDateString([], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} 
                            />
                            <Line type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={3} activeDot={{ r: 8 }} name="Bookings" />
                          </LineChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="h-full flex items-center justify-center text-slate-500 text-sm">
                          No booking activity recorded in the past 30 days.
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Recent Audit Log */}
                <Card className="bg-slate-900/40 border-slate-800 shadow-xl backdrop-blur-md">
                  <CardHeader>
                    <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
                      <ShieldAlert className="h-5 w-5 text-indigo-400" />
                      Recent Access & Audit Logs
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {isAuditLoading ? (
                      <div className="text-center text-slate-400 py-6">Loading logs...</div>
                    ) : auditLogs && auditLogs.length > 0 ? (
                      <div className="overflow-x-auto rounded-xl border border-slate-800/60">
                        <Table>
                          <TableHeader>
                            <TableRow className="border-slate-800 hover:bg-slate-900/80">
                              <TableHead className="w-16">ID</TableHead>
                              <TableHead>Action</TableHead>
                              <TableHead>Entity</TableHead>
                              <TableHead>User ID</TableHead>
                              <TableHead>Timestamp</TableHead>
                              <TableHead>Details</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {auditLogs.map((log: any) => (
                              <TableRow key={log.id} className="border-slate-800 hover:bg-slate-900/30 text-slate-300">
                                <TableCell className="font-mono text-xs">{log.id}</TableCell>
                                <TableCell>
                                  <span className="text-xs px-2 py-0.5 bg-indigo-950 text-indigo-300 border border-indigo-500/20 rounded-full font-semibold uppercase">
                                    {log.action.replace('_', ' ')}
                                  </span>
                                </TableCell>
                                <TableCell className="text-sm">
                                  {log.entityType ? `${log.entityType} #${log.entityId}` : '-'}
                                </TableCell>
                                <TableCell className="text-sm">{log.performedByUserId}</TableCell>
                                <TableCell className="text-sm">
                                  {new Date(log.timestamp).toLocaleString()}
                                </TableCell>
                                <TableCell className="font-mono text-xs max-w-xs truncate text-slate-400">
                                  {log.details ? log.details : '-'}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    ) : (
                      <div className="text-center text-slate-500 py-12">No audit logs found.</div>
                    )}
                  </CardContent>
                </Card>
              </>
            ) : (
              <div className="text-center py-12 text-slate-400">No analytics data available.</div>
            )}
          </div>
        )}

        {/* TAB 2: RESOURCES */}
        {activeTab === 'resources' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-white">System Resources</h2>
                <p className="text-xs text-slate-400 mt-1">Manage physical resources, spaces, capacities, and availability.</p>
              </div>
              <Button onClick={() => openCreateModal('resource')} className="bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-2 cursor-pointer rounded-xl font-semibold">
                <Plus className="h-4 w-4" />
                Add Resource
              </Button>
            </div>

            {isResourcesLoading ? (
              <div className="text-center text-slate-400 py-8">Loading resources...</div>
            ) : resources && resources.length > 0 ? (
              <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/10 shadow-lg">
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-800">
                      <TableHead>ID</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Capacity</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {resources.map((res: any) => (
                      <TableRow key={res.id} className="border-slate-800 hover:bg-slate-900/30 text-slate-300">
                        <TableCell className="font-mono text-xs">{res.id}</TableCell>
                        <TableCell className="font-semibold text-white">{res.name}</TableCell>
                        <TableCell className="text-sm max-w-xs truncate text-slate-400">{res.description || '-'}</TableCell>
                        <TableCell className="text-sm font-semibold">{res.capacity ?? 'N/A'}</TableCell>
                        <TableCell className="text-sm">
                          {res.location ? (
                            <span className="flex items-center gap-1 text-slate-300">
                              <MapPin className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
                              {res.location.name}
                            </span>
                          ) : (
                            <span className="text-slate-500 italic">None</span>
                          )}
                        </TableCell>
                        <TableCell className="text-sm">
                          {res.category ? (
                            <span className="flex items-center gap-1 text-slate-300">
                              <Folder className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
                              {res.category.name}
                            </span>
                          ) : (
                            <span className="text-slate-500 italic">None</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase border ${
                            res.status === 'AVAILABLE'
                              ? 'bg-emerald-950/40 text-emerald-400 border-emerald-500/20'
                              : res.status === 'ALLOCATED'
                              ? 'bg-blue-950/40 text-blue-400 border-blue-500/20'
                              : 'bg-amber-950/40 text-amber-400 border-amber-500/20'
                          }`}>
                            {res.status}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button size="sm" variant="outline" onClick={() => openEditModal('resource', res)} className="hover:bg-slate-800 text-slate-300 hover:text-white cursor-pointer rounded-lg">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => handleDelete('resource', res.id)} className="hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 cursor-pointer rounded-lg" disabled={deleteMutation.isPending}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center text-slate-500 py-12">No resources configured. Click "Add Resource" to create one.</div>
            )}
          </div>
        )}

        {/* TAB 3: LOCATIONS */}
        {activeTab === 'locations' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-white">System Locations</h2>
                <p className="text-xs text-slate-400 mt-1">Manage physical locations and building complexes.</p>
              </div>
              <Button onClick={() => openCreateModal('location')} className="bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-2 cursor-pointer rounded-xl font-semibold">
                <Plus className="h-4 w-4" />
                Add Location
              </Button>
            </div>

            {isLocationsLoading ? (
              <div className="text-center text-slate-400 py-8">Loading locations...</div>
            ) : locations && locations.length > 0 ? (
              <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/10 shadow-lg max-w-4xl">
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-800">
                      <TableHead className="w-24">ID</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Address</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {locations.map((loc: any) => (
                      <TableRow key={loc.id} className="border-slate-800 hover:bg-slate-900/30 text-slate-300">
                        <TableCell className="font-mono text-xs">{loc.id}</TableCell>
                        <TableCell className="font-semibold text-white">{loc.name}</TableCell>
                        <TableCell className="text-sm text-slate-400">{loc.address || 'No address provided'}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button size="sm" variant="outline" onClick={() => openEditModal('location', loc)} className="hover:bg-slate-800 text-slate-300 hover:text-white cursor-pointer rounded-lg">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => handleDelete('location', loc.id)} className="hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 cursor-pointer rounded-lg" disabled={deleteMutation.isPending}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center text-slate-500 py-12">No locations configured. Click "Add Location" to create one.</div>
            )}
          </div>
        )}

        {/* TAB 4: CATEGORIES */}
        {activeTab === 'categories' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-white">Resource Categories</h2>
                <p className="text-xs text-slate-400 mt-1">Manage categories to organize inventory rooms or hardware equipment.</p>
              </div>
              <Button onClick={() => openCreateModal('category')} className="bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-2 cursor-pointer rounded-xl font-semibold">
                <Plus className="h-4 w-4" />
                Add Category
              </Button>
            </div>

            {isCategoriesLoading ? (
              <div className="text-center text-slate-400 py-8">Loading categories...</div>
            ) : categories && categories.length > 0 ? (
              <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/10 shadow-lg max-w-4xl">
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-800">
                      <TableHead className="w-24">ID</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {categories.map((cat: any) => (
                      <TableRow key={cat.id} className="border-slate-800 hover:bg-slate-900/30 text-slate-300">
                        <TableCell className="font-mono text-xs">{cat.id}</TableCell>
                        <TableCell className="font-semibold text-white">{cat.name}</TableCell>
                        <TableCell className="text-sm text-slate-400">{cat.description || 'No description provided'}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button size="sm" variant="outline" onClick={() => openEditModal('category', cat)} className="hover:bg-slate-800 text-slate-300 hover:text-white cursor-pointer rounded-lg">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => handleDelete('category', cat.id)} className="hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 cursor-pointer rounded-lg" disabled={deleteMutation.isPending}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center text-slate-500 py-12">No categories configured. Click "Add Category" to create one.</div>
            )}
          </div>
        )}

        {/* TAB 5: BOOKINGS */}
        {activeTab === 'bookings' && (
          <div className="space-y-6 animate-fadeIn">
            <div>
              <h2 className="text-xl font-bold text-white">All System Bookings</h2>
              <p className="text-xs text-slate-400 mt-1">Review, approve, deny, release or delete all scheduling activities across the platform.</p>
            </div>

            {isBookingsLoading ? (
              <div className="text-center text-slate-400 py-8">Loading bookings...</div>
            ) : bookings && bookings.length > 0 ? (
              <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/10 shadow-lg">
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-800">
                      <TableHead>ID</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Resource</TableHead>
                      <TableHead>Start Time</TableHead>
                      <TableHead>End Time</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-center">Quick Action</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bookings.map((booking: any) => (
                      <TableRow key={booking.id} className="border-slate-800 hover:bg-slate-900/30 text-slate-300">
                        <TableCell className="font-mono text-xs">{booking.id}</TableCell>
                        <TableCell>
                          <div className="text-sm font-semibold text-white">{booking.user?.name || 'Unknown User'}</div>
                          <div className="text-xs text-slate-500">{booking.user?.email || '-'}</div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm font-semibold text-slate-200">{booking.resource?.name || 'Unknown Resource'}</div>
                          <div className="text-[10px] text-slate-500">
                            {booking.resource?.location?.name || ''} {booking.resource?.category?.name ? `• ${booking.resource.category.name}` : ''}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">
                          {new Date(booking.startTime).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                        </TableCell>
                        <TableCell className="text-sm">
                          {new Date(booking.endTime).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                        </TableCell>
                        <TableCell>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase border ${
                            booking.status === 'CONFIRMED'
                              ? 'bg-emerald-950/40 text-emerald-400 border-emerald-500/20'
                              : booking.status === 'PENDING'
                              ? 'bg-amber-950/40 text-amber-400 border-amber-500/20'
                              : 'bg-rose-950/40 text-rose-400 border-rose-500/20'
                          }`}>
                            {booking.status}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          {booking.status === 'PENDING' ? (
                            <div className="flex justify-center gap-1.5">
                              <Button
                                size="sm"
                                className="bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer py-1 px-3 rounded-lg text-xs"
                                onClick={() => bookingStatusMutation.mutate({ id: booking.id, status: 'CONFIRMED' })}
                                disabled={bookingStatusMutation.isPending}
                              >
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                className="cursor-pointer py-1 px-3 rounded-lg text-xs"
                                onClick={() => bookingStatusMutation.mutate({ id: booking.id, status: 'CANCELLED' })}
                                disabled={bookingStatusMutation.isPending}
                              >
                                Deny
                              </Button>
                            </div>
                          ) : booking.status === 'CONFIRMED' ? (
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-amber-500/30 hover:bg-amber-950/20 text-amber-400 hover:text-amber-300 py-1 px-3 rounded-lg text-xs cursor-pointer"
                              onClick={() => bookingStatusMutation.mutate({ id: booking.id, status: 'CANCELLED' })}
                              disabled={bookingStatusMutation.isPending}
                            >
                              Release / Cancel
                            </Button>
                          ) : (
                            <span className="text-xs text-slate-500 italic">No Action</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              if (confirm('Are you sure you want to permanently delete this booking request record?')) {
                                deleteBookingMutation.mutate(booking.id);
                              }
                            }}
                            className="hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 cursor-pointer rounded-lg"
                            disabled={deleteBookingMutation.isPending}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center text-slate-500 py-12">No booking records found in the system.</div>
            )}
          </div>
        )}

      </div>

      {/* CREATE/EDIT MODAL */}
      {isModalOpen && targetType && (
        <Dialog open={true} onOpenChange={(open: boolean) => !open && closeFormModal()}>
          <DialogContent className="sm:max-w-md bg-slate-900 border border-slate-800 text-slate-100">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-white capitalize">
                {modalType} {targetType}
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-5 pt-4">
              
              {/* Name Field */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Name</label>
                <input
                  type="text"
                  required
                  placeholder={`Enter ${targetType} name`}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                />
              </div>

              {/* Location Address */}
              {targetType === 'location' && (
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Address</label>
                  <input
                    type="text"
                    placeholder="Enter physical address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                  />
                </div>
              )}

              {/* Category/Resource Description */}
              {(targetType === 'category' || targetType === 'resource') && (
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Description</label>
                  <textarea
                    placeholder="Enter short description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition resize-none"
                  />
                </div>
              )}

              {/* Resource Capacity */}
              {targetType === 'resource' && (
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Capacity</label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={capacity}
                    onChange={(e) => setCapacity(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                  />
                </div>
              )}

              {/* Resource Location Dropdown */}
              {targetType === 'resource' && (
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Location</label>
                  <Select onValueChange={setLocationId} value={locationId}>
                    <SelectTrigger className="w-full bg-slate-950 border-slate-800 text-slate-100 focus:ring-indigo-500">
                      <SelectValue placeholder="Assign a location (optional)" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-950 border-slate-800 text-slate-100">
                      <SelectItem value="none" className="focus:bg-indigo-900 focus:text-white">None</SelectItem>
                      {locations?.map((l: any) => (
                        <SelectItem key={l.id} value={l.id.toString()} className="focus:bg-indigo-900 focus:text-white">
                          {l.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Resource Category Dropdown */}
              {targetType === 'resource' && (
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Category</label>
                  <Select onValueChange={setCategoryId} value={categoryId}>
                    <SelectTrigger className="w-full bg-slate-950 border-slate-800 text-slate-100 focus:ring-indigo-500">
                      <SelectValue placeholder="Assign a category (optional)" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-950 border-slate-800 text-slate-100">
                      <SelectItem value="none" className="focus:bg-indigo-900 focus:text-white">None</SelectItem>
                      {categories?.map((c: any) => (
                        <SelectItem key={c.id} value={c.id.toString()} className="focus:bg-indigo-900 focus:text-white">
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Resource Status (Edit Only) */}
              {targetType === 'resource' && modalType === 'edit' && (
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</label>
                  <Select 
                    onValueChange={(val: any) => setStatusVal(val)} 
                    value={statusVal}
                  >
                    <SelectTrigger className="w-full bg-slate-950 border-slate-800 text-slate-100 focus:ring-indigo-500">
                      <SelectValue placeholder="Select Status" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-950 border-slate-800 text-slate-100">
                      <SelectItem value="AVAILABLE" className="focus:bg-indigo-900 focus:text-white">AVAILABLE</SelectItem>
                      <SelectItem value="ALLOCATED" className="focus:bg-indigo-900 focus:text-white">ALLOCATED</SelectItem>
                      <SelectItem value="UNDER_MAINTENANCE" className="focus:bg-indigo-900 focus:text-white">UNDER_MAINTENANCE</SelectItem>
                      <SelectItem value="INACTIVE" className="focus:bg-indigo-900 focus:text-white">INACTIVE</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <DialogFooter className="pt-4 border-t border-slate-800 flex justify-between gap-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={closeFormModal} 
                  className="border-slate-800 text-slate-300 hover:bg-slate-900 cursor-pointer rounded-xl font-semibold"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={createMutation.isPending || updateMutation.isPending} 
                  className="bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer transition rounded-xl font-semibold"
                >
                  {createMutation.isPending || updateMutation.isPending ? (
                    <>
                      <Loader2 className="animate-spin h-4 w-4 mr-2" />
                      Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </Button>
              </DialogFooter>

            </form>
          </DialogContent>
        </Dialog>
      )}

    </div>
  );
}
