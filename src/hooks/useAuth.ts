import { useEffect, useState, useCallback } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { cloudUnavailableError, getSupabaseClient } from '@/lib/cloud';

export interface Profile {
  id: string;
  display_name: string;
  friend_code: string;
}

let cached: { session: Session | null; user: User | null } = { session: null, user: null };
const listeners = new Set<() => void>();
let initialized = false;

const notify = () => listeners.forEach(l => l());

const init = () => {
  if (initialized) return;
  initialized = true;
  getSupabaseClient().then(supabase => {
    if (!supabase) { notify(); return; }
    supabase.auth.onAuthStateChange((_ev: string, session: Session | null) => {
      cached = { session, user: session?.user ?? null };
      notify();
    });
    supabase.auth.getSession().then(({ data }: any) => {
      cached = { session: data.session, user: data.session?.user ?? null };
      notify();
    }).catch(() => notify());
  }).catch(() => notify());
};

export const useAuth = () => {
  const [, force] = useState(0);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    init();
    const l = () => force(x => x + 1);
    listeners.add(l);
    return () => { listeners.delete(l); };
  }, []);

  useEffect(() => {
    const uid = cached.user?.id;
    if (!uid) { setProfile(null); setIsAdmin(false); return; }
    let cancel = false;
    (async () => {
      const supabase = await getSupabaseClient();
      if (!supabase || cancel) return;
      const { data: p } = await supabase.from('profiles').select('*').eq('id', uid).maybeSingle();
      if (cancel) return;
      if (p) setProfile(p as Profile);
      const { data: r } = await supabase.from('user_roles' as any).select('role').eq('user_id', uid);
      if (cancel) return;
      setIsAdmin(Array.isArray(r) && (r as any[]).some(x => x.role === 'admin'));
    })();
    return () => { cancel = true; };
  }, [cached.user?.id]);

  const signIn = useCallback(async (email: string, password: string) => {
    const supabase = await getSupabaseClient();
    if (!supabase) return { data: null, error: cloudUnavailableError() } as any;
    return supabase.auth.signInWithPassword({ email, password });
  }, []);

  const signUp = useCallback(async (email: string, password: string, displayName?: string) => {
    const supabase = await getSupabaseClient();
    if (!supabase) return { data: null, error: cloudUnavailableError() } as any;
    return supabase.auth.signUp({
      email, password,
      options: {
        emailRedirectTo: window.location.origin,
        data: displayName ? { display_name: displayName } : undefined,
      },
    });
  }, []);

  const signOut = useCallback(async () => {
    const supabase = await getSupabaseClient();
    return supabase?.auth.signOut();
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    const supabase = await getSupabaseClient();
    if (!supabase) return { data: null, error: cloudUnavailableError() } as any;
    return supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
  }, []);

  const claimAdmin = useCallback(async (passcode: string) => {
    const supabase = await getSupabaseClient();
    if (!supabase) return { ok: false, error: cloudUnavailableError().message };
    const { data, error } = await supabase.rpc('claim_admin' as any, { _passcode: passcode });
    if (error) return { ok: false, error: error.message };
    if (data && (data as any).ok) { setIsAdmin(true); return { ok: true }; }
    return { ok: false, error: (data as any)?.error ?? 'failed' };
  }, []);

  return {
    session: cached.session, user: cached.user, profile, isAdmin,
    signIn, signUp, signOut, resetPassword, claimAdmin,
  };
};
