import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  query,
  where,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase/config';
import { useAuth } from './AuthContext';
import { Tenant, TenantMember, PlanId, SubscriptionStatus } from '../types';

interface TenantContextType {
  activeTenant: Tenant | null;
  userTenants: Tenant[];
  members: TenantMember[];
  loading: boolean;
  maxHabitsAllowed: number;
  isAiCoachingAllowed: boolean;
  isOrganization: boolean;
  switchTenant: (tenantId: string) => void;
  createTenant: (name: string, type: 'personal' | 'organization') => Promise<Tenant>;
  updatePlan: (planId: PlanId, status?: SubscriptionStatus) => Promise<void>;
  inviteMember: (email: string, role: 'admin' | 'member') => Promise<void>;
  refreshTenants: () => Promise<void>;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

export const TenantProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { userProfile, currentUser } = useAuth();
  const [activeTenant, setActiveTenant] = useState<Tenant | null>(null);
  const [userTenants, setUserTenants] = useState<Tenant[]>([]);
  const [members, setMembers] = useState<TenantMember[]>([]);
  const [loading, setLoading] = useState(true);

  const userId = currentUser?.uid || userProfile?.uid;

  const loadTenants = async () => {
    if (!userId) {
      setActiveTenant(null);
      setUserTenants([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      // Query tenants where ownerId is current user
      const tenantsRef = collection(db, 'tenants');
      const q = query(tenantsRef, where('ownerId', '==', userId));
      const snap = await getDocs(q);

      const loadedTenants: Tenant[] = [];
      snap.forEach((d) => {
        loadedTenants.push({ id: d.id, ...(d.data() as Omit<Tenant, 'id'>) });
      });

      if (loadedTenants.length === 0) {
        // Automatically provision default Personal Workspace for user
        const personalTenantId = `tenant_${userId.replace(/[^a-zA-Z0-9]/g, '').slice(0, 16)}_personal`;
        const initialTenant: Tenant = {
          id: personalTenantId,
          name: `${userProfile?.displayName || 'My'}'s Workspace`,
          type: 'personal',
          ownerId: userId,
          plan: 'pro', // Start with full Pro trial experience for smooth first impression
          status: 'trialing',
          trialEndsAt: new Date(Date.now() + 7 * 86400000).toISOString(),
          createdAt: new Date().toISOString(),
        };

        try {
          await setDoc(doc(db, 'tenants', personalTenantId), {
            name: initialTenant.name,
            type: initialTenant.type,
            ownerId: initialTenant.ownerId,
            plan: initialTenant.plan,
            status: initialTenant.status,
            createdAt: initialTenant.createdAt,
          });
        } catch (e) {
          console.warn('Initial tenant creation fallback:', e);
        }

        loadedTenants.push(initialTenant);
      }

      setUserTenants(loadedTenants);
      // Retain previous active tenant selection if valid, or select first
      const currentActiveId = localStorage.getItem('habitflow_active_tenant_id');
      const found = loadedTenants.find((t) => t.id === currentActiveId);
      setActiveTenant(found || loadedTenants[0]);
    } catch (err) {
      console.warn('Load tenants error, utilizing local workspace:', err);
      const fallbackTenant: Tenant = {
        id: `tenant_local_${userId}`,
        name: `${userProfile?.displayName || 'Personal'}'s Workspace`,
        type: 'personal',
        ownerId: userId,
        plan: 'pro',
        status: 'trialing',
        createdAt: new Date().toISOString(),
      };
      setUserTenants([fallbackTenant]);
      setActiveTenant(fallbackTenant);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTenants();
  }, [userId]);

  const switchTenant = (tenantId: string) => {
    const target = userTenants.find((t) => t.id === tenantId);
    if (target) {
      setActiveTenant(target);
      localStorage.setItem('habitflow_active_tenant_id', target.id);
    }
  };

  const createTenant = async (name: string, type: 'personal' | 'organization'): Promise<Tenant> => {
    if (!userId) throw new Error('Must be authenticated to create a workspace');

    const tenantId = `tenant_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const newTenant: Tenant = {
      id: tenantId,
      name,
      type,
      ownerId: userId,
      plan: type === 'organization' ? 'team' : 'free',
      status: 'active',
      createdAt: new Date().toISOString(),
    };

    try {
      await setDoc(doc(db, 'tenants', tenantId), {
        name: newTenant.name,
        type: newTenant.type,
        ownerId: newTenant.ownerId,
        plan: newTenant.plan,
        status: newTenant.status,
        createdAt: newTenant.createdAt,
      });
    } catch (e) {
      console.warn('Using client-side tenant creation fallback:', e);
    }

    const updated = [...userTenants, newTenant];
    setUserTenants(updated);
    setActiveTenant(newTenant);
    localStorage.setItem('habitflow_active_tenant_id', newTenant.id);
    return newTenant;
  };

  const updatePlan = async (planId: PlanId, status: SubscriptionStatus = 'active') => {
    if (!activeTenant) return;

    const updatedTenant: Tenant = {
      ...activeTenant,
      plan: planId,
      status,
      updatedAt: new Date().toISOString(),
    };

    try {
      await setDoc(
        doc(db, 'tenants', activeTenant.id),
        {
          name: updatedTenant.name,
          type: updatedTenant.type,
          ownerId: updatedTenant.ownerId,
          plan: updatedTenant.plan,
          status: updatedTenant.status,
          updatedAt: updatedTenant.updatedAt,
        },
        { merge: true }
      );
    } catch (e) {
      console.warn('Plan update fallback:', e);
    }

    setActiveTenant(updatedTenant);
    setUserTenants((prev) => prev.map((t) => (t.id === updatedTenant.id ? updatedTenant : t)));
  };

  const inviteMember = async (email: string, role: 'admin' | 'member') => {
    if (!activeTenant || !userId) return;

    const invId = `inv_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    try {
      await setDoc(doc(db, 'invitations', invId), {
        tenantId: activeTenant.id,
        email,
        role,
        invitedBy: userId,
        status: 'pending',
        createdAt: new Date().toISOString(),
      });
    } catch (e) {
      console.warn('Invite doc creation fallback:', e);
    }

    // Trigger email via backend
    try {
      await fetch('/api/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipientEmail: email,
          templateType: 'team_invite',
          data: {
            teamName: activeTenant.name,
            inviterName: userProfile?.displayName || 'A teammate',
            role,
            inviteLink: window.location.origin,
          },
        }),
      });
    } catch (e) {
      console.warn('Invite email dispatch error:', e);
    }
  };

  // Entitlement limits
  const maxHabitsAllowed =
    activeTenant?.plan === 'free' ? 5 : activeTenant?.plan === 'plus' ? 30 : 9999;

  const isAiCoachingAllowed =
    activeTenant?.plan === 'pro' || activeTenant?.plan === 'team';

  const isOrganization = activeTenant?.type === 'organization';

  return (
    <TenantContext.Provider
      value={{
        activeTenant,
        userTenants,
        members,
        loading,
        maxHabitsAllowed,
        isAiCoachingAllowed,
        isOrganization,
        switchTenant,
        createTenant,
        updatePlan,
        inviteMember,
        refreshTenants: loadTenants,
      }}
    >
      {children}
    </TenantContext.Provider>
  );
};

export const useTenant = () => {
  const context = useContext(TenantContext);
  if (!context) throw new Error('useTenant must be used within TenantProvider');
  return context;
};
