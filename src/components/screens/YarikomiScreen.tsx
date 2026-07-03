import { useState } from 'react';
import { motion } from 'framer-motion';
import { ACHIEVEMENTS, CHALLENGES, MISSION_POOL, type Mission, type ChallengeMod } from '@/game/meta';
import type { UseMetaResult } from '@/hooks/useMeta';

type Tab = 'achievements' | 'missions' | 'challenges';

interface Props {
  meta: UseMetaResult;
  onBack: () => void;
  onLaunchChallenge: (c: ChallengeMod) => void;
}

const YarikomiScreen = ({ meta, onBack, onLaunchChallenge }: Props) => {
  const [tab, setTab] = useState<Tab>('missions');
  const { progress, missionProgress, claimMission, isChallengeCleared } = meta;

  const dailyMissions: Mission[] = progress.activeDaily
    .map(id => MISSION_POOL.find(m => m.id === id))
    .filter((m): m is Mission => !!m);
  const weeklyMissions: Mission[] = progress.activeWeekly
    .map(id => MISSION_POOL.find(m => m.id === id))
    .filter((m): m is Mission => !!m);

  return (
    <div className="min-h-[100dvh] p-4 bg-background text-foreground">
      <div className="max-w-md mx-auto space-y-3">
        <div className="flex items-center justify-between">
          <button onClick={onBack} className="game-btn-ghost text-xs">← 戻る</button>
          <h1 className="text-lg font-black text-yellow-300">🏅 やり込み</h1>
          <div className="text-[10px] text-purple-300 px-2 py-0.5 rounded bg-purple-500/10 border border-purple-500/30">
            🔥 {progress.loginStreak}日連続
          </div>
        </div>

        <div className="grid grid-cols-3 gap-1">
          {(['missions', 'achievements', 'challenges'] as Tab[]).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`py-1.5 text-xs font-bold rounded ${tab === t ? 'bg-yellow-500 text-black' : 'bg-white/5 text-yellow-200'}`}>
              {t === 'missions' ? '📋 ミッション' : t === 'achievements' ? '🎖️ 実績' : '🔥 チャレンジ'}
            </button>
          ))}
        </div>

        {tab === 'missions' && (
          <div className="space-y-3">
            <MissionList label="🌅 デイリー" missions={dailyMissions} claimed={progress.claimedDaily}
              missionProgress={missionProgress} onClaim={claimMission} resetLabel="毎日リセット" />
            <MissionList label="🗓️ ウィークリー" missions={weeklyMissions} claimed={progress.claimedWeekly}
              missionProgress={missionProgress} onClaim={claimMission} resetLabel="毎週リセット" />
          </div>
        )}

        {tab === 'achievements' && (
          <div className="space-y-1.5">
            <div className="text-[10px] text-muted-foreground text-center">
              解放 {progress.achievementsUnlocked.length}/{ACHIEVEMENTS.length}
            </div>
            {ACHIEVEMENTS.map(a => {
              const unlocked = progress.achievementsUnlocked.includes(a.id);
              return (
                <motion.div key={a.id} layout
                  className={`glass-panel p-2.5 flex items-center gap-2 ${unlocked ? 'border-yellow-500/50' : 'opacity-60'}`}>
                  <div className="text-2xl">{unlocked ? a.icon : '🔒'}</div>
                  <div className="flex-1 min-w-0">
                    <div className={`text-sm font-bold ${unlocked ? 'text-yellow-300' : 'text-muted-foreground'}`}>{a.name}</div>
                    <div className="text-[10px] text-muted-foreground truncate">{a.desc}</div>
                  </div>
                  <div className={`text-[10px] font-bold ${unlocked ? 'text-yellow-400' : 'text-muted-foreground'}`}>
                    +{a.volts}⚡
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {tab === 'challenges' && (
          <div className="space-y-2">
            <div className="text-[10px] text-muted-foreground text-center">
              制覇 {progress.challengeClears.length}/{CHALLENGES.length}
            </div>
            {CHALLENGES.map(c => {
              const cleared = isChallengeCleared(c.id);
              return (
                <div key={c.id} className={`glass-panel p-3 ${cleared ? 'border-emerald-500/50' : ''}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xl">{c.icon}</span>
                    <span className="font-bold text-sm text-yellow-200">{c.name}</span>
                    {cleared && <span className="text-[10px] text-emerald-400 font-bold">✓ CLEAR</span>}
                    <span className="ml-auto text-[10px] text-yellow-400 font-bold">+{c.volts}⚡</span>
                  </div>
                  <div className="text-[11px] text-muted-foreground mb-2">{c.desc}</div>
                  <div className="text-[10px] text-cyan-300 mb-2">
                    難易度: {c.diff.toUpperCase()} / エリア: {c.area}
                  </div>
                  <button onClick={() => onLaunchChallenge(c)}
                    className="w-full py-1.5 text-xs font-bold rounded"
                    style={{ background: cleared ? 'rgba(16,185,129,0.2)' : 'linear-gradient(135deg,#ef4444,#f97316)', color: '#fff' }}>
                    {cleared ? '🔁 再挑戦' : '▶ 挑戦する'}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

const MissionList = ({
  label, missions, claimed, missionProgress, onClaim, resetLabel,
}: {
  label: string;
  missions: Mission[];
  claimed: string[];
  missionProgress: (m: Mission) => number;
  onClaim: (id: string) => number;
  resetLabel: string;
}) => (
  <div>
    <div className="flex items-center justify-between mb-1">
      <div className="text-xs font-bold text-cyan-200">{label}</div>
      <div className="text-[9px] text-muted-foreground">{resetLabel}</div>
    </div>
    <div className="space-y-1.5">
      {missions.map(m => {
        const prog = Math.min(missionProgress(m), m.target);
        const done = prog >= m.target;
        const isClaimed = claimed.includes(m.id);
        return (
          <div key={m.id} className={`glass-panel p-2.5 ${isClaimed ? 'opacity-50' : ''}`}>
            <div className="flex items-center justify-between mb-1">
              <div className="text-xs font-bold">{m.name}</div>
              <div className="text-[10px] text-yellow-400 font-bold">+{m.volts}⚡</div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all"
                  style={{ width: `${(prog / m.target) * 100}%`, background: done ? '#facc15' : '#0ea5e9' }} />
              </div>
              <div className="text-[10px] text-muted-foreground w-14 text-right">{prog}/{m.target}</div>
              <button disabled={!done || isClaimed} onClick={() => onClaim(m.id)}
                className="text-[10px] font-bold px-2 py-1 rounded disabled:opacity-30"
                style={{ background: done && !isClaimed ? 'linear-gradient(135deg,#facc15,#eab308)' : 'rgba(255,255,255,0.05)', color: done && !isClaimed ? '#000' : '#888' }}>
                {isClaimed ? '受取済' : '受取'}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  </div>
);

export default YarikomiScreen;
