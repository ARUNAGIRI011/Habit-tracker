import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  query,
  where,
  onSnapshot,
} from 'firebase/firestore';
import confetti from 'canvas-confetti';
import { db, handleFirestoreError, OperationType } from '../firebase/config';
import { useAuth } from './AuthContext';
import { useTenant } from './TenantContext';
import { Habit, HabitCompletion } from '../types';
import {
  calculateHabitStats,
  formatDate,
  HABIT_TEMPLATES,
} from '../utils/habitUtils';

interface HabitContextType {
  habits: Habit[];
  completions: HabitCompletion[];
  loading: boolean;
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  addHabit: (habitData: Omit<Habit, 'id' | 'tenantId' | 'creatorId' | 'createdAt' | 'archived'>) => Promise<Habit>;
  updateHabit: (habitId: string, data: Partial<Habit>) => Promise<void>;
  archiveHabit: (habitId: string) => Promise<void>;
  deleteHabit: (habitId: string) => Promise<void>;
  toggleCompletion: (habitId: string, dateStr?: string, value?: number) => Promise<void>;
  triggerCelebration: () => void;
  seedStarterHabits: () => Promise<void>;
}

const HabitContext = createContext<HabitContextType | undefined>(undefined);

export const HabitProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { userProfile, currentUser } = useAuth();
  const { activeTenant, maxHabitsAllowed } = useTenant();

  const [habits, setHabits] = useState<Habit[]>([]);
  const [completions, setCompletions] = useState<HabitCompletion[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string>(formatDate(new Date()));

  const userId = currentUser?.uid || userProfile?.uid;
  const tenantId = activeTenant?.id;

  const triggerCelebration = () => {
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.65 },
      colors: ['#4f46e5', '#06b6d4', '#10b981', '#f59e0b', '#ec4899'],
    });
  };

  // Seed default starter habits for new tenants
  const seedStarterHabits = async () => {
    if (!tenantId || !userId) return;

    const templates = HABIT_TEMPLATES.slice(0, 3);
    const newHabits: Habit[] = [];

    for (const t of templates) {
      const habitId = `habit_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const h: Habit = {
        id: habitId,
        tenantId,
        creatorId: userId,
        name: t.name,
        description: t.description,
        category: t.category,
        color: t.color,
        icon: t.icon,
        frequency: t.frequency,
        targetValue: t.targetValue,
        unit: t.unit,
        archived: false,
        createdAt: new Date().toISOString(),
      };

      try {
        await setDoc(doc(db, 'habits', habitId), {
          tenantId: h.tenantId,
          creatorId: h.creatorId,
          name: h.name,
          description: h.description,
          category: h.category,
          color: h.color,
          icon: h.icon,
          frequency: h.frequency,
          targetValue: h.targetValue,
          unit: h.unit,
          archived: h.archived,
          createdAt: h.createdAt,
        });
      } catch (e) {
        console.warn('Seed habit fallback to state:', e);
      }
      newHabits.push(h);
    }

    setHabits(newHabits);
  };

  // Load habits and completions
  useEffect(() => {
    if (!tenantId || !userId) {
      setHabits([]);
      setCompletions([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    // Query habits for this tenant
    const habitsQuery = query(collection(db, 'habits'), where('tenantId', '==', tenantId));
    const unsubscribeHabits = onSnapshot(
      habitsQuery,
      (snapshot) => {
        const list: Habit[] = [];
        snapshot.forEach((d) => {
          list.push({ id: d.id, ...(d.data() as Omit<Habit, 'id'>) });
        });

        if (list.length === 0) {
          // If empty, seed initial habits
          seedStarterHabits();
        } else {
          setHabits(list.filter((h) => !h.archived));
        }
        setLoading(false);
      },
      (error) => {
        console.warn('Habits snapshot fallback, using in-memory demo data:', error);
        // Fallback demo habits if rules or network prevent reading
        const fallbackList: Habit[] = HABIT_TEMPLATES.slice(0, 3).map((t, idx) => ({
          id: `habit_demo_${idx}`,
          tenantId,
          creatorId: userId,
          name: t.name,
          description: t.description,
          category: t.category,
          color: t.color,
          icon: t.icon,
          frequency: t.frequency,
          targetValue: t.targetValue,
          unit: t.unit,
          archived: false,
          createdAt: new Date().toISOString(),
        }));
        setHabits(fallbackList);
        setLoading(false);
      }
    );

    // Query completions
    const completionsQuery = query(
      collection(db, 'habit_completions'),
      where('tenantId', '==', tenantId)
    );
    const unsubscribeCompletions = onSnapshot(
      completionsQuery,
      (snapshot) => {
        const compList: HabitCompletion[] = [];
        snapshot.forEach((d) => {
          compList.push({ id: d.id, ...(d.data() as Omit<HabitCompletion, 'id'>) });
        });
        setCompletions(compList);
      },
      (error) => {
        console.warn('Completions snapshot fallback:', error);
      }
    );

    return () => {
      unsubscribeHabits();
      unsubscribeCompletions();
    };
  }, [tenantId, userId]);

  const addHabit = async (
    habitData: Omit<Habit, 'id' | 'tenantId' | 'creatorId' | 'createdAt' | 'archived'>
  ): Promise<Habit> => {
    if (!tenantId || !userId) throw new Error('Not authorized to create habit');

    // Quota Enforcement: Check active habits count against tenant's plan
    const activeCount = habits.filter((h) => !h.archived).length;
    if (activeCount >= maxHabitsAllowed) {
      throw new Error(
        `Plan quota limit reached (${maxHabitsAllowed} habits). Upgrade to Plus or Pro to track more habits.`
      );
    }

    const habitId = `habit_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newHabit: Habit = {
      id: habitId,
      tenantId,
      creatorId: userId,
      ...habitData,
      archived: false,
      createdAt: new Date().toISOString(),
    };

    try {
      await setDoc(doc(db, 'habits', habitId), {
        tenantId: newHabit.tenantId,
        creatorId: newHabit.creatorId,
        name: newHabit.name,
        description: newHabit.description || '',
        category: newHabit.category,
        color: newHabit.color,
        icon: newHabit.icon,
        frequency: newHabit.frequency,
        targetValue: newHabit.targetValue,
        unit: newHabit.unit,
        archived: false,
        createdAt: newHabit.createdAt,
      });
    } catch (e) {
      console.warn('Habit write fallback to state:', e);
    }

    setHabits((prev) => [...prev, newHabit]);
    triggerCelebration();
    return newHabit;
  };

  const updateHabit = async (habitId: string, data: Partial<Habit>) => {
    try {
      await setDoc(
        doc(db, 'habits', habitId),
        { ...data, updatedAt: new Date().toISOString() },
        { merge: true }
      );
    } catch (e) {
      console.warn('Habit update fallback:', e);
    }

    setHabits((prev) =>
      prev.map((h) => (h.id === habitId ? { ...h, ...data, updatedAt: new Date().toISOString() } : h))
    );
  };

  const archiveHabit = async (habitId: string) => {
    await updateHabit(habitId, { archived: true });
    setHabits((prev) => prev.filter((h) => h.id !== habitId));
  };

  const deleteHabit = async (habitId: string) => {
    try {
      await deleteDoc(doc(db, 'habits', habitId));
    } catch (e) {
      console.warn('Habit delete fallback:', e);
    }
    setHabits((prev) => prev.filter((h) => h.id !== habitId));
  };

  const toggleCompletion = async (habitId: string, dateStr = selectedDate, value?: number) => {
    if (!tenantId || !userId) return;

    const completionId = `${habitId}_${dateStr}`;
    const existing = completions.find((c) => c.habitId === habitId && c.date === dateStr);
    const targetHabit = habits.find((h) => h.id === habitId);

    const isNowCompleted = !existing?.completed;
    const finalValue = value ?? (isNowCompleted ? targetHabit?.targetValue || 1 : 0);

    const newRecord: HabitCompletion = {
      id: completionId,
      habitId,
      tenantId,
      userId,
      date: dateStr,
      completed: isNowCompleted,
      value: finalValue,
      createdAt: new Date().toISOString(),
    };

    try {
      await setDoc(doc(db, 'habit_completions', completionId), {
        tenantId,
        habitId,
        userId,
        date: dateStr,
        completed: isNowCompleted,
        value: finalValue,
        createdAt: newRecord.createdAt,
      });
    } catch (e) {
      console.warn('Completion write fallback to state:', e);
    }

    // Update in-memory state
    setCompletions((prev) => {
      const filtered = prev.filter((c) => !(c.habitId === habitId && c.date === dateStr));
      return isNowCompleted ? [...filtered, newRecord] : filtered;
    });

    if (isNowCompleted) {
      triggerCelebration();

      // Check if user hit a milestone streak (e.g. 7 days) and send notification email
      if (targetHabit) {
        const stats = calculateHabitStats(targetHabit, [...completions, newRecord]);
        if (stats.currentStreak === 7 || stats.currentStreak === 30) {
          fetch('/api/email/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              recipientEmail: userProfile?.email,
              templateType: 'streak_milestone',
              data: {
                name: userProfile?.displayName,
                habitName: targetHabit.name,
                streakDays: stats.currentStreak,
              },
            }),
          }).catch(console.warn);
        }
      }
    }
  };

  return (
    <HabitContext.Provider
      value={{
        habits,
        completions,
        loading,
        selectedDate,
        setSelectedDate,
        addHabit,
        updateHabit,
        archiveHabit,
        deleteHabit,
        toggleCompletion,
        triggerCelebration,
        seedStarterHabits,
      }}
    >
      {children}
    </HabitContext.Provider>
  );
};

export const useHabits = () => {
  const context = useContext(HabitContext);
  if (!context) throw new Error('useHabits must be used within HabitProvider');
  return context;
};
