import React, { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Circle,
  Calendar as CalendarIcon,
  Flame,
} from 'lucide-react';
import { useHabits } from '../context/HabitContext';
import { formatDate, isScheduledDay } from '../utils/habitUtils';

export const CalendarView: React.FC = () => {
  const { habits, completions, toggleCompletion } = useHabits();
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [selectedDayStr, setSelectedDayStr] = useState<string>(formatDate(new Date()));

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const monthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });

  // Compute days in month
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay(); // 0 is Sunday

  const days: Array<{
    dateStr: string;
    dayNum: number;
    completionPct: number;
    completedCount: number;
    scheduledCount: number;
  }> = [];

  for (let d = 1; d <= daysInMonth; d++) {
    const dStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const scheduled = habits.filter((h) => !h.archived && isScheduledDay(h, dStr));
    const completed = scheduled.filter((h) =>
      completions.some((c) => c.habitId === h.id && c.date === dStr && c.completed)
    );

    const pct = scheduled.length > 0 ? Math.round((completed.length / scheduled.length) * 100) : 0;
    days.push({
      dateStr: dStr,
      dayNum: d,
      completionPct: pct,
      completedCount: completed.length,
      scheduledCount: scheduled.length,
    });
  }

  // Habits on selected day
  const selectedDayScheduled = habits.filter(
    (h) => !h.archived && isScheduledDay(h, selectedDayStr)
  );

  return (
    <div className="space-y-6">
      {/* Month Navigation Header */}
      <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400">
            <CalendarIcon className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900 dark:text-white">{monthName}</h1>
            <p className="text-xs text-slate-400">Monthly Habit Heatmap & Consistency Grid</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={handlePrevMonth}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => setCurrentDate(new Date())}
            className="px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200"
          >
            Current Month
          </button>
          <button
            onClick={handleNextMonth}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Heatmap Grid */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
          {/* Day of Week Headers */}
          <div className="grid grid-cols-7 gap-2 mb-2 text-center text-[11px] font-semibold text-slate-400">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
              <div key={d}>{d}</div>
            ))}
          </div>

          {/* Calendar Cells */}
          <div className="grid grid-cols-7 gap-2">
            {/* Blank leading slots */}
            {Array.from({ length: firstDayOfWeek }).map((_, i) => (
              <div key={`blank-${i}`} className="h-16 rounded-xl bg-slate-50/50 dark:bg-slate-800/20" />
            ))}

            {days.map((item) => {
              const isSelected = item.dateStr === selectedDayStr;
              const isToday = item.dateStr === formatDate(new Date());

              let bgClass = 'bg-slate-50 dark:bg-slate-800/40 text-slate-600 dark:text-slate-400';
              if (item.scheduledCount > 0) {
                if (item.completionPct === 100) {
                  bgClass = 'bg-emerald-500 text-white shadow-sm shadow-emerald-500/20 font-bold';
                } else if (item.completionPct >= 66) {
                  bgClass = 'bg-emerald-400/80 text-white font-medium';
                } else if (item.completionPct >= 33) {
                  bgClass = 'bg-emerald-200 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-200';
                } else if (item.completionPct > 0) {
                  bgClass = 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300';
                }
              }

              return (
                <button
                  key={item.dateStr}
                  onClick={() => setSelectedDayStr(item.dateStr)}
                  className={`h-16 rounded-xl p-2 flex flex-col justify-between text-left transition-all relative ${bgClass} ${
                    isSelected ? 'ring-2 ring-indigo-600 dark:ring-indigo-400 ring-offset-2 dark:ring-offset-slate-900' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold">{item.dayNum}</span>
                    {isToday && (
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 dark:bg-indigo-400" />
                    )}
                  </div>
                  <div className="text-[10px] truncate opacity-90">
                    {item.scheduledCount > 0 ? `${item.completedCount}/${item.scheduledCount}` : 'Rest'}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex items-center justify-end gap-3 mt-6 text-[11px] text-slate-500">
            <span>Less</span>
            <div className="w-3.5 h-3.5 rounded bg-slate-100 dark:bg-slate-800" />
            <div className="w-3.5 h-3.5 rounded bg-emerald-100 dark:bg-emerald-950/50" />
            <div className="w-3.5 h-3.5 rounded bg-emerald-200 dark:bg-emerald-900" />
            <div className="w-3.5 h-3.5 rounded bg-emerald-400" />
            <div className="w-3.5 h-3.5 rounded bg-emerald-500" />
            <span>100% Done</span>
          </div>
        </div>

        {/* Selected Day Drilldown Panel */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <div className="border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
              <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                Day Drilldown
              </span>
              <h2 className="text-base font-bold text-slate-900 dark:text-white mt-1">
                {new Date(selectedDayStr + 'T00:00:00').toLocaleDateString(undefined, {
                  weekday: 'long',
                  month: 'short',
                  day: 'numeric',
                })}
              </h2>
            </div>

            {selectedDayScheduled.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">
                No scheduled habits for this selected day.
              </p>
            ) : (
              <div className="space-y-3">
                {selectedDayScheduled.map((h) => {
                  const isDone = completions.some(
                    (c) => c.habitId === h.id && c.date === selectedDayStr && c.completed
                  );

                  return (
                    <div
                      key={h.id}
                      onClick={() => toggleCompletion(h.id, selectedDayStr)}
                      className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                        isDone
                          ? 'border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/40 dark:bg-emerald-950/20'
                          : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {isDone ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        ) : (
                          <Circle className="w-4 h-4 text-slate-300 dark:text-slate-600 shrink-0" />
                        )}
                        <span
                          className={`text-xs font-semibold truncate ${
                            isDone ? 'line-through text-slate-400' : 'text-slate-800 dark:text-slate-200'
                          }`}
                        >
                          {h.name}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 shrink-0">
                        {h.targetValue} {h.unit}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400">
            💡 Click any habit above to retroactively record or undo a completion for {selectedDayStr}.
          </div>
        </div>
      </div>
    </div>
  );
};
