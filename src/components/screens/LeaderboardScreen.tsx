import { useState } from 'react';
import { useLeaderboard } from '@/hooks/useLeaderboard';
import { useAuth } from '@/hooks/useAuth';
import type { DifficultyKey } from '@/game/types';

const DIFFS: (DifficultyKey | 'all')[] = ['all', 'normal', 'hard', 'extreme', 'endless'];
const LABEL: Record<string, string> = { all: '全難易度', normal: 'NORMAL', hard: 'HARD', extreme: 'EXTREME', endless: 'ENDLESS' };

const LeaderboardScreen = ({ onBack }: { onBack: () => void }) => {
  const [diff, setDiff] = useState<DifficultyKey | 'all'>('all');
  const { rows, loading, refresh } = useLeaderboard(diff);
  const { user } = useAuth();

  return (
    <div className="min-h-[100dvh] p-4 bg-background text-foreground">
      <div className="max-w-md mx-auto space-y-3">
        <div className="flex items-center justify-between">
          <button onClick={onBack} className="game-btn-ghost text-xs">← 戻る</button>
          <h1 className="text-lg font-black text-cyan-300">🏆 オンライン Top100</h1>
          <button onClick={refresh} className="game-btn-ghost text-xs">↻</button>
        </div>
        <div className="flex gap-1 flex-wrap">
          {DIFFS.map(d => (
            <button key={d} onClick={() => setDiff(d)}
              className={`px-2 py-1 rounded text-[10px] font-bold ${diff === d ? 'bg-cyan-500 text-black' : 'bg-white/5 text-cyan-200'}`}>
              {LABEL[d]}
            </button>
          ))}
        </div>
        {loading && <div className="text-xs text-muted-foreground text-center py-6">読み込み中…</div>}
        <div className="glass-panel divide-y divide-white/5">
          {rows.length === 0 && !loading && <div className="p-4 text-center text-xs text-muted-foreground">まだ記録がありません</div>}
          {rows.map((r, i) => (
            <div key={r.user_id + r.diff} className={`p-2.5 flex items-center gap-2 ${r.user_id === user?.id ? 'bg-cyan-500/10' : ''}`}>
              <div className={`w-8 text-center font-black ${i < 3 ? 'text-yellow-400' : 'text-muted-foreground'}`}>{i + 1}</div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-bold truncate">{r.display_name}</div>
                <div className="text-[10px] text-muted-foreground">{LABEL[r.diff]} · Wave {r.wave}</div>
              </div>
              <div className="text-cyan-300 font-black text-sm">{Number(r.score).toLocaleString()}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LeaderboardScreen;
