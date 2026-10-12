import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { TenantProvider, useTenant } from './context/TenantContext';
import { HabitProvider } from './context/HabitContext';
import { Navbar } from './components/Navbar';
import { LandingPage } from './components/LandingPage';
import { DashboardView } from './components/DashboardView';
import { HabitManagementView } from './components/HabitManagementView';
import { CalendarView } from './components/CalendarView';
import { AnalyticsView } from './components/AnalyticsView';
import { TeamView } from './components/TeamView';
import { PricingView } from './components/PricingView';
import { AiCoachView } from './components/AiCoachView';
import { AdminView } from './components/AdminView';
import { HabitModal } from './components/HabitModal';
import { AuthModal } from './components/AuthModal';
import { SettingsModal } from './components/SettingsModal';
import { NewOrgModal } from './components/NewOrgModal';
import { OnboardingModal } from './components/OnboardingModal';
import { Habit } from './types';

const MainApp: React.FC = () => {
  const { userProfile, loading: authLoading, loginAsDemoUser } = useAuth();
  const { activeTenant, loading: tenantLoading } = useTenant();

  const [currentView, setCurrentView] = useState<string>('dashboard');
  const [habitModalOpen, setHabitModalOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [newOrgModalOpen, setNewOrgModalOpen] = useState(false);
  const [onboardingOpen, setOnboardingOpen] = useState(false);

  // If user is logged in for first time, trigger onboarding modal
  useEffect(() => {
    if (userProfile && !localStorage.getItem('habitflow_onboarded')) {
      setOnboardingOpen(true);
    }
  }, [userProfile]);

  // Loading skeleton during auth boot
  if (authLoading || (userProfile && tenantLoading)) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 rounded-2xl bg-indigo-600 animate-spin flex items-center justify-center text-white font-bold text-lg shadow-xl shadow-indigo-600/30">
          HF
        </div>
        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-4 animate-pulse">
          Connecting to HabitFlow Cloud Firestore & Multi-Tenant Workspaces...
        </p>
      </div>
    );
  }

  // If not logged in and not on pricing page, render Landing page
  const showLanding = !userProfile && currentView !== 'pricing' && currentView !== 'login';

  return (
    <div className="min-h-screen bg-slate-50/70 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col transition-colors">
      <Navbar
        currentView={currentView}
        setCurrentView={setCurrentView}
        onOpenNewHabit={() => {
          setEditingHabit(null);
          setHabitModalOpen(true);
        }}
        onOpenAiCoach={() => setCurrentView('ai-coach')}
        onOpenSettings={() => setSettingsModalOpen(true)}
        onOpenNewOrg={() => setNewOrgModalOpen(true)}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {showLanding ? (
          <LandingPage
            onGetStarted={() => setAuthModalOpen(true)}
            onExplorePricing={() => setCurrentView('pricing')}
            onDemoLogin={loginAsDemoUser}
          />
        ) : currentView === 'pricing' ? (
          <PricingView />
        ) : currentView === 'habits' ? (
          <HabitManagementView
            onOpenNewHabit={() => {
              setEditingHabit(null);
              setHabitModalOpen(true);
            }}
            onEditHabit={(h) => {
              setEditingHabit(h);
              setHabitModalOpen(true);
            }}
            setCurrentView={setCurrentView}
          />
        ) : currentView === 'calendar' ? (
          <CalendarView />
        ) : currentView === 'analytics' ? (
          <AnalyticsView />
        ) : currentView === 'team' ? (
          <TeamView
            onOpenNewOrg={() => setNewOrgModalOpen(true)}
            setCurrentView={setCurrentView}
          />
        ) : currentView === 'ai-coach' ? (
          <AiCoachView setCurrentView={setCurrentView} />
        ) : currentView === 'admin' ? (
          <AdminView />
        ) : (
          <DashboardView
            onOpenNewHabit={() => {
              setEditingHabit(null);
              setHabitModalOpen(true);
            }}
            onOpenAiCoach={() => setCurrentView('ai-coach')}
            setCurrentView={setCurrentView}
          />
        )}
      </main>

      {/* Modals */}
      <HabitModal
        isOpen={habitModalOpen}
        onClose={() => {
          setHabitModalOpen(false);
          setEditingHabit(null);
        }}
        editingHabit={editingHabit}
      />

      <AuthModal
        isOpen={authModalOpen || currentView === 'login'}
        onClose={() => {
          setAuthModalOpen(false);
          if (currentView === 'login') setCurrentView('dashboard');
        }}
      />

      <SettingsModal
        isOpen={settingsModalOpen}
        onClose={() => setSettingsModalOpen(false)}
      />

      <NewOrgModal
        isOpen={newOrgModalOpen}
        onClose={() => setNewOrgModalOpen(false)}
      />

      <OnboardingModal
        isOpen={onboardingOpen}
        onComplete={() => setOnboardingOpen(false)}
      />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <TenantProvider>
        <HabitProvider>
          <MainApp />
        </HabitProvider>
      </TenantProvider>
    </AuthProvider>
  );
}
