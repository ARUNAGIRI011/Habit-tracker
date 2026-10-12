import React, { useState } from 'react';
import {
  Download,
  Printer,
  TrendingUp,
  Award,
  Flame,
  CheckCircle2,
  Circle,
  BarChart,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Mail,
  Send,
  Sparkles,
  FileText,
  X,
  Check,
  Info,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart as RechartsBarChart,
  Bar,
} from 'recharts';
import { useHabits } from '../context/HabitContext';
import { useTenant } from '../context/TenantContext';
import { useAuth } from '../context/AuthContext';
import {
  calculateHabitStats,
  exportHabitsToCsv,
  formatDate,
  isScheduledDay,
} from '../utils/habitUtils';

export const AnalyticsView: React.FC = () => {
  const { userProfile } = useAuth();
  const { activeTenant } = useTenant();
  const { habits, completions } = useHabits();

  // Print modal and email modal states
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailRecipient, setEmailRecipient] = useState(userProfile?.email || '');
  const [emailSending, setEmailSending] = useState(false);
  const [emailSuccessMsg, setEmailSuccessMsg] = useState<string | null>(null);

  // Month navigation state for the Analytics Calendar Heatmap
  const [heatmapDate, setHeatmapDate] = useState<Date>(new Date());
  const [selectedHeatmapDay, setSelectedHeatmapDay] = useState<string>(formatDate(new Date()));

  const heatmapYear = heatmapDate.getFullYear();
  const heatmapMonth = heatmapDate.getMonth();
  const monthName = heatmapDate.toLocaleString('default', { month: 'long', year: 'numeric' });

  const handlePrevMonth = () => {
    setHeatmapDate(new Date(heatmapYear, heatmapMonth - 1, 1));
  };

  const handleNextMonth = () => {
    setHeatmapDate(new Date(heatmapYear, heatmapMonth + 1, 1));
  };

  // Generate 14-day trend data
  const trendData: Array<{ date: string; displayDate: string; rate: number; count: number }> = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dStr = formatDate(d);

    const scheduled = habits.filter((h) => !h.archived && isScheduledDay(h, dStr));
    const completed = scheduled.filter((h) =>
      completions.some((c) => c.habitId === h.id && c.date === dStr && c.completed)
    );

    const rate = scheduled.length > 0 ? Math.round((completed.length / scheduled.length) * 100) : 0;
    trendData.push({
      date: dStr,
      displayDate: d.toLocaleDateString(undefined, { month: 'numeric', day: 'numeric' }),
      rate,
      count: completed.length,
    });
  }

  // Category performance
  const categoryStats: Record<string, { total: number; completed: number }> = {};
  habits.forEach((h) => {
    if (!categoryStats[h.category]) {
      categoryStats[h.category] = { total: 0, completed: 0 };
    }
    const stats = calculateHabitStats(h, completions);
    categoryStats[h.category].total += stats.scheduledDaysCount;
    categoryStats[h.category].completed += stats.totalCompleted;
  });

  const categoryChartData = Object.entries(categoryStats).map(([cat, data]) => ({
    category: cat,
    rate: data.total > 0 ? Math.round((data.completed / data.total) * 100) : 0,
    completions: data.completed,
  }));

  // Overall Consistency score
  const avgConsistency =
    trendData.reduce((acc, curr) => acc + curr.rate, 0) / (trendData.length || 1);

  // Top streak across habits
  let topStreak = 0;
  habits.forEach((h) => {
    const s = calculateHabitStats(h, completions);
    if (s.currentStreak > topStreak) topStreak = s.currentStreak;
  });

  // Calculate monthly heatmap days
  const daysInMonth = new Date(heatmapYear, heatmapMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(heatmapYear, heatmapMonth, 1).getDay();

  const heatmapDays: Array<{
    dateStr: string;
    dayNum: number;
    completionPct: number;
    completedCount: number;
    scheduledCount: number;
  }> = [];

  let perfectDaysCount = 0;
  let activeDaysCount = 0;
  let monthlyTotalScheduled = 0;
  let monthlyTotalCompleted = 0;

  for (let d = 1; d <= daysInMonth; d++) {
    const dStr = `${heatmapYear}-${String(heatmapMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const scheduled = habits.filter((h) => !h.archived && isScheduledDay(h, dStr));
    const completed = scheduled.filter((h) =>
      completions.some((c) => c.habitId === h.id && c.date === dStr && c.completed)
    );

    const pct = scheduled.length > 0 ? Math.round((completed.length / scheduled.length) * 100) : 0;
    if (scheduled.length > 0) {
      monthlyTotalScheduled += scheduled.length;
      monthlyTotalCompleted += completed.length;
      if (pct === 100) perfectDaysCount++;
      if (completed.length > 0) activeDaysCount++;
    }

    heatmapDays.push({
      dateStr: dStr,
      dayNum: d,
      completionPct: pct,
      completedCount: completed.length,
      scheduledCount: scheduled.length,
    });
  }

  const monthlyConsistencyPct =
    monthlyTotalScheduled > 0
      ? Math.round((monthlyTotalCompleted / monthlyTotalScheduled) * 100)
      : 0;

  // Selected day drilldown habits
  const selectedDayScheduled = habits.filter(
    (h) => !h.archived && isScheduledDay(h, selectedHeatmapDay)
  );

  // CSV Export handler
  const handleExportCsv = () => {
    const csvContent = exportHabitsToCsv(habits, completions);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute(
      'download',
      `habitflow_${activeTenant?.name?.replace(/\s+/g, '_') || 'workspace'}_${formatDate()}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Download Formatted Standalone HTML/PDF Report
  const handleDownloadFullReport = () => {
    const reportHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>HabitFlow Report - ${activeTenant?.name || 'Workspace'} - ${monthName}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f8fafc; color: #1e293b; margin: 0; padding: 40px; }
    .card { background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; padding: 32px; max-width: 800px; margin: 0 auto; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
    .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #f1f5f9; padding-bottom: 24px; margin-bottom: 28px; }
    .logo { font-size: 24px; font-weight: 800; color: #4f46e5; }
    .badge { background: #e0e7ff; color: #4338ca; padding: 4px 12px; border-radius: 999px; font-size: 12px; font-weight: bold; }
    .kpi-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 32px; }
    .kpi { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; text-align: center; }
    .kpi-val { font-size: 32px; font-weight: 800; color: #0f172a; margin-top: 4px; }
    .kpi-lbl { font-size: 12px; font-weight: 600; color: #64748b; text-transform: uppercase; }
    table { width: 100%; border-collapse: collapse; margin: 24px 0; font-size: 14px; }
    th { background: #f8fafc; padding: 12px; text-align: left; font-weight: 700; color: #475569; border-bottom: 2px solid #e2e8f0; }
    td { padding: 12px; border-bottom: 1px solid #f1f5f9; }
    .streak { color: #d97706; font-weight: bold; }
    .rate { color: #4f46e5; font-weight: bold; }
    .footer { text-align: center; margin-top: 40px; font-size: 12px; color: #94a3b8; }
    @media print { body { background: #ffffff; padding: 0; } .card { border: none; box-shadow: none; padding: 0; } }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <div>
        <div class="logo">HabitFlow</div>
        <div style="font-size: 14px; color: #64748b; margin-top: 4px;">Executive Progress & Habit Consistency Report</div>
      </div>
      <div>
        <span class="badge">${activeTenant?.name || 'Workspace'}</span>
      </div>
    </div>

    <div style="margin-bottom: 24px; font-size: 13px; color: #64748b;">
      Report Period: <strong>${monthName}</strong> · Generated for <strong>${userProfile?.displayName || 'User'}</strong> (${userProfile?.email})
    </div>

    <div class="kpi-grid">
      <div class="kpi">
        <div class="kpi-lbl">Monthly Consistency</div>
        <div class="kpi-val" style="color: #10b981;">${monthlyConsistencyPct}%</div>
      </div>
      <div class="kpi">
        <div class="kpi-lbl">Total Executions</div>
        <div class="kpi-val" style="color: #4f46e5;">${monthlyTotalCompleted}</div>
      </div>
      <div class="kpi">
        <div class="kpi-lbl">Active Streak</div>
        <div class="kpi-val" style="color: #d97706;">${topStreak}d</div>
      </div>
    </div>

    <h3 style="font-size: 16px; margin-bottom: 12px; color: #0f172a;">Habit Performance Breakdown</h3>
    <table>
      <thead>
        <tr>
          <th>Habit Name</th>
          <th>Category</th>
          <th>Frequency</th>
          <th style="text-align: center;">Current Streak</th>
          <th style="text-align: right;">Completion Rate</th>
        </tr>
      </thead>
      <tbody>
        ${habits
          .map((h) => {
            const stats = calculateHabitStats(h, completions);
            return `<tr>
            <td style="font-weight: 600;">${h.name}</td>
            <td>${h.category}</td>
            <td style="text-transform: capitalize;">${h.frequency}</td>
            <td style="text-align: center;" class="streak">${stats.currentStreak} days</td>
            <td style="text-align: right;" class="rate">${stats.completionRate}%</td>
          </tr>`;
          })
          .join('')}
      </tbody>
    </table>

    <div style="background: #f1f5f9; border-radius: 12px; padding: 16px; margin-top: 32px; font-size: 13px; color: #334155;">
      <strong>Monthly Summary:</strong> During ${monthName}, you registered <strong>${activeDaysCount} active days</strong> with <strong>${perfectDaysCount} perfect days</strong> (100% scheduled habits completed). Keep compounding!
    </div>

    <div class="footer">
      Generated automatically by HabitFlow SaaS on ${new Date().toLocaleDateString()}.
    </div>
  </div>
  <script>
    window.addEventListener('load', () => {
      // Optional print prompt if opened in new tab
    });
  </script>
</body>
</html>`;

    const blob = new Blob([reportHtml], { type: 'text/html;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute(
      'download',
      `HabitFlow_Report_${activeTenant?.name?.replace(/\s+/g, '_') || 'Workspace'}_${monthName.replace(/\s+/g, '_')}.html`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Send Report Directly to Email via Resend
  const handleSendEmailReport = async () => {
    if (!emailRecipient) return;

    setEmailSending(true);
    setEmailSuccessMsg(null);

    try {
      const habitData = habits.map((h) => {
        const stats = calculateHabitStats(h, completions);
        return {
          name: h.name,
          category: h.category,
          streak: stats.currentStreak,
          rate: stats.completionRate,
        };
      });

      const res = await fetch('/api/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipientEmail: emailRecipient,
          templateType: 'analytics_report',
          data: {
            name: userProfile?.displayName || 'User',
            workspaceName: activeTenant?.name || 'Workspace',
            monthName,
            consistencyScore: monthlyConsistencyPct,
            totalCompletions: monthlyTotalCompleted,
            bestStreak: topStreak,
            recipientEmail: emailRecipient,
            habits: habitData,
          },
        }),
      });

      const result = await res.json();
      if (result.success) {
        setEmailSuccessMsg(
          result.status === 'delivered'
            ? `Report successfully delivered to ${emailRecipient} via Resend API!`
            : `Report sent (${result.message || 'recorded in delivery log'}).`
        );
        setTimeout(() => {
          setShowEmailModal(false);
          setEmailSuccessMsg(null);
        }, 2800);
      } else {
        alert(result.error || 'Failed to dispatch report email');
      }
    } catch (e: any) {
      alert('Error sending report email: ' + (e.message || 'Network error'));
    } finally {
      setEmailSending(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header and Action Buttons */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">
              Analytics & Consistency Intelligence
            </h1>
            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300">
              {activeTenant?.name || 'Workspace'}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Data-backed metrics tracking consistency trends, monthly completion heatmap patterns, and reports.
          </p>
        </div>

        {/* Action Buttons: Download Report, Send to Email, Export CSV, Printable Report */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleDownloadFullReport}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm shadow-indigo-600/30 transition-all active:scale-95"
            title="Download formatted HTML/PDF progress report"
          >
            <Download className="w-3.5 h-3.5" /> Download Report
          </button>

          <button
            onClick={() => {
              setEmailRecipient(userProfile?.email || '');
              setShowEmailModal(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold shadow-sm shadow-purple-600/30 transition-all active:scale-95"
            title="Send report to email via Resend"
          >
            <Mail className="w-3.5 h-3.5" /> Send to Email
          </button>

          <button
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-medium transition-colors"
            title="Export raw data to CSV"
          >
            <FileText className="w-3.5 h-3.5 text-slate-500" /> Export CSV
          </button>

          <button
            onClick={() => setShowPrintModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-medium transition-colors"
            title="Print report preview"
          >
            <Printer className="w-3.5 h-3.5 text-slate-500" /> Print
          </button>
        </div>
      </div>

      {/* Top 4 Score Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-medium text-slate-400">Monthly Consistency Index</span>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
            {monthlyConsistencyPct}%
          </div>
          <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium mt-1">
            {perfectDaysCount} perfect (100%) days in {monthName.split(' ')[0]}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-medium text-slate-400">Total Month Executions</span>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
            {monthlyTotalCompleted}
          </div>
          <div className="text-[11px] text-indigo-600 dark:text-indigo-400 font-medium mt-1">
            {monthlyTotalScheduled} total scheduled occurrences
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-medium text-slate-400">Active Month Days</span>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
            {activeDaysCount} Days
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Days with at least 1 habit checked
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Top Active Streak</span>
            <Flame className="w-4 h-4 text-amber-500 fill-amber-500" />
          </div>
          <div className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">
            {topStreak} Days
          </div>
          <div className="text-[11px] text-amber-600 font-medium mt-1">
            Compounding behavioral habit loop
          </div>
        </div>
      </div>

      {/* MONTHLY CALENDAR HEATMAP COMPONENT */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              Monthly Habit Completion Heatmap
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Visualizes daily consistency intensity and scheduled completion ratios for{' '}
              <strong>{activeTenant?.name || 'the active workspace'}</strong>.
            </p>
          </div>

          {/* Month Selector Controls */}
          <div className="flex items-center gap-1.5 self-start sm:self-auto">
            <button
              onClick={handlePrevMonth}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
              title="Previous Month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200 min-w-[130px] text-center">
              {monthName}
            </div>
            <button
              onClick={() => setHeatmapDate(new Date())}
              className="px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 transition-colors"
            >
              Today
            </button>
            <button
              onClick={handleNextMonth}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
              title="Next Month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Calendar Heatmap Grid */}
          <div className="lg:col-span-2 space-y-3">
            {/* Weekday Column Headers */}
            <div className="grid grid-cols-7 gap-2 text-center text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                <div key={day}>{day}</div>
              ))}
            </div>

            {/* Grid of Days */}
            <div className="grid grid-cols-7 gap-2">
              {/* Blank leading offset cells */}
              {Array.from({ length: firstDayOfWeek }).map((_, i) => (
                <div
                  key={`offset-${i}`}
                  className="h-16 rounded-xl bg-slate-50/50 dark:bg-slate-800/20 border border-transparent"
                />
              ))}

              {heatmapDays.map((item) => {
                const isSelected = item.dateStr === selectedHeatmapDay;
                const isToday = item.dateStr === formatDate(new Date());

                // Determine heat level colors
                let bgClass = 'bg-slate-50 dark:bg-slate-800/40 text-slate-600 dark:text-slate-400 border-slate-200/50 dark:border-slate-800/50';
                if (item.scheduledCount > 0) {
                  if (item.completionPct === 100) {
                    bgClass = 'bg-emerald-500 text-white shadow-sm shadow-emerald-500/20 border-emerald-600 font-bold';
                  } else if (item.completionPct >= 66) {
                    bgClass = 'bg-emerald-400 text-white border-emerald-500 font-semibold';
                  } else if (item.completionPct >= 33) {
                    bgClass = 'bg-emerald-200 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-200 border-emerald-300 dark:border-emerald-800 font-medium';
                  } else if (item.completionPct > 0) {
                    bgClass = 'bg-emerald-100 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900';
                  }
                }

                return (
                  <button
                    key={item.dateStr}
                    type="button"
                    onClick={() => setSelectedHeatmapDay(item.dateStr)}
                    className={`h-16 rounded-xl p-2 border flex flex-col justify-between text-left transition-all relative group hover:scale-[1.02] active:scale-95 ${bgClass} ${
                      isSelected
                        ? 'ring-2 ring-indigo-600 dark:ring-indigo-400 ring-offset-2 dark:ring-offset-slate-900 z-10'
                        : ''
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="text-xs">{item.dayNum}</span>
                      {isToday && (
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 dark:bg-indigo-300" />
                      )}
                    </div>
                    <div className="text-[10px] truncate opacity-90 font-medium">
                      {item.scheduledCount > 0
                        ? `${item.completedCount}/${item.scheduledCount} (${item.completionPct}%)`
                        : 'Rest'}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Heatmap Legend */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 text-[11px] text-slate-500 border-t border-slate-100 dark:border-slate-800">
              <span className="text-slate-400">
                Click any day above to inspect scheduled habit performance
              </span>
              <div className="flex items-center gap-1.5">
                <span>0% / Rest</span>
                <div className="w-3.5 h-3.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700" />
                <div className="w-3.5 h-3.5 rounded bg-emerald-100 dark:bg-emerald-950/40 border border-emerald-200" />
                <div className="w-3.5 h-3.5 rounded bg-emerald-200 dark:bg-emerald-900 border border-emerald-300" />
                <div className="w-3.5 h-3.5 rounded bg-emerald-400 border border-emerald-500" />
                <div className="w-3.5 h-3.5 rounded bg-emerald-500 border border-emerald-600" />
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">100% Done</span>
              </div>
            </div>
          </div>

          {/* Selected Day Drilldown Card */}
          <div className="bg-slate-50 dark:bg-slate-800/50 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 space-y-4">
            <div className="border-b border-slate-200/80 dark:border-slate-700 pb-3">
              <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                Day Drilldown
              </span>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                {new Date(selectedHeatmapDay + 'T00:00:00').toLocaleDateString(undefined, {
                  weekday: 'long',
                  month: 'short',
                  day: 'numeric',
                })}
              </h3>
            </div>

            {selectedDayScheduled.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                No habits scheduled for this date (rest day).
              </div>
            ) : (
              <div className="space-y-2.5">
                {selectedDayScheduled.map((h) => {
                  const isDone = completions.some(
                    (c) => c.habitId === h.id && c.date === selectedHeatmapDay && c.completed
                  );

                  return (
                    <div
                      key={h.id}
                      className={`p-3 rounded-xl border flex items-center justify-between text-xs transition-colors ${
                        isDone
                          ? 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/60'
                          : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {isDone ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        ) : (
                          <Circle className="w-4 h-4 text-slate-300 dark:text-slate-600 shrink-0" />
                        )}
                        <span
                          className={`font-semibold truncate ${
                            isDone ? 'line-through text-slate-400' : 'text-slate-800 dark:text-slate-200'
                          }`}
                        >
                          {h.name}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400 shrink-0 font-medium">
                        {h.targetValue} {h.unit}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="p-3 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/20 text-[11px] text-indigo-900 dark:text-indigo-300">
              💡 <em>Behavioral Insight:</em> Inspecting heatmap patterns reveals clustering of peak consistency and optimal rest rhythm.
            </div>
          </div>
        </div>
      </div>

      {/* 14-Day Completion Trend Chart */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <h2 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
          14-Day Daily Completion Rate (%)
        </h2>
        <p className="text-xs text-slate-400 mb-6">Percentage of scheduled habits finished each day</p>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trendData}>
              <defs>
                <linearGradient id="rateGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.15} />
              <XAxis dataKey="displayDate" tick={{ fontSize: 11 }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} unit="%" />
              <Tooltip
                formatter={(val: any) => [`${val}%`, 'Completion Rate']}
                labelFormatter={(lbl) => `Date: ${lbl}`}
              />
              <Area
                type="monotone"
                dataKey="rate"
                stroke="#4f46e5"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#rateGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Category Performance Breakdown */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <h2 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
          Category Consistency Breakdown
        </h2>
        <p className="text-xs text-slate-400 mb-6">Which life domains receive the most consistent focus</p>

        <div className="h-60 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <RechartsBarChart data={categoryChartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.15} />
              <XAxis dataKey="category" tick={{ fontSize: 11 }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} unit="%" />
              <Tooltip formatter={(val: any) => [`${val}%`, 'Consistency']} />
              <Bar dataKey="rate" fill="#6366f1" radius={[6, 6, 0, 0]} />
            </RechartsBarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Habit-by-Habit Detail Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">
            Individual Habit Breakdown
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 font-semibold border-b border-slate-200/60 dark:border-slate-800">
              <tr>
                <th className="py-3 px-5">Habit</th>
                <th className="py-3 px-5">Category</th>
                <th className="py-3 px-5">Frequency</th>
                <th className="py-3 px-5">Current Streak</th>
                <th className="py-3 px-5">Longest Streak</th>
                <th className="py-3 px-5">Rate (30d)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {habits.map((h) => {
                const stats = calculateHabitStats(h, completions);

                return (
                  <tr key={h.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <td className="py-3 px-5 font-medium text-slate-900 dark:text-white flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: h.color || '#4f46e5' }}
                      />
                      {h.name}
                    </td>
                    <td className="py-3 px-5 text-slate-500">{h.category}</td>
                    <td className="py-3 px-5 capitalize text-slate-500">{h.frequency}</td>
                    <td className="py-3 px-5 font-semibold text-amber-600">{stats.currentStreak}d</td>
                    <td className="py-3 px-5 text-slate-500">{stats.longestStreak}d</td>
                    <td className="py-3 px-5 font-bold text-slate-800 dark:text-slate-200">
                      {stats.completionRate}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* SEND REPORT TO EMAIL MODAL */}
      {showEmailModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-150 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Send Report to Email
                  </h3>
                  <p className="text-[11px] text-slate-400">Delivered via Resend Email API</p>
                </div>
              </div>
              <button
                onClick={() => setShowEmailModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {emailSuccessMsg ? (
              <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>{emailSuccessMsg}</span>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Recipient Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={emailRecipient}
                    onChange={(e) => setEmailRecipient(e.target.value)}
                    placeholder="user@example.com"
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none"
                  />
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Workspace:</span>
                    <span className="font-bold">{activeTenant?.name || 'Workspace'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Period:</span>
                    <span className="font-bold">{monthName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Monthly Consistency:</span>
                    <span className="font-bold text-emerald-600">{monthlyConsistencyPct}%</span>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowEmailModal(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:bg-slate-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSendEmailReport}
                    disabled={emailSending}
                    className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md shadow-purple-600/30 flex items-center gap-1.5 transition-all disabled:opacity-60"
                  >
                    <Send className={`w-3.5 h-3.5 ${emailSending ? 'animate-spin' : ''}`} />
                    {emailSending ? 'Dispatching Email...' : 'Send Report Now'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* PRINTABLE REPORT PREVIEW MODAL */}
      {showPrintModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[90vh] overflow-y-auto space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                HabitFlow Executive Progress Report
              </h2>
              <button
                onClick={() => setShowPrintModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs text-slate-700 dark:text-slate-300">
              <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800">
                <div>
                  <span className="text-slate-400">User:</span>{' '}
                  <strong>{userProfile?.displayName || 'User'}</strong>
                </div>
                <div>
                  <span className="text-slate-400">Workspace:</span>{' '}
                  <strong>{activeTenant?.name || 'Workspace'}</strong>
                </div>
                <div>
                  <span className="text-slate-400">Date:</span> {new Date().toLocaleDateString()}
                </div>
                <div>
                  <span className="text-slate-400">Overall Rate:</span>{' '}
                  <strong>{Math.round(avgConsistency)}%</strong>
                </div>
              </div>

              <h3 className="font-bold text-sm mt-4">Habit Status Table</h3>
              <table className="w-full text-left border border-slate-200 dark:border-slate-700">
                <thead className="bg-slate-100 dark:bg-slate-800">
                  <tr>
                    <th className="p-2 border">Habit</th>
                    <th className="p-2 border">Category</th>
                    <th className="p-2 border">Streak</th>
                    <th className="p-2 border">Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {habits.map((h) => {
                    const stats = calculateHabitStats(h, completions);
                    return (
                      <tr key={h.id}>
                        <td className="p-2 border font-medium">{h.name}</td>
                        <td className="p-2 border">{h.category}</td>
                        <td className="p-2 border">{stats.currentStreak} days</td>
                        <td className="p-2 border">{stats.completionRate}%</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-200 dark:border-slate-800">
              <button
                onClick={() => setShowPrintModal(false)}
                className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-semibold"
              >
                Close
              </button>
              <button
                onClick={() => window.print()}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm"
              >
                <Printer className="w-4 h-4" /> Print Document
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
