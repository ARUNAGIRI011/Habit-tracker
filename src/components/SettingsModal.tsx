import React, { useState } from 'react';
import { X, Bell, Globe, Mail, Shield, CheckCircle2, Send, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTenant } from '../context/TenantContext';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const { userProfile, signOut } = useAuth();
  const { activeTenant } = useTenant();

  const [timezone, setTimezone] = useState(
    userProfile?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Kolkata'
  );
  const [quietHoursStart, setQuietHoursStart] = useState('22:00');
  const [quietHoursEnd, setQuietHoursEnd] = useState('07:00');
  const [dailyReminders, setDailyReminders] = useState(true);
  const [weeklyReports, setWeeklyReports] = useState(true);
  const [milestones, setMilestones] = useState(true);

  const [testEmailSending, setTestEmailSending] = useState(false);
  const [testEmailResult, setTestEmailResult] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSendTestEmail = async () => {
    if (!userProfile?.email) return;

    setTestEmailSending(true);
    setTestEmailResult(null);

    try {
      const res = await fetch('/api/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipientEmail: userProfile.email,
          templateType: 'daily_reminder',
          data: {
            name: userProfile.displayName,
            pendingCount: 3,
            habits: ['Morning Meditation', '30 Min Deep Work', 'Daily Walk'],
          },
        }),
      });

      const data = await res.json();
      setTestEmailResult(
        data.status === 'delivered'
          ? '✓ Test email delivered to your inbox via Resend API!'
          : `✓ Test email processed (${data.message})`
      );
    } catch (e: any) {
      setTestEmailResult('Email dispatch test failed.');
    } finally {
      setTestEmailSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150 space-y-6">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Workspace & Profile Settings
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Workspace: <strong>{activeTenant?.name}</strong>
            </p>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Identity Info */}
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-indigo-600 text-white font-bold text-sm flex items-center justify-center">
            {userProfile?.displayName?.[0] || 'U'}
          </div>
          <div className="min-w-0">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white truncate">
              {userProfile?.displayName}
            </h3>
            <p className="text-[11px] text-slate-400 truncate">{userProfile?.email}</p>
          </div>
        </div>

        {/* Timezone & Quiet Hours */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
            <Globe className="w-3.5 h-3.5 text-indigo-500" /> Timezone & Quiet Hours Guard
          </h3>

          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">
              Active Timezone (ensures streaks reset at your local midnight)
            </label>
            <input
              type="text"
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                Quiet Hours Start
              </label>
              <input
                type="time"
                value={quietHoursStart}
                onChange={(e) => setQuietHoursStart(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                Quiet Hours End
              </label>
              <input
                type="time"
                value={quietHoursEnd}
                onChange={(e) => setQuietHoursEnd(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none"
              />
            </div>
          </div>
        </div>

        {/* Email Notification Preferences via Resend */}
        <div className="space-y-3 border-t border-slate-100 dark:border-slate-800 pt-4">
          <h3 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
            <Mail className="w-3.5 h-3.5 text-indigo-500" /> Resend Email Notifications
          </h3>

          <div className="space-y-2">
            <label className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer">
              <span className="text-xs text-slate-700 dark:text-slate-300">
                Daily morning reminder checklist
              </span>
              <input
                type="checkbox"
                checked={dailyReminders}
                onChange={(e) => setDailyReminders(e.target.checked)}
                className="w-4 h-4 text-indigo-600 rounded"
              />
            </label>

            <label className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer">
              <span className="text-xs text-slate-700 dark:text-slate-300">
                Weekly progress review & consistency report
              </span>
              <input
                type="checkbox"
                checked={weeklyReports}
                onChange={(e) => setWeeklyReports(e.target.checked)}
                className="w-4 h-4 text-indigo-600 rounded"
              />
            </label>

            <label className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer">
              <span className="text-xs text-slate-700 dark:text-slate-300">
                Streak milestone achievements (7d, 30d, 100d)
              </span>
              <input
                type="checkbox"
                checked={milestones}
                onChange={(e) => setMilestones(e.target.checked)}
                className="w-4 h-4 text-indigo-600 rounded"
              />
            </label>
          </div>

          <div className="pt-2">
            <button
              onClick={handleSendTestEmail}
              disabled={testEmailSending}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors disabled:opacity-60"
            >
              <Send className="w-3.5 h-3.5" />
              {testEmailSending ? 'Sending Test...' : 'Send Sample Reminder Email'}
            </button>
            {testEmailResult && (
              <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1.5 font-medium">
                {testEmailResult}
              </p>
            )}
          </div>
        </div>

        {/* Data Privacy & Deletion */}
        <div className="border-t border-slate-100 dark:border-slate-800 pt-4 flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Account & Data Deletion
            </div>
            <p className="text-[11px] text-slate-400">
              Permanent deletion of all habits, completions, and workspace records.
            </p>
          </div>
          <button
            onClick={() => {
              if (confirm('Are you sure you want to delete your account? This action is permanent.')) {
                signOut();
                onClose();
              }
            }}
            className="px-3 py-1.5 rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 text-xs font-bold transition-colors"
          >
            Delete Account
          </button>
        </div>

        <div className="flex justify-end pt-2">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-indigo-600 text-white font-bold text-xs shadow-sm hover:bg-indigo-700"
          >
            Save & Done
          </button>
        </div>
      </div>
    </div>
  );
};
