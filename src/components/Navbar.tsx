import React, { useState } from 'react';
import {
  CheckCircle2,
  Flame,
  LayoutDashboard,
  Calendar,
  BarChart3,
  Users,
  CreditCard,
  Sparkles,
  ShieldAlert,
  Settings,
  LogOut,
  LogIn,
  ChevronDown,
  Plus,
  Moon,
  Sun,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTenant } from '../context/TenantContext';
import { useHabits } from '../context/HabitContext';

interface NavbarProps {
  currentView: string;
  setCurrentView: (view: string) => void;
  onOpenNewHabit: () => void;
  onOpenAiCoach: () => void;
  onOpenSettings: () => void;
  onOpenNewOrg: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  setCurrentView,
  onOpenNewHabit,
  onOpenAiCoach,
  onOpenSettings,
  onOpenNewOrg,
}) => {
  const { userProfile, signOut, isAdmin, loginAsDemoUser } = useAuth();
  const { activeTenant, userTenants, switchTenant } = useTenant();
  const { habits, completions } = useHabits();
  const [tenantDropdownOpen, setTenantDropdownOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  // Calculate overall current streak across habits
  const totalStreaks = habits.reduce((acc, h) => acc + (h.streak?.current || 0), 0);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle('dark');
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Workspace Selector */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setCurrentView('dashboard')}
              className="flex items-center gap-2 group text-left"
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div className="hidden sm:block">
                <span className="text-lg font-bold bg-gradient-to-r from-indigo-600 to-indigo-900 dark:from-indigo-400 dark:to-cyan-400 bg-clip-text text-transparent">
                  HabitFlow
                </span>
                <span className="block text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                  SaaS Multi-Tenant
                </span>
              </div>
            </button>

            {/* Tenant Workspace Selector */}
            {userProfile && (
              <div className="relative">
                <button
                  onClick={() => setTenantDropdownOpen(!tenantDropdownOpen)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-200 transition-all"
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  <span className="max-w-[130px] truncate">{activeTenant?.name || 'Workspace'}</span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300">
                    {activeTenant?.plan || 'free'}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {tenantDropdownOpen && (
                  <div className="absolute left-0 mt-2 w-64 rounded-xl shadow-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                      Switch Workspace
                    </div>
                    {userTenants.map((t) => (
                      <button
                        key={t.id}
                        onClick={() => {
                          switchTenant(t.id);
                          setTenantDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 flex items-center justify-between text-xs hover:bg-slate-50 dark:hover:bg-slate-800 ${
                          t.id === activeTenant?.id
                            ? 'text-indigo-600 dark:text-indigo-400 font-semibold bg-indigo-50/50 dark:bg-indigo-950/20'
                            : 'text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <div className="truncate">
                          <div>{t.name}</div>
                          <div className="text-[10px] text-slate-400 capitalize">{t.type} · {t.plan} plan</div>
                        </div>
                        {t.id === activeTenant?.id && (
                          <div className="w-1.5 h-1.5 rounded-full bg-indigo-600 dark:bg-indigo-400"></div>
                        )}
                      </button>
                    ))}
                    <div className="border-t border-slate-100 dark:border-slate-800 my-1"></div>
                    <button
                      onClick={() => {
                        setTenantDropdownOpen(false);
                        onOpenNewOrg();
                      }}
                      className="w-full text-left px-3 py-2 text-xs text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/20 font-medium flex items-center gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" /> Create Organization
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Nav Navigation Links */}
          {userProfile ? (
            <nav className="hidden md:flex items-center gap-1">
              <button
                onClick={() => setCurrentView('dashboard')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors ${
                  currentView === 'dashboard'
                    ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <LayoutDashboard className="w-4 h-4" /> Dashboard
              </button>
              <button
                onClick={() => setCurrentView('habits')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors ${
                  currentView === 'habits'
                    ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" /> Habits
              </button>
              <button
                onClick={() => setCurrentView('calendar')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors ${
                  currentView === 'calendar'
                    ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Calendar className="w-4 h-4" /> Calendar
              </button>
              <button
                onClick={() => setCurrentView('analytics')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors ${
                  currentView === 'analytics'
                    ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <BarChart3 className="w-4 h-4" /> Analytics
              </button>
              <button
                onClick={() => setCurrentView('team')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors ${
                  currentView === 'team'
                    ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Users className="w-4 h-4" /> Team
              </button>
              <button
                onClick={() => setCurrentView('pricing')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors ${
                  currentView === 'pricing'
                    ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <CreditCard className="w-4 h-4" /> Plans
              </button>
              {isAdmin && (
                <button
                  onClick={() => setCurrentView('admin')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                    currentView === 'admin'
                      ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400'
                      : 'text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20'
                  }`}
                >
                  <ShieldAlert className="w-4 h-4" /> Admin & Tests
                </button>
              )}
            </nav>
          ) : (
            <div className="hidden sm:flex items-center gap-4">
              <button
                onClick={() => setCurrentView('landing')}
                className="text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              >
                Features
              </button>
              <button
                onClick={() => setCurrentView('pricing')}
                className="text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              >
                Pricing (₹)
              </button>
            </div>
          )}

          {/* Right Action Buttons */}
          <div className="flex items-center gap-2">
            {/* AI Coach Action Button */}
            {userProfile && (
              <button
                onClick={onOpenAiCoach}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-xs font-medium shadow-sm hover:from-purple-700 hover:to-indigo-700 transition-all active:scale-95"
              >
                <Sparkles className="w-3.5 h-3.5 text-yellow-300 animate-pulse" />
                AI Habit Coach
              </button>
            )}

            {/* Quick Add Habit Button */}
            {userProfile && (
              <button
                onClick={onOpenNewHabit}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm shadow-indigo-600/30 transition-all active:scale-95"
              >
                <Plus className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">New Habit</span>
              </button>
            )}

            {/* Theme Toggle */}
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Toggle theme"
            >
              {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* User Profile / Auth State */}
            {userProfile ? (
              <div className="relative">
                <button
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  className="flex items-center gap-2 pl-2 pr-1 py-1 rounded-full border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-cyan-500 text-white font-bold text-xs flex items-center justify-center">
                    {userProfile.displayName?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <ChevronDown className="w-3 h-3 text-slate-400 pr-1" />
                </button>

                {profileDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 rounded-xl shadow-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 py-2 z-50">
                    <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800">
                      <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                        {userProfile.displayName}
                      </p>
                      <p className="text-[11px] text-slate-400 truncate">{userProfile.email}</p>
                    </div>

                    <button
                      onClick={() => {
                        setProfileDropdownOpen(false);
                        onOpenSettings();
                      }}
                      className="w-full text-left px-4 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2"
                    >
                      <Settings className="w-3.5 h-3.5" /> Workspace Settings
                    </button>

                    <button
                      onClick={() => {
                        setProfileDropdownOpen(false);
                        setCurrentView('pricing');
                      }}
                      className="w-full text-left px-4 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2"
                    >
                      <CreditCard className="w-3.5 h-3.5" /> Billing & Invoices
                    </button>

                    <div className="border-t border-slate-100 dark:border-slate-800 my-1"></div>

                    <button
                      onClick={() => {
                        setProfileDropdownOpen(false);
                        signOut();
                      }}
                      className="w-full text-left px-4 py-2 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 flex items-center gap-2"
                    >
                      <LogOut className="w-3.5 h-3.5" /> Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={loginAsDemoUser}
                  className="px-3 py-1.5 rounded-lg border border-indigo-200 dark:border-indigo-800 bg-indigo-50/50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 text-xs font-medium hover:bg-indigo-100"
                >
                  Quick Demo Mode
                </button>
                <button
                  onClick={() => setCurrentView('login')}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold"
                >
                  <LogIn className="w-3.5 h-3.5" /> Sign In
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
