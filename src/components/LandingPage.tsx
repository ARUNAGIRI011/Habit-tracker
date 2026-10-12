import React, { useState } from 'react';
import {
  CheckCircle2,
  Circle,
  Flame,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Shield,
  Users,
  Zap,
  BarChart3,
  Calendar,
  Layers,
  Award,
} from 'lucide-react';
import confetti from 'canvas-confetti';

export const LandingPage: React.FC<{
  onGetStarted: () => void;
  onExplorePricing: () => void;
  onDemoLogin: () => void;
}> = ({ onGetStarted, onExplorePricing, onDemoLogin }) => {
  // Interactive live mockup habits state
  const [demoHabits, setDemoHabits] = useState([
    { id: 1, name: 'Morning Sunlight & 500ml Water', category: 'Health', streak: 14, done: true },
    { id: 2, name: '90-Min Deep Coding / Writing', category: 'Productivity', streak: 6, done: false },
    { id: 3, name: '30-Minute Non-Fiction Reading', category: 'Growth', streak: 21, done: true },
  ]);

  const toggleDemo = (id: number) => {
    setDemoHabits((prev) =>
      prev.map((h) => {
        if (h.id === id) {
          const isDone = !h.done;
          if (isDone) {
            confetti({
              particleCount: 50,
              spread: 60,
              origin: { y: 0.6 },
              colors: ['#4f46e5', '#10b981', '#f59e0b'],
            });
          }
          return { ...h, done: isDone, streak: isDone ? h.streak + 1 : h.streak - 1 };
        }
        return h;
      })
    );
  };

  return (
    <div className="space-y-20 py-8">
      {/* Hero Section */}
      <section className="text-center max-w-4xl mx-auto space-y-6 px-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 text-xs font-semibold animate-pulse">
          <Sparkles className="w-3.5 h-3.5 text-yellow-500" />
          <span>New: AI Habit Coach powered by Google Gemini 2.5</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
          Transform your identity with{' '}
          <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-500 bg-clip-text text-transparent">
            compounding daily habits
          </span>
        </h1>

        <p className="text-base sm:text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
          HabitFlow is the production-grade multi-tenant habit platform. Track personal routines, collaborate in organization workspaces, analyze consistency heatmaps, and unlock AI guidance without the guilt.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
          <button
            onClick={onGetStarted}
            className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all active:scale-95"
          >
            Start Free Today <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={onDemoLogin}
            className="w-full sm:w-auto px-6 py-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold text-sm hover:bg-slate-50 transition-all"
          >
            Instant Live Demo Mode
          </button>
        </div>

        <div className="flex items-center justify-center gap-6 text-xs text-slate-400 pt-3">
          <span>✓ Free 5-habit tier</span>
          <span>✓ Firebase Firestore persistent</span>
          <span>✓ Razorpay & Resend enabled</span>
        </div>
      </section>

      {/* Interactive Live Preview Box */}
      <section className="max-w-3xl mx-auto px-4">
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200/80 dark:border-slate-800 relative overflow-hidden">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-6">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                Interactive Preview
              </span>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Experience HabitFlow's Instant Feedback
              </h2>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center gap-1">
              <Flame className="w-3.5 h-3.5 fill-amber-500 text-amber-500" /> 84% Consistency
            </span>
          </div>

          <div className="space-y-3">
            {demoHabits.map((habit) => (
              <div
                key={habit.id}
                onClick={() => toggleDemo(habit.id)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                  habit.done
                    ? 'border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/40 dark:bg-emerald-950/20'
                    : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                }`}
              >
                <div className="flex items-center gap-3">
                  {habit.done ? (
                    <CheckCircle2 className="w-6 h-6 text-emerald-600 fill-emerald-100 dark:fill-emerald-950/60" />
                  ) : (
                    <Circle className="w-6 h-6 text-slate-300 dark:text-slate-600" />
                  )}
                  <div>
                    <span
                      className={`text-sm font-semibold ${
                        habit.done
                          ? 'line-through text-slate-400 dark:text-slate-500'
                          : 'text-slate-800 dark:text-slate-200'
                      }`}
                    >
                      {habit.name}
                    </span>
                    <span className="block text-[11px] text-slate-400">{habit.category}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1 text-xs font-bold text-amber-600 dark:text-amber-400">
                  <Flame className="w-3.5 h-3.5 fill-amber-500" />
                  <span>{habit.streak}d streak</span>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 text-center text-xs text-slate-400">
            👆 Click any habit above to toggle completion and test the streak celebration!
          </div>
        </div>
      </section>

      {/* Feature Pillar Highlights */}
      <section className="max-w-6xl mx-auto px-4 space-y-12">
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            Built for sustainable behavioral change
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-2">
            Most habit trackers break your spirit after one missed day. HabitFlow uses schedule-aware streak mathematics and rest day tolerance.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 flex items-center justify-center">
              <Calendar className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Schedule-Aware Streaks
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Define habits for weekdays, weekends, or specific days. Planned rest days never break your compounding streak momentum.
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              AI Habit Coaching
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Powered by Google Gemini 2.5. Receive behavioral habit stacking strategies, friction reduction tips, and supportive feedback.
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Team & Org Workspaces
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Collaborate across organizations. Invite colleagues with Owner, Admin, or Member roles and compete in shared monthly milestones.
            </p>
          </div>
        </div>
      </section>

      {/* Pricing Teaser */}
      <section className="bg-slate-50 dark:bg-slate-900/50 py-16 px-4 border-y border-slate-200/60 dark:border-slate-800 text-center">
        <div className="max-w-2xl mx-auto space-y-4">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            Accessible pricing in Indian Rupees (₹)
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Free forever for up to 5 habits. Upgrade to Plus (₹99/mo) or Pro (₹199/mo) for AI intelligence and unlimited tracking.
          </p>
          <button
            onClick={onExplorePricing}
            className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/20"
          >
            Explore Plans & Features →
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto px-4 text-center text-xs text-slate-400 py-8 border-t border-slate-100 dark:border-slate-800">
        <p>© 2026 HabitFlow SaaS. Production architecture powered by Firestore, Firebase Auth, Razorpay & Resend.</p>
        <p className="mt-1 text-[11px]">Strict Tenant Authorization & Zero-Trust Security Rules Applied.</p>
      </footer>
    </div>
  );
};
