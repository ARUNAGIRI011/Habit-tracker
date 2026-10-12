import React, { useState } from 'react';
import {
  Check,
  Zap,
  ShieldCheck,
  CreditCard,
  Sparkles,
  ArrowRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { useTenant } from '../context/TenantContext';
import { useAuth } from '../context/AuthContext';
import { PlanId } from '../types';

declare global {
  interface Window {
    Razorpay?: any;
  }
}

export const PricingView: React.FC = () => {
  const { activeTenant, updatePlan } = useTenant();
  const { userProfile } = useAuth();

  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [processingPlanId, setProcessingPlanId] = useState<string | null>(null);
  const [paymentSuccessData, setPaymentSuccessData] = useState<any>(null);
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
  const [checkoutOrder, setCheckoutOrder] = useState<any>(null);

  const plans = [
    {
      id: 'free',
      name: 'Free Starter',
      price: 0,
      priceYearly: 0,
      description: 'Essential daily habit tracking for individuals building cornerstone routines.',
      maxHabits: '5 active habits',
      features: [
        'Up to 5 active habits',
        'Daily interactive checklist',
        'Current streak counter',
        '7-day historical progress',
        'Standard categories',
        'CSV data export',
      ],
      ctaText: 'Current Plan',
      popular: false,
    },
    {
      id: 'plus',
      name: 'Plus',
      price: 99,
      priceYearly: 799,
      description: 'For committed habit builders wanting comprehensive history and custom schedules.',
      maxHabits: 'Up to 30 active habits',
      features: [
        'Up to 30 active habits',
        'Full habit heatmap & calendar history',
        'Multiple reminder schedules & quiet hours',
        'Custom categories & habit templates',
        'Weekly summary email reports',
        'Printable progress reports',
      ],
      ctaText: 'Upgrade to Plus',
      popular: false,
    },
    {
      id: 'pro',
      name: 'Pro',
      price: 199,
      priceYearly: 1499,
      description: 'Unlimited habits, AI Habit Coach powered by Gemini, and deep behavioral analytics.',
      maxHabits: 'Unlimited habits',
      features: [
        'Unlimited active habits',
        '7-Day free trial included',
        'AI Habit Coach powered by Gemini',
        'Advanced streak recovery rules',
        'Consistency score & best streaks',
        'Accountability milestones & badges',
        'Priority email notifications via Resend',
      ],
      ctaText: 'Start 7-Day Free Trial',
      popular: true,
    },
    {
      id: 'team',
      name: 'Team',
      price: 499,
      priceYearly: 4990,
      description: 'Collaborative workspaces for startups, wellness clubs, and high-performance teams.',
      maxHabits: 'Unlimited habits',
      features: [
        'Shared Organization workspace',
        '5 team members included (₹79/extra)',
        'Team challenges & leaderboard',
        'Role-based access (Owner, Admin, Member)',
        'Aggregate team consistency score',
        'Centralized invoicing & receipts',
      ],
      ctaText: 'Activate Team Plan',
      popular: false,
    },
  ];

  // Initiate Razorpay checkout
  const handleSelectPlan = async (planId: PlanId) => {
    if (planId === 'free') {
      await updatePlan('free', 'active');
      return;
    }

    setProcessingPlanId(planId);
    try {
      // 1. Create order on server
      const res = await fetch('/api/payments/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId,
          billingCycle,
          tenantId: activeTenant?.id,
          userEmail: userProfile?.email,
        }),
      });

      const orderData = await res.json();
      if (!orderData.success) {
        throw new Error(orderData.error || 'Failed to initialize payment');
      }

      setCheckoutOrder(orderData);
      setCheckoutModalOpen(true);
    } catch (e: any) {
      alert(e.message || 'Payment initiation error');
    } finally {
      setProcessingPlanId(null);
    }
  };

  // Confirm and verify payment
  const handleConfirmPayment = async (simulatedPaymentId: string) => {
    try {
      const res = await fetch('/api/payments/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          razorpay_order_id: checkoutOrder.orderId,
          razorpay_payment_id: simulatedPaymentId,
          razorpay_signature: `sig_verified_${Date.now()}`,
          planId: checkoutOrder.plan.id,
          billingCycle,
          tenantId: activeTenant?.id,
        }),
      });

      const data = await res.json();
      if (data.verified) {
        // Update tenant plan
        await updatePlan(
          checkoutOrder.plan.id as PlanId,
          checkoutOrder.plan.trialDays > 0 ? 'trialing' : 'active'
        );

        setCheckoutModalOpen(false);
        setPaymentSuccessData({
          orderId: checkoutOrder.orderId,
          paymentId: simulatedPaymentId,
          amount: checkoutOrder.amountINR,
          planName: checkoutOrder.plan.name,
        });

        // Trigger payment receipt email
        fetch('/api/email/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            recipientEmail: userProfile?.email,
            templateType: 'payment_receipt',
            data: {
              planName: checkoutOrder.plan.name,
              amount: checkoutOrder.amountINR,
              orderId: checkoutOrder.orderId,
            },
          }),
        }).catch(console.warn);
      }
    } catch (e: any) {
      alert('Payment verification failed');
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Pricing Header */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300">
          Transparent Pricing
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white">
          Invest in habits that compound for a lifetime
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Start with our generous free tier or unlock AI habit coaching and unlimited tracking with our 7-day Pro trial. Cancel anytime with one click.
        </p>

        {/* Billing Interval Toggle */}
        <div className="inline-flex items-center gap-2 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 mt-4">
          <button
            onClick={() => setBillingCycle('monthly')}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              billingCycle === 'monthly'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Monthly Billing
          </button>
          <button
            onClick={() => setBillingCycle('yearly')}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              billingCycle === 'yearly'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>Yearly Billing</span>
            <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
              Save ~30%
            </span>
          </button>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {plans.map((p) => {
          const isCurrent = activeTenant?.plan === p.id;
          const displayPrice = billingCycle === 'yearly' ? p.priceYearly : p.price;

          return (
            <div
              key={p.id}
              className={`rounded-2xl p-6 flex flex-col justify-between transition-all relative ${
                p.popular
                  ? 'bg-gradient-to-b from-indigo-50/50 via-white to-white dark:from-indigo-950/20 dark:via-slate-900 dark:to-slate-900 border-2 border-indigo-600 shadow-xl shadow-indigo-600/10'
                  : 'bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm'
              }`}
            >
              {p.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-indigo-600 text-white text-[10px] font-bold uppercase tracking-wider shadow-sm">
                  Most Popular
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">{p.name}</h3>
                  {isCurrent && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                      Active
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-400 min-h-[36px]">{p.description}</p>

                <div className="my-5">
                  <span className="text-3xl font-extrabold text-slate-900 dark:text-white">
                    ₹{displayPrice}
                  </span>
                  <span className="text-xs text-slate-400 ml-1">
                    /{billingCycle === 'yearly' ? 'year' : 'month'}
                  </span>
                </div>

                <div className="border-t border-slate-100 dark:border-slate-800 pt-4 space-y-2.5">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                    What's Included:
                  </span>
                  {p.features.map((feat, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-300">
                      <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  onClick={() => handleSelectPlan(p.id as PlanId)}
                  disabled={isCurrent || processingPlanId === p.id}
                  className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all ${
                    isCurrent
                      ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-default'
                      : p.popular
                      ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/30 active:scale-95'
                      : 'bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-800 dark:hover:bg-slate-700 active:scale-95'
                  }`}
                >
                  {isCurrent
                    ? 'Current Plan'
                    : processingPlanId === p.id
                    ? 'Initializing...'
                    : p.ctaText}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Razorpay Checkout Simulation / Live Modal */}
      {checkoutModalOpen && checkoutOrder && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-xs">
                  HF
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Razorpay Checkout
                  </h3>
                  <p className="text-[10px] text-slate-400">Order ID: {checkoutOrder.orderId}</p>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                Test Mode
              </span>
            </div>

            <div className="my-5 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 space-y-2">
              <div className="flex justify-between text-xs text-slate-500">
                <span>Plan:</span>
                <span className="font-semibold text-slate-900 dark:text-white">
                  {checkoutOrder.plan.name}
                </span>
              </div>
              <div className="flex justify-between text-xs text-slate-500">
                <span>Billing Period:</span>
                <span className="font-semibold text-slate-900 dark:text-white capitalize">
                  {checkoutOrder.plan.billingCycle}
                </span>
              </div>
              <div className="flex justify-between text-xs text-slate-500">
                <span>Amount:</span>
                <span className="font-bold text-indigo-600 dark:text-indigo-400 text-sm">
                  ₹{checkoutOrder.amountINR}
                </span>
              </div>
              {checkoutOrder.plan.trialDays > 0 && (
                <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium pt-1 border-t border-slate-200/60 dark:border-slate-700">
                  🎁 Includes {checkoutOrder.plan.trialDays}-Day Free Trial. First charge occurs after trial period.
                </div>
              )}
            </div>

            <div className="space-y-2">
              <button
                onClick={() => handleConfirmPayment(`pay_test_${Date.now()}`)}
                className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/30 flex items-center justify-center gap-2"
              >
                <CreditCard className="w-4 h-4" /> Simulate Successful Payment (₹{checkoutOrder.amountINR})
              </button>

              <button
                onClick={() => setCheckoutModalOpen(false)}
                className="w-full py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                Cancel Checkout
              </button>
            </div>

            <p className="text-[10px] text-slate-400 text-center mt-4">
              Server HMAC-SHA256 signature verification will be executed atomically upon submission.
            </p>
          </div>
        </div>
      )}

      {/* Payment Success Confirmation Alert */}
      {paymentSuccessData && (
        <div className="p-5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-bold">
                Payment Verified & {paymentSuccessData.planName} Activated!
              </h4>
              <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-0.5">
                Transaction ID: <span className="font-mono">{paymentSuccessData.paymentId}</span> · Order: <span className="font-mono">{paymentSuccessData.orderId}</span>. A receipt email has been dispatched to {userProfile?.email}.
              </p>
            </div>
          </div>
          <button
            onClick={() => setPaymentSuccessData(null)}
            className="text-xs font-semibold text-emerald-700 hover:underline shrink-0"
          >
            Dismiss
          </button>
        </div>
      )}
    </div>
  );
};
