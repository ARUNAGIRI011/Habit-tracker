import React, { useState } from 'react';
import {
  CheckCircle2,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Users,
  User,
  Target,
  Clock,
  Zap,
} from 'lucide-react';
import { useTenant } from '../context/TenantContext';
import { useHabits } from '../context/HabitContext';
import { HABIT_TEMPLATES } from '../utils/habitUtils';

interface OnboardingModalProps {
  isOpen: boolean;
  onComplete: () => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({ isOpen, onComplete }) => {
  const { activeTenant, createTenant } = useTenant();
  const { addHabit } = useHabits();

  const [step, setStep] = useState(1);
  const [workspaceType, setWorkspaceType] = useState<'personal' | 'organization'>('personal');
  const [workspaceName, setWorkspaceName] = useState('My Workspace');
  const [selectedGoals, setSelectedGoals] = useState<string[]>(['Fitness & Health', 'Deep Focus']);
  const [reminderTime, setReminderTime] = useState('08:00');
  const [selectedTemplates, setSelectedTemplates] = useState<number[]>([0, 1, 2]);

  if (!isOpen) return null;

  const goalOptions = [
    'Fitness & Health',
    'Deep Focus',
    'Continuous Learning',
    'Mindfulness & Sleep',
    'Financial Discipline',
    'Career Growth',
  ];

  const toggleGoal = (goal: string) => {
    setSelectedGoals((prev) =>
      prev.includes(goal) ? prev.filter((g) => g !== goal) : [...prev, goal]
    );
  };

  const toggleTemplate = (idx: number) => {
    setSelectedTemplates((prev) =>
      prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]
    );
  };

  const handleFinish = async () => {
    // If organization selected, create organization tenant
    if (workspaceType === 'organization' && workspaceName) {
      await createTenant(workspaceName, 'organization');
    }

    // Provision selected starter habits
    for (const idx of selectedTemplates) {
      const t = HABIT_TEMPLATES[idx];
      if (t) {
        try {
          await addHabit({
            name: t.name,
            description: t.description,
            category: t.category,
            color: t.color,
            icon: t.icon,
            frequency: t.frequency,
            targetValue: t.targetValue,
            unit: t.unit,
            reminderTime,
          });
        } catch (e) {
          console.warn('Onboarding habit seeding note:', e);
        }
      }
    }

    localStorage.setItem('habitflow_onboarded', 'true');
    onComplete();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-200">
        {/* Step Indicator */}
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
              Step {step} of 4
            </span>
            <h2 className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
              {step === 1 && 'Choose Workspace Type'}
              {step === 2 && 'Select Your Focus Goals'}
              {step === 3 && 'Pick Your Daily Routine & Reminder'}
              {step === 4 && 'Choose Your Cornerstone Habits'}
            </h2>
          </div>
          <div className="flex gap-1.5">
            {[1, 2, 3, 4].map((s) => (
              <div
                key={s}
                className={`w-7 h-1.5 rounded-full transition-all ${
                  s <= step ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-slate-800'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Step 1: Workspace Type */}
        {step === 1 && (
          <div className="space-y-4">
            <p className="text-xs text-slate-500">
              How do you plan to use HabitFlow initially? You can always create additional workspaces later.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div
                onClick={() => setWorkspaceType('personal')}
                className={`p-5 rounded-2xl border-2 transition-all cursor-pointer ${
                  workspaceType === 'personal'
                    ? 'border-indigo-600 bg-indigo-50/40 dark:bg-indigo-950/20 shadow-md'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                }`}
              >
                <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 flex items-center justify-center mb-3">
                  <User className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Personal Workspace
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  100% private habit tracking for individual self-mastery.
                </p>
              </div>

              <div
                onClick={() => setWorkspaceType('organization')}
                className={`p-5 rounded-2xl border-2 transition-all cursor-pointer ${
                  workspaceType === 'organization'
                    ? 'border-indigo-600 bg-indigo-50/40 dark:bg-indigo-950/20 shadow-md'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                }`}
              >
                <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/40 text-purple-600 flex items-center justify-center mb-3">
                  <Users className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Team / Organization
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Shared routines, challenges, and team accountability.
                </p>
              </div>
            </div>

            {workspaceType === 'organization' && (
              <div className="pt-2">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Organization Name
                </label>
                <input
                  type="text"
                  value={workspaceName}
                  onChange={(e) => setWorkspaceName(e.target.value)}
                  placeholder="e.g. Acme Tech Labs"
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none"
                />
              </div>
            )}
          </div>
        )}

        {/* Step 2: Focus Goals */}
        {step === 2 && (
          <div className="space-y-4">
            <p className="text-xs text-slate-500">
              Select 2-3 areas you want to prioritize. This guides our AI habit coach recommendations.
            </p>

            <div className="grid grid-cols-2 gap-2.5">
              {goalOptions.map((goal) => {
                const active = selectedGoals.includes(goal);
                return (
                  <button
                    key={goal}
                    type="button"
                    onClick={() => toggleGoal(goal)}
                    className={`p-3 rounded-xl border text-xs font-semibold text-left transition-all flex items-center justify-between ${
                      active
                        ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-300 shadow-sm'
                        : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <span>{goal}</span>
                    {active && <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 3: Daily Routine & Reminders */}
        {step === 3 && (
          <div className="space-y-4">
            <p className="text-xs text-slate-500">
              Choose your ideal check-in time. HabitFlow delivers frictionless email reminders via Resend.
            </p>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Preferred Daily Check-in Reminder
                </label>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-indigo-500" />
                  <input
                    type="time"
                    value={reminderTime}
                    onChange={(e) => setReminderTime(e.target.value)}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white outline-none"
                  />
                  <span className="text-xs text-slate-400">
                    ({Intl.DateTimeFormat().resolvedOptions().timeZone || 'Local'})
                  </span>
                </div>
              </div>

              <div className="text-[11px] text-slate-500">
                💡 Habit cues are 3x more effective when tied to a specific morning trigger (e.g. 8:00 AM breakfast).
              </div>
            </div>
          </div>
        )}

        {/* Step 4: First 3 Habits */}
        {step === 4 && (
          <div className="space-y-3">
            <p className="text-xs text-slate-500">
              Select 3 cornerstone habits to populate your initial dashboard:
            </p>

            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {HABIT_TEMPLATES.map((tmpl, idx) => {
                const isSelected = selectedTemplates.includes(idx);
                return (
                  <div
                    key={tmpl.name}
                    onClick={() => toggleTemplate(idx)}
                    className={`p-3 rounded-xl border text-xs transition-all cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/40 dark:bg-indigo-950/20'
                        : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50'
                    }`}
                  >
                    <div>
                      <div className="font-bold text-slate-900 dark:text-white">{tmpl.name}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {tmpl.category} · {tmpl.targetValue} {tmpl.unit}
                      </div>
                    </div>
                    {isSelected ? (
                      <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />
                    ) : (
                      <div className="w-4 h-4 rounded-full border border-slate-300 shrink-0" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between pt-6 border-t border-slate-100 dark:border-slate-800 mt-6">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep(step - 1)}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-100 rounded-xl"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back
            </button>
          ) : (
            <div />
          )}

          {step < 4 ? (
            <button
              type="button"
              onClick={() => setStep(step + 1)}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/30"
            >
              Next <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleFinish}
              className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white text-xs font-bold shadow-md shadow-indigo-600/30"
            >
              <Sparkles className="w-3.5 h-3.5 text-yellow-300" /> Enter HabitFlow Dashboard
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
