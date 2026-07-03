import { useCallback, useEffect, useState } from 'react';
import type { DifficultyKey } from '@/game/types';
import { getSupabaseClient } from '@/lib/cloud';

export interface LbRow {
  user_id: string;
  display_name: string;
  diff: string;
  score: number;
  wave: number;
  updated_at: string;
}

export const useLeaderboard = (diff: DifficultyKey | 'all' = 'all') => {
  const [rows, setRows] = useState<LbRow[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    const supabase = await getSupabaseClient();
    if (!supabase) { setRows([]); setLoading(false); return; }
    let q = supabase.from('leaderboard' as any).select('*').order('score', { ascending: false }).limit(100);
    if (diff !== 'all') q = q.eq('diff', diff);
    const { data } = await q;
    setRows((data as any) ?? []);
    setLoading(false);
  }, [diff]);

  useEffect(() => { refresh(); }, [refresh]);

  return { rows, loading, refresh };
};

export const submitScore = async (diff: string, score: number, wave: number) => {
  try {
    const supabase = await getSupabaseClient();
    if (!supabase) return { ok: false, reason: 'backend_unavailable' };
    const { data: s } = await supabase.auth.getSession();
    if (!s.session) return { ok: false, reason: 'not_authenticated' };
    const { data, error } = await supabase.rpc('submit_score' as any, { _diff: diff, _score: score, _wave: wave });
    if (error) return { ok: false, reason: error.message };
    return data as any;
  } catch (e) { return { ok: false, reason: String(e) }; }
};
