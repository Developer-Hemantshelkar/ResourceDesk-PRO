'use client';

import React, { useState, useEffect } from 'react';
import { useSession, signIn, getSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Shield, Settings, Users, ArrowLeft, Mail, Lock, User, UserPlus, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'react-hot-toast';

type RoleType = 'ADMIN' | 'OPERATIONS' | 'MEMBER';
type ModeType = 'LOGIN' | 'REGISTER';

export default function EntryPortal() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Active states
  const [selectedRole, setSelectedRole] = useState<RoleType | null>(null);
  const [authMode, setAuthMode] = useState<ModeType>('LOGIN');

  // Input states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Auto-redirect if already logged in
  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      const role = (session.user as any).role;
      if (role === 'ADMIN') {
        router.push('/dashboard/admin');
      } else if (role === 'OPERATIONS') {
        router.push('/dashboard/operations');
      } else {
        router.push('/dashboard/member');
      }
    }
  }, [status, session, router]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-100">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-sm text-slate-400">Loading Portal...</p>
        </div>
      </div>
    );
  }

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || (authMode === 'REGISTER' && !selectedRole)) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsLoading(true);

    try {
      if (authMode === 'REGISTER') {
        // Register API call
        const response = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, name, role: selectedRole }),
        });
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.message || 'Registration failed');
        }
        
        toast.success('Registration successful! Please sign in using your credentials.');
        setAuthMode('LOGIN');
        setPassword(''); // Clear password field for safety
        setIsLoading(false);
        return; // Redirect back to sign in
      }

      // Execute sign-in
      const res = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (res?.error) {
        toast.error(res.error === 'CredentialsSignin' ? 'Invalid email or password' : res.error);
      } else {
        toast.success('Successfully authenticated!');
        const sessionData = await getSession();
        if (sessionData?.user) {
          const role = (sessionData.user as any).role;
          if (role === 'ADMIN') {
            router.push('/dashboard/admin');
          } else if (role === 'OPERATIONS') {
            router.push('/dashboard/operations');
          } else {
            router.push('/dashboard/member');
          }
        } else {
          router.refresh();
        }
      }
    } catch (err: any) {
      toast.error(err.message || 'An error occurred during authentication');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRoleSelect = (role: RoleType) => {
    setSelectedRole(role);
    setAuthMode('LOGIN'); // Default to login mode on select
    setEmail('');
    setPassword('');
    setName('');
  };

  // Get accent theme colors depending on the active role
  const getRoleColors = (role: RoleType) => {
    switch (role) {
      case 'ADMIN':
        return {
          bg: 'bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/20',
          accent: 'indigo-500',
          gradient: 'from-rose-600/20 to-red-600/10 border-rose-500/30',
          btn: 'bg-rose-600 hover:bg-rose-700 text-white',
          text: 'text-rose-400',
        };
      case 'OPERATIONS':
        return {
          bg: 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400 hover:bg-cyan-500/20',
          accent: 'indigo-500',
          gradient: 'from-blue-600/20 to-cyan-600/10 border-blue-500/30',
          btn: 'bg-blue-600 hover:bg-blue-700 text-white',
          text: 'text-blue-400',
        };
      case 'MEMBER':
        return {
          bg: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20',
          accent: 'indigo-500',
          gradient: 'from-emerald-600/20 to-teal-600/10 border-emerald-500/30',
          btn: 'bg-emerald-600 hover:bg-emerald-700 text-white',
          text: 'text-emerald-400',
        };
    }
  };

  const roleColors = selectedRole ? getRoleColors(selectedRole) : null;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 font-sans text-slate-100">
      
      {/* Header */}
      <header className="mb-10 text-center max-w-md">
        <h1 className="text-4xl font-extrabold text-white tracking-tight bg-clip-text bg-gradient-to-r from-white via-indigo-200 to-slate-400">
          Resource Desk Pro
        </h1>
        <p className="text-sm text-slate-400 mt-2">
          Unified space scheduling and management portal
        </p>
      </header>

      {/* Main Switch Layout */}
      {!selectedRole ? (
        <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-3 gap-6 animate-fadeIn">
          
          {/* Admin Card */}
          <div
            onClick={() => handleRoleSelect('ADMIN')}
            className="group cursor-pointer p-8 rounded-2xl bg-white/5 border border-white/10 hover:border-rose-500/30 bg-gradient-to-b hover:from-slate-900 hover:to-rose-950/20 flex flex-col justify-between h-72 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-2xl hover:shadow-rose-950/20"
          >
            <div className="p-4 bg-rose-500/10 group-hover:bg-rose-500/20 rounded-2xl w-fit transition duration-300">
              <Shield className="h-8 w-8 text-rose-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white group-hover:text-rose-400 transition">Admin Console</h2>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Approve requests, manage platform settings, assign roles, and audit access logs.
              </p>
            </div>
          </div>

          {/* Operations Card */}
          <div
            onClick={() => handleRoleSelect('OPERATIONS')}
            className="group cursor-pointer p-8 rounded-2xl bg-white/5 border border-white/10 hover:border-blue-500/30 bg-gradient-to-b hover:from-slate-900 hover:to-blue-950/20 flex flex-col justify-between h-72 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-2xl hover:shadow-blue-950/20"
          >
            <div className="p-4 bg-blue-500/10 group-hover:bg-blue-500/20 rounded-2xl w-fit transition duration-300">
              <Settings className="h-8 w-8 text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white group-hover:text-blue-400 transition">Operations Workspace</h2>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Review request queues, coordinate resource inventory, and release active allocations.
              </p>
            </div>
          </div>

          {/* Member Card */}
          <div
            onClick={() => handleRoleSelect('MEMBER')}
            className="group cursor-pointer p-8 rounded-2xl bg-white/5 border border-white/10 hover:border-emerald-500/30 bg-gradient-to-b hover:from-slate-900 hover:to-emerald-950/20 flex flex-col justify-between h-72 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-2xl hover:shadow-emerald-950/20"
          >
            <div className="p-4 bg-emerald-500/10 group-hover:bg-emerald-500/20 rounded-2xl w-fit transition duration-300">
              <Users className="h-8 w-8 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white group-hover:text-emerald-400 transition">Member Hub</h2>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Browse catalog of physical resources, check booking logs, and request scheduling times.
              </p>
            </div>
          </div>

        </div>
      ) : (
        <div className={`w-full max-w-md bg-slate-900/60 backdrop-blur-xl p-8 rounded-2xl border ${roleColors?.gradient} shadow-2xl animate-scaleIn space-y-6 relative overflow-hidden`}>
          
          {/* Back button */}
          <button
            onClick={() => setSelectedRole(null)}
            className="absolute top-4 left-4 p-1.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition text-slate-400 hover:text-white cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>

          <div className="text-center pt-2">
            <span className={`text-[10px] font-bold tracking-wider uppercase px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20`}>
              {selectedRole} Mode
            </span>
            <h2 className="text-2xl font-bold text-white mt-3">
              {authMode === 'LOGIN' ? 'Welcome Back' : 'Create Account'}
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              {authMode === 'LOGIN'
                ? 'Sign in to access your dashboard'
                : `Sign up to register as ${selectedRole === 'OPERATIONS' ? 'operations staff' : 'member'}`}
            </p>
          </div>

          {/* Form Switch Selector (for Operations & Member/User only) */}
          {selectedRole !== 'ADMIN' && (
            <div className="grid grid-cols-2 p-1 bg-slate-950 rounded-xl border border-slate-800">
              <button
                type="button"
                onClick={() => setAuthMode('LOGIN')}
                className={`py-2 text-xs font-semibold rounded-lg transition duration-200 cursor-pointer ${authMode === 'LOGIN' ? 'bg-white/10 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => setAuthMode('REGISTER')}
                className={`py-2 text-xs font-semibold rounded-lg transition duration-200 cursor-pointer ${authMode === 'REGISTER' ? 'bg-white/10 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
              >
                Sign Up
              </button>
            </div>
          )}

          <form onSubmit={handleAuth} className="space-y-4 pt-2">
            {authMode === 'REGISTER' && (
              <div className="space-y-1">
                <label className="block text-xs font-medium text-slate-400">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-3.5 h-4 w-4 text-slate-500" />
                  <input
                    type="text"
                    required
                    placeholder="Enter your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1">
              <label className="block text-xs font-medium text-slate-400">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3.5 h-4 w-4 text-slate-500" />
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-medium text-slate-400">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3.5 h-4 w-4 text-slate-500" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className={`w-full py-6 rounded-xl font-bold flex justify-center items-center gap-2 cursor-pointer shadow-lg hover:shadow-indigo-500/10 transition-all ${roleColors?.btn}`}
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : authMode === 'LOGIN' ? (
                <>
                  <LogIn className="h-4 w-4" />
                  Sign In to Dashboard
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4" />
                  Create {selectedRole === 'OPERATIONS' ? 'Staff' : 'Member'} Account
                </>
              )}
            </Button>
          </form>

        </div>
      )}

    </div>
  );
}
