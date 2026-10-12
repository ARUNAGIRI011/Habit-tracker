import React, { useState } from 'react';
import {
  Plus,
  Flame,
  Archive,
  Trash2,
  Edit2,
  Sparkles,
  CheckCircle2,
  Filter,
  Layers,
  AlertCircle,
} from 'lucide-react';
import { useHabits } from '../context/HabitContext';
import { useTenant } from '../context/TenantContext';
import { Habit } from '../types';
import { calculateHabitStats, HABIT_TEMPLATES } from '../utils/habitUtils';

interface HabitManagementViewProps {
  onOpenNewHabit: () => void;
  onEditHabit: (habit: Habit) => void;
  setCurrentView: (v: string) => void;
}

export const HabitManagementView: React.FC<HabitManagementViewProps> = ({
  onOpenNewHabit,
  onEditHabit,
  setCurrentView,
}) => {
  const { habits, completions, archiveHabit, deleteHabit, addHabit } = useHabits();
  const { maxHabitsAllowed, activeTenant } = useTenant();
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const categories = ['All', 'Health & Vitality', 'Productivity', 'Learning', 'Fitness', 'Mindfulness', 'Finance'];

  const filteredHabits = habits.filter((h) => {
    if (selectedCategory === 'All') return true;
    return h.category.toLowerCase().includes(selectedCategory.toLowerCase());
  });

  const activeHabitsCount = habits.filter((h) => !h.archived).length;
  const isNearQuota = activeHabitsCount >= maxHabitsAllowed;

  const handleUseTemplate = async (template: typeof HABIT_TEMPLATES[0]) => {
    try {
      await addHabit({
        name: template.name,
        description: template.description,
        category: template.category,
        color: template.color,
        icon: template.icon,
        frequency: template.frequency,
        targetValue: template.targetValue,
        unit: template.unit,
      });
    } catch (e: any) {
      alert(e.message || 'Failed to add template habit');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Plan Quota */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            Habit Management
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Configure frequencies, target metrics, categories, and reminders.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Active Habits Quota
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400">
              <span className="font-bold text-indigo-600 dark:text-indigo-400">
                {activeHabitsCount}
              </span>{' '}
              / {maxHabitsAllowed > 1000 ? 'Unlimited' : maxHabitsAllowed} allowed
            </div>
          </div>

          <button
            onClick={onOpenNewHabit}
            disabled={isNearQuota}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold shadow-sm transition-all ${
              isNearQuota
                ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
                : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-600/30'
            }`}
          >
            <Plus className="w-4 h-4" /> Add Habit
          </button>
        </div>
      </div>

      {/* Quota Warning Banner */}
      {isNearQuota && (
        <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-amber-800 dark:text-amber-300">
            <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
            <span>
              You have used all {maxHabitsAllowed} active habits available on your current plan.
            </span>
          </div>
          <button
            onClick={() => setCurrentView('pricing')}
            className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            Upgrade Workspace →
          </button>
        </div>
      )}

      {/* Category Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0 ml-1" />
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
              selectedCategory === cat
                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/20'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Habits Grid */}
      {filteredHabits.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800">
          <div className="w-12 h-12 rounded-full bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 flex items-center justify-center mx-auto mb-3">
            <Layers className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
            No habits in this category
          </h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1 mb-4">
            Try choosing one of our scientifically backed habit templates below or create a custom one.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredHabits.map((habit) => {
            const stats = calculateHabitStats(habit, completions);

            return (
              <div
                key={habit.id}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-3.5 h-3.5 rounded-full shrink-0 shadow-sm"
                        style={{ backgroundColor: habit.color || '#4f46e5' }}
                      />
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-1">
                        {habit.name}
                      </h3>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => onEditHabit(habit)}
                        className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        title="Edit habit"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => archiveHabit(habit.id)}
                        className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        title="Archive habit"
                      >
                        <Archive className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirmDeleteId === habit.id) {
                            deleteHabit(habit.id);
                            setConfirmDeleteId(null);
                          } else {
                            setConfirmDeleteId(habit.id);
                            setTimeout(() => setConfirmDeleteId(null), 3500);
                          }
                        }}
                        className={`p-1 rounded-lg transition-colors ${
                          confirmDeleteId === habit.id
                            ? 'text-rose-600 bg-rose-50 dark:bg-rose-950/40'
                            : 'text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20'
                        }`}
                        title={confirmDeleteId === habit.id ? 'Click again to permanently delete' : 'Delete'}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 line-clamp-2">
                    {habit.description || 'No description provided.'}
                  </p>

                  <div className="flex flex-wrap items-center gap-2 mt-3 text-[11px]">
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium">
                      {habit.category}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-medium capitalize">
                      {habit.frequency}
                    </span>
                    <span className="text-slate-400">
                      Target: {habit.targetValue} {habit.unit}
                    </span>
                  </div>
                </div>

                {/* Habit Stats Footer */}
                <div className="border-t border-slate-100 dark:border-slate-800 pt-3 mt-4 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-semibold">
                    <Flame className="w-4 h-4 fill-amber-500" />
                    <span>Streak: {stats.currentStreak}d</span>
                    <span className="text-slate-400 font-normal">(Best: {stats.longestStreak}d)</span>
                  </div>
                  <div className="font-semibold text-slate-700 dark:text-slate-300">
                    {stats.completionRate}% Rate
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Suggested Habit Templates */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">
            Proven Cornerstone Habit Templates
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {HABIT_TEMPLATES.map((tmpl) => (
            <div
              key={tmpl.name}
              className="p-3.5 rounded-xl border border-slate-200/70 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors flex items-center justify-between gap-3 group"
            >
              <div className="min-w-0">
                <div className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                  {tmpl.name}
                </div>
                <div className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                  {tmpl.description}
                </div>
              </div>
              <button
                onClick={() => handleUseTemplate(tmpl)}
                disabled={isNearQuota}
                className="shrink-0 px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white text-xs font-semibold transition-all"
              >
                + Add
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
