import React, { useState } from 'react';
import {
  Users,
  UserPlus,
  ShieldCheck,
  Trophy,
  Mail,
  CheckCircle2,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { useTenant } from '../context/TenantContext';
import { useAuth } from '../context/AuthContext';
import { useHabits } from '../context/HabitContext';

export const TeamView: React.FC<{ onOpenNewOrg: () => void; setCurrentView: (v: string) => void }> = ({
  onOpenNewOrg,
  setCurrentView,
}) => {
  const { activeTenant, isOrganization, inviteMember } = useTenant();
  const { userProfile } = useAuth();
  const { completions } = useHabits();

  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'admin' | 'member'>('member');
  const [invitedSuccess, setInvitedSuccess] = useState(false);

  const teamCompletionsTotal = completions.filter((c) => c.completed).length + 42;
  const challengeTarget = 100;
  const challengePct = Math.min(100, Math.round((teamCompletionsTotal / challengeTarget) * 100));

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail) return;

    await inviteMember(inviteEmail, inviteRole);
    setInvitedSuccess(true);
    setTimeout(() => {
      setInvitedSuccess(false);
      setInviteModalOpen(false);
      setInviteEmail('');
    }, 2000);
  };

  // If currently on a personal workspace, show organization workspace CTA
  if (!isOrganization) {
    return (
      <div className="bg-white dark:bg-slate-900 p-8 sm:p-12 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm text-center max-w-2xl mx-auto space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 flex items-center justify-center mx-auto">
          <Users className="w-8 h-8" />
        </div>

        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">
            Team & Organization Workspaces
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 max-w-md mx-auto">
            You are currently in your private <strong>Personal Workspace</strong>. Create an Organization Workspace to track shared habits, invite teammates, run team challenges, and build accountability.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left">
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
            <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200">Shared Habits</h3>
            <p className="text-[11px] text-slate-400 mt-1">Track company-wide fitness or focus routines together.</p>
          </div>
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
            <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200">Team Challenges</h3>
            <p className="text-[11px] text-slate-400 mt-1">Gamified leaderboards with shared targets.</p>
          </div>
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
            <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200">Role Permissions</h3>
            <p className="text-[11px] text-slate-400 mt-1">Manage Owners, Admins, and Members seamlessly.</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
          <button
            onClick={onOpenNewOrg}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/30 flex items-center justify-center gap-2"
          >
            Create Organization Workspace <ArrowRight className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setCurrentView('pricing')}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 text-slate-700 dark:text-slate-300 text-xs font-semibold"
          >
            View Team Plan (₹499/mo)
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Team Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">
              {activeTenant?.name || 'Team Workspace'}
            </h1>
            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300">
              Organization
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Collaborative team accountability, member roles, and shared habit challenges.
          </p>
        </div>

        <button
          onClick={() => setInviteModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm shadow-indigo-600/30"
        >
          <UserPlus className="w-4 h-4" /> Invite Teammate
        </button>
      </div>

      {/* Team Challenge Banner */}
      <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 p-6 rounded-2xl text-white shadow-md shadow-orange-500/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-200" />
            <h2 className="text-base font-bold">Monthly Team Milestone Challenge</h2>
          </div>
          <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-white/20">
            {challengePct}% Completed
          </span>
        </div>

        <p className="text-xs text-amber-100 mt-1">
          Target: Complete 100 habits across all team members this month to unlock the Team Gold Trophy.
        </p>

        <div className="w-full bg-black/20 rounded-full h-3 mt-4 overflow-hidden">
          <div
            className="bg-white h-full rounded-full transition-all duration-500"
            style={{ width: `${challengePct}%` }}
          />
        </div>

        <div className="flex justify-between items-center text-[11px] text-amber-100 mt-2 font-medium">
          <span>{teamCompletionsTotal} Habits Completed</span>
          <span>Target: {challengeTarget}</span>
        </div>
      </div>

      {/* Team Roster */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">Active Members (3)</h2>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {/* Owner (Current User) */}
          <div className="p-4 sm:px-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center">
                {userProfile?.displayName?.[0] || 'O'}
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  {userProfile?.displayName} (You)
                  <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300">
                    Owner
                  </span>
                </div>
                <div className="text-[11px] text-slate-400">{userProfile?.email}</div>
              </div>
            </div>
            <span className="text-xs text-emerald-600 font-semibold">Active</span>
          </div>

          {/* Sample Teammates */}
          <div className="p-4 sm:px-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-cyan-600 text-white font-bold text-xs flex items-center justify-center">
                P
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  Priya Sharma
                  <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
                    Admin
                  </span>
                </div>
                <div className="text-[11px] text-slate-400">priya@acmecorp.io</div>
              </div>
            </div>
            <span className="text-xs text-slate-500">18 check-ins</span>
          </div>

          <div className="p-4 sm:px-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center">
                R
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  Rahul Mehta
                  <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                    Member
                  </span>
                </div>
                <div className="text-[11px] text-slate-400">rahul@acmecorp.io</div>
              </div>
            </div>
            <span className="text-xs text-slate-500">24 check-ins</span>
          </div>
        </div>
      </div>

      {/* Invite Member Modal */}
      {inviteModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Invite Member to {activeTenant?.name || 'Workspace'}
            </h2>
            <p className="text-xs text-slate-400 mt-1 mb-4">
              An invitation email will be generated and delivered via Resend.
            </p>

            {invitedSuccess ? (
              <div className="p-4 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                Invitation sent successfully!
              </div>
            ) : (
              <form onSubmit={handleSendInvite} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Teammate Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="teammate@company.com"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Workspace Role
                  </label>
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value as any)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                  >
                    <option value="member">Member (Can track and view shared habits)</option>
                    <option value="admin">Admin (Can manage habits & invite members)</option>
                  </select>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setInviteModalOpen(false)}
                    className="px-4 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-100 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-sm"
                  >
                    Send Invitation
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
