import { useState, useCallback, useEffect } from 'react';
import type { TowerID } from '@/game/types';
import { safeGetItem, safeSetItem, safeRemoveItem } from '@/lib/persistence';

const REDEEMED_KEY = 'kaden-td-redeemed-codes';
const ADMIN_KEY    = 'kaden-td-admin-mode';

export interface CodeReward {
  volts?: number;
  pulls?: number;
  unit?: TowerID;
  desc: string;
}

export interface CampaignCode {
  code: string;
  reward: CodeReward;
  createdAt: number;
}

const loadRedeemed = (): string[] => {
  try {
    const parsed = JSON.parse(safeGetItem(REDEEMED_KEY) || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch { return []; }
};
const saveRedeemed = (r: string[]) => safeSetItem(REDEEMED_KEY, JSON.stringify(r));
const loadAdmin = () => safeGetItem(ADMIN_KEY) === '1';

export const useCampaignCodes = () => {
  const [codes, setCodes]       = useState<CampaignCode[]>([]);
  const [redeemed, setRedeemed] = useState<string[]>(loadRedeemed);
  const [isAdmin, setIsAdmin]   = useState<boolean>(loadAdmin);

  // Fetch + realtime subscribe + polling fallback + visibility refresh
  useEffect(() => {
    let active = true;
    let channel: any = null;
    let pollId: ReturnType<typeof setInterval> | null = null;
    const fetchAll = async () => {
      try {
        const { supabase } = await import('@/integrations/supabase/client');
        const { data } = await supabase.from('campaign_codes').select('*').order('created_at', { ascending: false });
        if (!active || !data) return;
        setCodes(data.map((r: any) => ({ code: r.code, reward: r.reward, createdAt: new Date(r.created_at).getTime() })));
        if (!channel) {
          channel = supabase.channel('campaign_codes_sync')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'campaign_codes' }, () => fetchAll())
            .subscribe();
        }
      } catch {
        if (active) setCodes([]);
      }
    };
    fetchAll();
    // Polling fallback (every 30s) in case realtime is blocked
    pollId = setInterval(fetchAll, 30_000);
    const onVisible = () => { if (document.visibilityState === 'visible') fetchAll(); };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      active = false;
      if (pollId) clearInterval(pollId);
      document.removeEventListener('visibilitychange', onVisible);
      if (channel) import('@/integrations/supabase/client').then(({ supabase }) => supabase.removeChannel(channel)).catch(() => undefined);
    };
  }, []);

  const activateAdmin = useCallback(() => {
    safeSetItem(ADMIN_KEY, '1');
    setIsAdmin(true);
  }, []);

  const deactivateAdmin = useCallback(() => {
    safeRemoveItem(ADMIN_KEY);
    setIsAdmin(false);
  }, []);

  const redeemCode = useCallback((input: string): { ok: true; reward: CodeReward } | { ok: false; error: string } => {
    const upper = input.trim().toUpperCase();
    if (upper === 'CEO') {
      activateAdmin();
      return { ok: true, reward: { desc: '管理者モード有効化' } };
    }
    if (redeemed.includes(upper)) return { ok: false, error: 'このコードは既に使用済みです。' };
    const found = codes.find(c => c.code.toUpperCase() === upper);
    if (!found) return { ok: false, error: '無効なコードです。' };
    const next = [...redeemed, upper];
    saveRedeemed(next);
    setRedeemed(next);
    return { ok: true, reward: found.reward };
  }, [codes, redeemed, activateAdmin]);

  const createCode = useCallback(async (code: string, reward: CodeReward): Promise<boolean> => {
    if (!code.trim()) return false;
    const upper = code.trim().toUpperCase();
    try {
      const { supabase } = await import('@/integrations/supabase/client');
      const { data, error } = await supabase.functions.invoke('manage-codes', {
        body: { action: 'create', code: upper, reward },
        headers: { 'x-admin-token': 'CEO' },
      });
      if (error || (data as any)?.error) return false;
      return true;
    } catch { return false; }
  }, []);

  const deleteCode = useCallback(async (code: string) => {
    try {
      const { supabase } = await import('@/integrations/supabase/client');
      await supabase.functions.invoke('manage-codes', {
        body: { action: 'delete', code: code.toUpperCase() },
        headers: { 'x-admin-token': 'CEO' },
      });
    } catch { /* ignore */ }
  }, []);

  return { codes, redeemed, isAdmin, activateAdmin, deactivateAdmin, redeemCode, createCode, deleteCode };
};
