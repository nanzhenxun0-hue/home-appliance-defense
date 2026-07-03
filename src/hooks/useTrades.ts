import { useCallback, useEffect, useState } from 'react';
import type { TowerID } from '@/game/types';
import { getSupabaseClient } from '@/lib/cloud';

export interface TradeItem { tower_id: TowerID; count: number; }
export interface Trade {
  id: string;
  from_user: string;
  to_user: string;
  offer: TradeItem[];
  request: TradeItem[];
  status: 'pending' | 'accepted' | 'declined' | 'cancelled';
  created_at: string;
}

export const useTrades = (userId: string | undefined) => {
  const [incoming, setIncoming] = useState<Trade[]>([]);
  const [outgoing, setOutgoing] = useState<Trade[]>([]);
  const [history, setHistory]   = useState<Trade[]>([]);

  const refresh = useCallback(async () => {
    if (!userId) return;
    const supabase = await getSupabaseClient();
    if (!supabase) return;
    const { data } = await supabase.from('trades' as any).select('*')
      .or(`from_user.eq.${userId},to_user.eq.${userId}`)
      .order('created_at', { ascending: false }).limit(50);
    const all = ((data as any) ?? []) as Trade[];
    setIncoming(all.filter(t => t.to_user === userId && t.status === 'pending'));
    setOutgoing(all.filter(t => t.from_user === userId && t.status === 'pending'));
    setHistory(all.filter(t => t.status !== 'pending'));
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    refresh();
    let active = true;
    let ch: any = null;
    getSupabaseClient().then(supabase => {
      if (!active || !supabase) return;
      ch = supabase.channel(`trades-${userId}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'trades' }, () => refresh())
        .subscribe();
    });
    return () => {
      active = false;
      if (ch) getSupabaseClient().then(supabase => supabase?.removeChannel(ch));
    };
  }, [userId, refresh]);

  const send = useCallback(async (toFriendCode: string, offer: TradeItem[], request: TradeItem[]) => {
    if (!userId) return { ok: false, error: 'not_authenticated' };
    const supabase = await getSupabaseClient();
    if (!supabase) return { ok: false, error: 'backend_unavailable' };
    const { data: p } = await supabase.from('profiles').select('id').eq('friend_code', toFriendCode.trim().toUpperCase()).maybeSingle();
    if (!p) return { ok: false, error: 'friend_not_found' };
    if ((p as any).id === userId) return { ok: false, error: 'self' };
    const { error } = await supabase.from('trades' as any).insert({
      from_user: userId, to_user: (p as any).id, offer, request,
    });
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  }, [userId]);

  const accept = useCallback(async (id: string) => {
    const supabase = await getSupabaseClient();
    if (!supabase) return { ok: false, error: 'backend_unavailable' };
    const { data, error } = await supabase.rpc('execute_trade' as any, { _trade_id: id });
    if (error) return { ok: false, error: error.message };
    return data as any;
  }, []);

  const decline = useCallback(async (id: string) => {
    const supabase = await getSupabaseClient();
    if (!supabase) return;
    await supabase.from('trades' as any).update({ status: 'declined' }).eq('id', id);
  }, []);

  const cancel = useCallback(async (id: string) => {
    const supabase = await getSupabaseClient();
    if (!supabase) return;
    await supabase.from('trades' as any).update({ status: 'cancelled' }).eq('id', id);
  }, []);

  return { incoming, outgoing, history, send, accept, decline, cancel, refresh };
};

// Sync local inventory counts up to server (called once after login).
export const syncInventoryUp = async (userId: string, counts: Partial<Record<TowerID, number>>) => {
  const supabase = await getSupabaseClient();
  if (!supabase) return;
  const rows = Object.entries(counts)
    .filter(([, c]) => (c ?? 0) > 0)
    .map(([tower_id, count]) => ({ user_id: userId, tower_id, count }));
  if (!rows.length) return;
  await supabase.from('inventories' as any).upsert(rows, { onConflict: 'user_id,tower_id' });
};

export const fetchInventory = async (userId: string): Promise<Partial<Record<TowerID, number>>> => {
  const supabase = await getSupabaseClient();
  if (!supabase) return {};
  const { data } = await supabase.from('inventories' as any).select('tower_id,count').eq('user_id', userId);
  const out: Partial<Record<TowerID, number>> = {};
  for (const r of (data ?? []) as any[]) out[r.tower_id as TowerID] = r.count;
  return out;
};
