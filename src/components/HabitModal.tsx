import React, { useState, useEffect } from 'react';
import { X, Sparkles, Clock, Target, Tag, Palette } from 'lucide-react';
import { Habit } from '../types';
import { useHabits } from '../context/HabitContext';
import { HABIT_TEMPLATES } from '../utils/habitUtils';

interface HabitModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingHabit: Habit | null;
}

const COLORS = [
  '#4f46e5', // Indigo
  '#0284c7', // Sky
  '#059669', // Emerald
  '#d97706', // Amber
  '#dc2626', // Red
  '#7c3aed', // Purple
  '#db2777', // Pink
  '#0d9488', // Teal
];

const CATEGORIES = [
  'Health & Vitality',
  'Productivity',
  'Learning',
  'Fitness',
  'Mindfulness',
  'Finance',
  'Career',
  'Personal',
];

export const HabitModal: React.FC<HabitModalProps> = ({ isOpen, onClose, editingHabit }) => {
  const { addHabit, updateHabit } = useHabits();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [color, setColor] = useState(COLORS[0]);
  const [frequency, setFrequency] = useState<'daily' | 'weekdays' | 'weekends' | 'custom'>('daily');
  const [targetValue, setTargetValue] = useState(1);
  const [unit, setUnit] = useState('times');
  const [reminderTime, setReminderTime] = useState('08:00');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (editingHabit) {
      setName(editingHabit.name);
      setDescription(editingHabit.description || '');
      setCategory(editingHabit.category);
      setColor(editingHabit.color || COLORS[0]);
      setFrequency(editingHabit.frequency);
      setTargetValue(editingHabit.targetValue || 1);
      setUnit(editingHabit.unit || 'times');
      setReminderTime(editingHabit.reminderTime || '08:00');
    } else {
      setName('');
      setDescription('');
      setCategory(CATEGORIES[0]);
      setColor(COLORS[0]);
      setFrequency('daily');
      setTargetValue(1);
      setUnit('times');
      setReminderTime('08:00');
    }
    setErrorMsg(null);
  }, [editingHabit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setSubmitting(true);
    setErrorMsg(null);

    try {
      if (editingHabit) {
        await updateHabit(editingHabit.id, {
          name: name.trim(),
          description: description.trim(),
          category,
          color,
          frequency,
          targetValue: Number(targetValue) || 1,
          unit: unit.trim() || 'times',
          reminderTime,
        });
      } else {
        await addHabit({
          name: name.trim(),
          description: description.trim(),
          category,
          color,
          icon: 'Check',
          frequency,
          targetValue: Number(targetValue) || 1,
          unit: unit.trim() || 'times',
          reminderTime,
        });
      }
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save habit');
    } finally {
      setSubmitting(false);
    }
  };

  const handleApplyTemplate = (tmpl: typeof HABIT_TEMPLATES[0]) => {
    setName(tmpl.name);
    setDescription(tmpl.description);
    setCategory(tmpl.category);
    setColor(tmpl.color);
    setFrequency(tmpl.frequency);
    setTargetValue(tmpl.targetValue);
    setUnit(tmpl.unit);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            {editingHabit ? 'Edit Habit Configuration' : 'Create New Habit'}
          </h2>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="my-3 p-3 rounded-xl bg-rose-50 text-rose-700 text-xs font-semibold">
            {errorMsg}
          </div>
        )}

        {!editingHabit && (
          <div className="my-3">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
              Quick Autofill From Template:
            </span>
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
              {HABIT_TEMPLATES.map((t) => (
                <button
                  key={t.name}
                  type="button"
                  onClick={() => handleApplyTemplate(t)}
                  className="px-2.5 py-1 rounded-lg bg-slate-50 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-[11px] font-medium text-slate-700 dark:text-slate-300 whitespace-nowrap border border-slate-200 dark:border-slate-700"
                >
                  {t.name}
                </button>
              ))}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Habit Name *
            </label>
            <input
              type="text"
              required
              maxLength={120}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. 30 Minutes Focused Reading"
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Description / Why this matters
            </label>
            <textarea
              rows={2}
              maxLength={500}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Why this habit compounds your growth..."
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Schedule Frequency
              </label>
              <select
                value={frequency}
                onChange={(e) => setFrequency(e.target.value as any)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
              >
                <option value="daily">Every Day</option>
                <option value="weekdays">Weekdays Only (Mon-Fri)</option>
                <option value="weekends">Weekends Only (Sat-Sun)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Target Daily Value
              </label>
              <input
                type="number"
                min={1}
                max={100000}
                value={targetValue}
                onChange={(e) => setTargetValue(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Metric Unit
              </label>
              <input
                type="text"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="minutes, pages, ml, times"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 items-center">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Preferred Reminder Time
              </label>
              <input
                type="time"
                value={reminderTime}
                onChange={(e) => setReminderTime(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Habit Accent Color
              </label>
              <div className="flex items-center gap-1.5">
                {COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className={`w-6 h-6 rounded-full transition-all ${
                      color === c ? 'ring-2 ring-offset-2 ring-indigo-500 scale-110' : ''
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-md shadow-indigo-600/30 disabled:opacity-60"
            >
              {submitting ? 'Saving...' : editingHabit ? 'Save Changes' : 'Create Habit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
