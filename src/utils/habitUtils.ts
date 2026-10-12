import { Habit, HabitCompletion, HabitTemplate } from '../types';

export const HABIT_TEMPLATES: HabitTemplate[] = [
  {
    name: 'Morning Hydration & Sunlight',
    description: 'Drink 500ml of water and get 10 minutes of direct morning sunlight.',
    category: 'Health & Vitality',
    color: '#0284c7', // Sky
    icon: 'Sun',
    frequency: 'daily',
    targetValue: 500,
    unit: 'ml',
  },
  {
    name: 'Deep Work Block',
    description: 'Distraction-free 90-minute focused coding or writing session with phone in another room.',
    category: 'Productivity',
    color: '#7c3aed', // Purple
    icon: 'Briefcase',
    frequency: 'weekdays',
    targetValue: 90,
    unit: 'minutes',
  },
  {
    name: '30-Minute Reading',
    description: 'Read non-fiction, technical, or philosophical books to expand mental models.',
    category: 'Learning',
    color: '#d97706', // Amber
    icon: 'BookOpen',
    frequency: 'daily',
    targetValue: 30,
    unit: 'pages',
  },
  {
    name: 'Strength & Zone-2 Cardio',
    description: 'Resistance training workout or steady-state aerobic session.',
    category: 'Fitness',
    color: '#059669', // Emerald
    icon: 'Activity',
    frequency: 'custom',
    targetValue: 45,
    unit: 'minutes',
  },
  {
    name: 'Mindful Meditation',
    description: '10 minutes of breath awareness meditation for stress regulation.',
    category: 'Mindfulness',
    color: '#0d9488', // Teal
    icon: 'Smile',
    frequency: 'daily',
    targetValue: 10,
    unit: 'minutes',
  },
  {
    name: 'Daily Expense Logging',
    description: 'Record all daily expenditures and review financial goals.',
    category: 'Finance',
    color: '#4f46e5', // Indigo
    icon: 'DollarSign',
    frequency: 'daily',
    targetValue: 1,
    unit: 'check',
  },
];

/**
 * Format date to YYYY-MM-DD
 */
export function formatDate(d: Date = new Date()): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Check if a date matches the habit's frequency
 */
export function isScheduledDay(habit: Habit, dateStr: string): boolean {
  const d = new Date(dateStr + 'T00:00:00');
  const dayOfWeek = d.getDay(); // 0 is Sunday, 6 is Saturday

  if (habit.frequency === 'daily') return true;
  if (habit.frequency === 'weekdays') return dayOfWeek >= 1 && dayOfWeek <= 5;
  if (habit.frequency === 'weekends') return dayOfWeek === 0 || dayOfWeek === 6;

  if (habit.frequency === 'custom' && habit.targetDays && habit.targetDays.length > 0) {
    const daysMap = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
    const dayKey = daysMap[dayOfWeek];
    return habit.targetDays.includes(dayKey);
  }

  return true;
}

/**
 * Calculate streaks and completion rates
 */
export function calculateHabitStats(
  habit: Habit,
  completions: HabitCompletion[],
  lookbackDays: number = 30
): {
  currentStreak: number;
  longestStreak: number;
  completionRate: number;
  totalCompleted: number;
  scheduledDaysCount: number;
} {
  const habitCompletions = new Set(
    completions
      .filter((c) => c.habitId === habit.id && c.completed)
      .map((c) => c.date)
  );

  const today = new Date();
  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 0;
  let totalCompleted = 0;
  let scheduledDaysCount = 0;

  // Evaluate backwards from yesterday / today for current streak
  const todayStr = formatDate(today);
  const isTodayScheduled = isScheduledDay(habit, todayStr);
  const isTodayDone = habitCompletions.has(todayStr);

  let checkDate = new Date();
  if (isTodayDone) {
    currentStreak++;
    checkDate.setDate(checkDate.getDate() - 1);
  } else if (!isTodayScheduled) {
    // If today is a rest day, check backwards starting from yesterday
    checkDate.setDate(checkDate.getDate() - 1);
  } else {
    // Today is scheduled but not yet completed. Streak can still be active from yesterday
    checkDate.setDate(checkDate.getDate() - 1);
  }

  // Count backwards for current streak
  for (let i = 0; i < 90; i++) {
    const dateStr = formatDate(checkDate);
    const scheduled = isScheduledDay(habit, dateStr);

    if (scheduled) {
      if (habitCompletions.has(dateStr)) {
        currentStreak++;
      } else {
        break; // Streak broken on missed scheduled day
      }
    }
    // If not scheduled (rest day), streak doesn't break
    checkDate.setDate(checkDate.getDate() - 1);
  }

  // Calculate longest streak and rate over lookback window
  const windowDate = new Date();
  windowDate.setDate(windowDate.getDate() - lookbackDays);

  for (let i = 0; i < lookbackDays; i++) {
    const dStr = formatDate(windowDate);
    const scheduled = isScheduledDay(habit, dStr);

    if (scheduled) {
      scheduledDaysCount++;
      if (habitCompletions.has(dStr)) {
        totalCompleted++;
        tempStreak++;
        if (tempStreak > longestStreak) {
          longestStreak = tempStreak;
        }
      } else {
        tempStreak = 0;
      }
    }
    windowDate.setDate(windowDate.getDate() + 1);
  }

  if (currentStreak > longestStreak) {
    longestStreak = currentStreak;
  }

  const completionRate =
    scheduledDaysCount > 0 ? Math.round((totalCompleted / scheduledDaysCount) * 100) : 0;

  return {
    currentStreak,
    longestStreak,
    completionRate,
    totalCompleted,
    scheduledDaysCount,
  };
}

/**
 * Generate CSV export data for a tenant
 */
export function exportHabitsToCsv(habits: Habit[], completions: HabitCompletion[]): string {
  const headers = ['Habit ID', 'Habit Name', 'Category', 'Date', 'Completed', 'Value', 'Unit', 'Notes'];
  const rows: string[] = [headers.join(',')];

  const habitMap = new Map<string, Habit>();
  habits.forEach((h) => habitMap.set(h.id, h));

  completions.forEach((c) => {
    const habit = habitMap.get(c.habitId);
    if (!habit) return;

    const row = [
      `"${c.habitId}"`,
      `"${habit.name.replace(/"/g, '""')}"`,
      `"${habit.category}"`,
      `"${c.date}"`,
      c.completed ? 'TRUE' : 'FALSE',
      c.value || 1,
      `"${habit.unit}"`,
      `"${(c.notes || '').replace(/"/g, '""')}"`,
    ];
    rows.push(row.join(','));
  });

  return rows.join('\n');
}
