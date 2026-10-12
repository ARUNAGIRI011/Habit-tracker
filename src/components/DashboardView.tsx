import React, { useState } from 'react';
import {
  CheckCircle2,
  Circle,
  Flame,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Sparkles,
  Plus,
  ArrowRight,
  Award,
  Zap,
} from 'lucide-react';
import { useHabits } from '../context/HabitContext';
import { useTenant } from '../context/TenantContext';
import { useAuth } from '../context/AuthContext';
import { formatDate, isScheduledDay, calculateHabitStats } from '../utils/habitUtils';

interface DashboardViewProps {
  onOpenNewHabit: () => void;
  onOpenAiCoach: () => void;
  setCurrentView: (v: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onOpenNewHabit,
  onOpenAiCoach,
  setCurrentView,
}) => {
  const { userProfile } = useAuth();
  const { activeTenant } = useTenant();
  const { habits, completions, selectedDate, setSelectedDate, toggleCompletion } = useHabits();

  // Navigation across dates
  const handleDayShift = (days: number) => {
    const d = new Date(selectedDate + 'T00:00:00');
    d.setDate(d.getDate() + days);
    setSelectedDate(formatDate(d));
  };

  const todayStr = formatDate(new Date());
  const isSelectedToday = selectedDate === todayStr;

  // Filter habits scheduled for this day
  const scheduledHabits = habits.filter((h) => !h.archived && isScheduledDay(h, selectedDate));
  const completedToday = scheduledHabits.filter((h) =>
    completions.some((c) => c.habitId === h.id && c.date === selectedDate && c.completed)
  );

  const completionPct =
    scheduledHabits.length > 0
      ? Math.round((completedToday.length / scheduledHabits.length) * 100)
      : 0;

  // Calculate highest current streak
  let maxCurrentStreak = 0;
  let totalCompletionsAllTime = completions.filter((c) => c.completed).length;

  habits.forEach((h) => {
    const stats = calculateHabitStats(h, completions);
    if (stats.currentStreak > maxCurrentStreak) {
      maxCurrentStreak = stats.currentStreak;
    }
  });

  return (
    <div className="space-y-6">
      {/* Trial Banner if trialing */}
      {activeTenant?.status === 'trialing' && (
        <div className="bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-indigo-500/10 border border-indigo-200 dark:border-indigo-800/50 rounded-xl p-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span className="text-xs text-indigo-950 dark:text-indigo-200 font-medium">
              You are on a <strong>7-Day Pro Trial</strong> for workspace <em>{activeTenant.name}</em>.
              Enjoy unlimited habits, AI coaching, and deep analytics!
            </span>
          </div>
          <button
            onClick={() => setCurrentView('pricing')}
            className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
          >
            Upgrade Plan <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Date Header & Quick Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            Welcome back, {userProfile?.displayName?.split(' ')[0] || 'Friend'} 👋
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {isSelectedToday ? "Here is your habit checklist for today." : `Viewing habits for ${selectedDate}.`}
          </p>
        </div>

        {/* Date Selector */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleDayShift(-1)}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
            title="Previous Day"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200">
            <CalendarIcon className="w-3.5 h-3.5 text-indigo-500" />
            <span>
              {new Date(selectedDate + 'T00:00:00').toLocaleDateString(undefined, {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
              })}
            </span>
            {isSelectedToday && (
              <span className="px-1.5 py-0.2 rounded bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 text-[10px] uppercase font-bold">
                Today
              </span>
            )}
          </div>

          <button
            onClick={() => handleDayShift(1)}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
            title="Next Day"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          {!isSelectedToday && (
            <button
              onClick={() => setSelectedDate(todayStr)}
              className="px-2.5 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 text-xs font-medium"
            >
              Back to Today
            </button>
          )}
        </div>
      </div>

      {/* Highlights & Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Daily Completion Rate Ring */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Daily Completion
            </span>
            <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
              {completedToday.length} / {scheduledHabits.length}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              {completionPct === 100
                ? '🎉 All habits completed!'
                : `${scheduledHabits.length - completedToday.length} remaining today`}
            </div>
          </div>
          <div className="relative w-14 h-14 flex items-center justify-center">
            <svg className="w-14 h-14 transform -rotate-90">
              <circle
                cx="28"
                cy="28"
                r="22"
                stroke="currentColor"
                strokeWidth="5"
                className="text-slate-100 dark:text-slate-800"
                fill="transparent"
              />
              <circle
                cx="28"
                cy="28"
                r="22"
                stroke="currentColor"
                strokeWidth="5"
                strokeDasharray={2 * Math.PI * 22}
                strokeDashoffset={2 * Math.PI * 22 * (1 - completionPct / 100)}
                strokeLinecap="round"
                className="text-indigo-600 dark:text-indigo-400 transition-all duration-500"
                fill="transparent"
              />
            </svg>
            <span className="absolute text-xs font-bold text-slate-800 dark:text-slate-200">
              {completionPct}%
            </span>
          </div>
        </div>

        {/* Current Active Streak */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Top Active Streak
            </span>
            <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-500">
              <Flame className="w-4 h-4 animate-bounce" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
            {maxCurrentStreak} Days
          </div>
          <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium mt-1 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" /> Momentum is compounding
          </div>
        </div>

        {/* Total Check-ins Recorded */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Total Completions
            </span>
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
            {totalCompletionsAllTime} Logs
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Across all workspace habits</div>
        </div>

        {/* AI Habit Coach Insight Callout */}
        <div
          onClick={onOpenAiCoach}
          className="bg-gradient-to-br from-indigo-600 to-purple-700 p-5 rounded-2xl text-white shadow-sm shadow-indigo-600/20 cursor-pointer hover:shadow-md transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-indigo-200 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-yellow-300" /> AI Coach Tip
            </span>
            <ArrowRight className="w-4 h-4 text-indigo-200 group-hover:translate-x-1 transition-transform" />
          </div>
          <div className="text-xs font-semibold mt-2 line-clamp-2">
            "Anchor your hardest habit right after morning coffee for automatic consistency."
          </div>
          <div className="text-[10px] text-indigo-200 font-medium mt-2">
            Tap for personal habit audit →
          </div>
        </div>
      </div>

      {/* Today's Checklist */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Zap className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              Daily Habit Checklist
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Click checkmark to toggle status. Values track quantitative progress.
            </p>
          </div>
          <button
            onClick={onOpenNewHabit}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 text-xs font-semibold transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Add Habit
          </button>
        </div>

        {scheduledHabits.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto text-slate-400 mb-3">
              <CalendarIcon className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              No habits scheduled for this day
            </h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1 mb-4">
              Rest days are just as vital for sustainable habits. Or add a daily habit to keep your streak going!
            </p>
            <button
              onClick={onOpenNewHabit}
              className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700"
            >
              Create New Habit
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {scheduledHabits.map((habit) => {
              const completion = completions.find(
                (c) => c.habitId === habit.id && c.date === selectedDate
              );
              const isDone = Boolean(completion?.completed);
              const stats = calculateHabitStats(habit, completions);

              return (
                <div
                  key={habit.id}
                  className={`p-4 sm:px-6 flex items-center justify-between gap-4 transition-all hover:bg-slate-50/60 dark:hover:bg-slate-800/40 ${
                    isDone ? 'bg-slate-50/30 dark:bg-slate-900/30' : ''
                  }`}
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    {/* Toggle Button */}
                    <button
                      onClick={() => toggleCompletion(habit.id, selectedDate)}
                      className={`p-1 rounded-full transition-all transform active:scale-90 ${
                        isDone
                          ? 'text-emerald-600 dark:text-emerald-400 hover:text-emerald-700'
                          : 'text-slate-300 hover:text-slate-400 dark:text-slate-600 dark:hover:text-slate-400'
                      }`}
                      title={isDone ? 'Mark as incomplete' : 'Mark as complete'}
                    >
                      {isDone ? (
                        <CheckCircle2 className="w-6 h-6 fill-emerald-100 dark:fill-emerald-950/40" />
                      ) : (
                        <Circle className="w-6 h-6" />
                      )}
                    </button>

                    {/* Habit Info */}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-sm font-semibold truncate ${
                            isDone
                              ? 'line-through text-slate-400 dark:text-slate-500'
                              : 'text-slate-800 dark:text-slate-200'
                          }`}
                        >
                          {habit.name}
                        </span>
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: habit.color || '#4f46e5' }}
                        ></span>
                      </div>

                      <div className="flex items-center gap-3 mt-0.5 text-[11px] text-slate-400">
                        <span className="font-medium text-slate-500 dark:text-slate-400">
                          {habit.category}
                        </span>
                        <span>•</span>
                        <span>
                          Target: {habit.targetValue} {habit.unit}
                        </span>
                        {habit.reminderTime && (
                          <>
                            <span>•</span>
                            <span>⏰ {habit.reminderTime}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Streak & Quantitative Controls */}
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-900/40 text-amber-600 dark:text-amber-400 text-xs font-semibold">
                      <Flame className="w-3.5 h-3.5 fill-amber-500" />
                      <span>{stats.currentStreak}d</span>
                    </div>

                    {/* Progress / Value status */}
                    <div className="hidden sm:block text-right">
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        {isDone ? habit.targetValue : 0} / {habit.targetValue} {habit.unit}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
