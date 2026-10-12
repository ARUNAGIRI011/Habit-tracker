export type TenantType = 'personal' | 'organization';
export type TenantRole = 'owner' | 'admin' | 'member';
export type PlanId = 'free' | 'plus' | 'pro' | 'team';
export type SubscriptionStatus = 'active' | 'trialing' | 'past_due' | 'expired' | 'cancelled';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  timezone: string;
  createdAt?: string;
}

export interface Tenant {
  id: string;
  name: string;
  type: TenantType;
  ownerId: string;
  plan: PlanId;
  status: SubscriptionStatus;
  trialEndsAt?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface TenantMember {
  id: string;
  tenantId: string;
  userId: string;
  role: TenantRole;
  email: string;
  joinedAt: string;
}

export interface Habit {
  id: string;
  tenantId: string;
  creatorId: string;
  name: string;
  description: string;
  category: string;
  color: string;
  icon: string;
  frequency: 'daily' | 'weekdays' | 'weekends' | 'custom';
  targetDays?: string[]; // e.g. ['mon', 'wed', 'fri']
  targetValue: number;
  unit: string;
  reminderTime?: string;
  archived: boolean;
  createdAt: string;
  updatedAt?: string;
  streak?: {
    current: number;
    longest: number;
    completionRate: number;
  };
}

export interface HabitCompletion {
  id: string; // usually `${habitId}_${date}`
  habitId: string;
  tenantId: string;
  userId: string;
  date: string; // YYYY-MM-DD
  completed: boolean;
  value: number;
  notes?: string;
  createdAt: string;
}

export interface Subscription {
  tenantId: string;
  planId: PlanId;
  status: SubscriptionStatus;
  billingCycle: 'monthly' | 'yearly';
  currentPeriodEnd?: string;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  updatedAt?: string;
}

export interface PaymentTransaction {
  id: string;
  tenantId: string;
  userId: string;
  orderId: string;
  paymentId: string;
  amount: number;
  currency: string;
  status: string;
  planId: string;
  createdAt: string;
}

export interface Invitation {
  id: string;
  tenantId: string;
  email: string;
  role: 'admin' | 'member';
  invitedBy: string;
  status: 'pending' | 'accepted' | 'revoked';
  createdAt: string;
}

export interface TeamChallenge {
  id: string;
  tenantId: string;
  title: string;
  description: string;
  targetCount: number;
  currentCount: number;
  startDate: string;
  endDate: string;
  participants: string[];
}

export interface UserPreferences {
  theme: 'light' | 'dark';
  timezone: string;
  quietHoursStart: string; // e.g. "22:00"
  quietHoursEnd: string;   // e.g. "07:00"
  emailDailyReminder: boolean;
  emailWeeklyReport: boolean;
  emailMilestones: boolean;
  currency: 'INR' | 'USD';
}

export interface HabitTemplate {
  name: string;
  description: string;
  category: string;
  color: string;
  icon: string;
  frequency: 'daily' | 'weekdays' | 'weekends' | 'custom';
  targetValue: number;
  unit: string;
}
