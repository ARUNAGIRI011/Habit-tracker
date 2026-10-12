import React, { useState } from 'react';
import {
  Sparkles,
  Bot,
  Zap,
  TrendingUp,
  Clock,
  RefreshCw,
  CheckCircle2,
  Lock,
} from 'lucide-react';
import { useHabits } from '../context/HabitContext';
import { useTenant } from '../context/TenantContext';

export const AiCoachView: React.FC<{ setCurrentView: (v: string) => void }> = ({
  setCurrentView,
}) => {
  const { habits, completions } = useHabits();
  const { activeTenant, isAiCoachingAllowed } = useTenant();

  const [loading, setLoading] = useState(false);
  const [coachingData, setCoachingData] = useState<{
    coachingAdvice: string;
    strengths: string[];
    recommendation: string;
    suggestedRoutine: Array<{ time: string; action: string }>;
  } | null>(null);

  const fetchAiCoaching = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/ai/coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          habits,
          completions,
          userTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
        }),
      });
      const data = await res.json();
      setCoachingData(data);
    } catch (e) {
      console.warn('AI coach fetch error:', e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-purple-700 via-indigo-700 to-indigo-900 p-6 rounded-2xl text-white shadow-lg shadow-indigo-700/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-white/20 backdrop-blur-md">
              <Bot className="w-5 h-5 text-yellow-300" />
            </span>
            <h1 className="text-xl font-bold">HabitFlow AI Coach</h1>
          </div>
          <p className="text-xs text-indigo-200 mt-1 max-w-xl">
            Powered by Google Gemini 2.5. Delivers supportive behavioral science feedback, routine stacking, and anti-burnout pacing based on your real performance.
          </p>
        </div>

        <button
          onClick={fetchAiCoaching}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-indigo-900 hover:bg-indigo-50 text-xs font-bold shadow-md transition-all shrink-0 active:scale-95 disabled:opacity-60"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Analyzing Habits...' : 'Run Personalized Audit'}
        </button>
      </div>

      {/* Plan gate check if not on Pro/Team */}
      {!isAiCoachingAllowed && activeTenant?.status !== 'trialing' && (
        <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200/80 dark:border-slate-800 text-center shadow-sm">
          <div className="w-12 h-12 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-500 flex items-center justify-center mx-auto mb-3">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            AI Coaching is included in HabitFlow Pro & Team
          </h2>
          <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-4">
            Unlock weekly personalized habit audits, optimal routine stacking, and predictive streak recovery.
          </p>
          <button
            onClick={() => setCurrentView('pricing')}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/30"
          >
            Start 7-Day Free Pro Trial
          </button>
        </div>
      )}

      {/* Coaching Output Panel */}
      {coachingData ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Main Behavioral Assessment */}
          <div className="md:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-6">
            <div>
              <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold text-xs uppercase tracking-wider">
                <Sparkles className="w-4 h-4 text-yellow-500" />
                Coach's Behavioral Assessment
              </div>
              <p className="text-sm text-slate-700 dark:text-slate-200 mt-2 leading-relaxed bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                "{coachingData.coachingAdvice}"
              </p>
            </div>

            {/* Strengths & Recommendation */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/50">
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 dark:text-emerald-300">
                  <TrendingUp className="w-4 h-4 text-emerald-600" /> Key Strengths Noticed
                </div>
                <ul className="mt-2 space-y-1 text-xs text-emerald-950 dark:text-emerald-200">
                  {coachingData.strengths.map((s, i) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-4 rounded-xl bg-purple-50 dark:bg-purple-950/30 border border-purple-100 dark:border-purple-900/50">
                <div className="flex items-center gap-1.5 text-xs font-bold text-purple-800 dark:text-purple-300">
                  <Zap className="w-4 h-4 text-purple-600" /> High-Leverage Recommendation
                </div>
                <p className="mt-2 text-xs text-purple-950 dark:text-purple-200 leading-relaxed">
                  {coachingData.recommendation}
                </p>
              </div>
            </div>
          </div>

          {/* Habit Stacking Routine Card */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
            <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-sm mb-4">
              <Clock className="w-4 h-4 text-indigo-600" />
              Suggested Habit Stacking Loop
            </div>

            <div className="space-y-4">
              {coachingData.suggestedRoutine.map((step, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800"
                >
                  <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                    {step.time}
                  </span>
                  <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 mt-1">
                    {step.action}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 p-3 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/20 text-[11px] text-indigo-900 dark:text-indigo-300">
              💡 <em>Habit Stacking Principle:</em> "After [CURRENT HABIT], I will [NEW HABIT]."
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 p-12 rounded-2xl border border-slate-200/80 dark:border-slate-800 text-center shadow-sm">
          <Sparkles className="w-8 h-8 text-indigo-600 mx-auto mb-3" />
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            Ready to analyze your habits?
          </h2>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1 mb-5">
            Click the button above to generate AI behavioral feedback on your current schedule, category allocation, and consistency.
          </p>
          <button
            onClick={fetchAiCoaching}
            disabled={loading}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/30"
          >
            {loading ? 'Analyzing...' : 'Run Personalized Habit Audit'}
          </button>
        </div>
      )}
    </div>
  );
};
