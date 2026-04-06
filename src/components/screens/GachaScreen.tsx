import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { TowerID, Rarity } from '@/game/types';
import { RARITY_COLOR, RARITY_LABEL, RARITY_ORDER, GACHA_COST, GACHA_COST_10, GACHA_RATES } from '@/game/types';
import { TDEFS } from '@/game/constants';
import ScreenCrackEffect from '@/components/game/ScreenCrackEffect';

interface GachaScreenProps {
  gacha: {
    inv: { owned: TowerID[]; volts: number; pity: number; totalPulls: number; pickup: TowerID | null; pickupBanner: string };
    pull1: () => TowerID | null;
    pull10: () => TowerID[] | null;
  };
  onBack: () => void;
  playSound?: (name: string) => void;
}

const PITY_HARD = 80;

const GachaScreen = ({ gacha, onBack, playSound }: GachaScreenProps) => {
  const [results, setResults] = useState<TowerID[]>([]);
  const [revealing, setRevealing] = useState(false);
  const [revealIdx, setRevealIdx] = useState(0);
  const [odActive, setOdActive] = useState(false);

  const hasOD = (ids: TowerID[]) => ids.some(id => TDEFS[id]?.r === 'OD');
  const hasHighRare = (ids: TowerID[]) => ids.some(id => {
    const r = TDEFS[id]?.r;
    return r === 'G' || r === 'M' || r === 'L';
  });

  const startReveal = useCallback((ids: TowerID[]) => {
    setResults(ids);
    setRevealing(true);
    setRevealIdx(0);

    if (hasOD(ids)) {
      playSound?.('gacha_od');
      setOdActive(true);
      setTimeout(() => {
        ids.forEach((_, i) => {
          setTimeout(() => {
            setRevealIdx(prev => prev + 1);
            const def = TDEFS[ids[i]];
            if (def.r === 'OD') playSound?.('gacha_od');
            else if (['G', 'M', 'L'].includes(def.r)) playSound?.('gacha_rare');
            else playSound?.('gacha_reveal');
          }, i * 250);
        });
      }, 1800);
    } else {
      playSound?.('gacha_pull');
      const delay = hasHighRare(ids) ? 600 : 300;
      ids.forEach((_, i) => {
        setTimeout(() => {
          setRevealIdx(prev => prev + 1);
          const def = TDEFS[ids[i]];
          if (['G', 'M', 'L'].includes(def.r)) playSound?.('gacha_rare');
          else playSound?.('gacha_reveal');
        }, delay + i * 200);
      });
    }
  }, [playSound]);

  const doPull1 = () => {
    const r = gacha.pull1();
    if (r) startReveal([r]);
  };

  const doPull10 = () => {
    const r = gacha.pull10();
    if (r) startReveal(r);
  };

  const isNew = (tid: TowerID) => !gacha.inv.owned.includes(tid);

  const getRarityGlow = (r: Rarity) => {
    if (r === 'OD') return '0 0 16px rgba(255,215,0,0.8), 0 0 32px rgba(255,107,0,0.4)';
    if (r === 'G') return '0 0 12px rgba(0,229,255,0.6)';
    if (r === 'M') return '0 0 12px rgba(233,30,99,0.6)';
    if (r === 'L') return '0 0 10px rgba(255,152,0,0.5)';
    return 'none';
  };

  const pityPct = Math.min((gacha.inv.pity / PITY_HARD) * 100, 100);
  const pickupDef = gacha.inv.pickup ? TDEFS[gacha.inv.pickup] : null;

  return (
    <div className="min-h-[100dvh] bg-background flex flex-col items-center p-4 relative overflow-hidden">
      <ScreenCrackEffect active={odActive} onComplete={() => setOdActive(false)} />

      <div className="absolute inset-0 z-0 opacity-20"
        style={{ background: 'radial-gradient(ellipse at 50% 30%, hsl(270 80% 30%), transparent 70%)' }} />

      <div className="relative z-10 w-full max-w-md flex flex-col items-center gap-3">
        {/* Header */}
        <div className="flex items-center justify-between w-full">
          <button onClick={() => { playSound?.('ui_back'); onBack(); }} className="game-btn-ghost text-sm">← 戻る</button>
          <div className="flex items-center gap-2">
            <span className="text-game-gold font-bold text-lg">⚡ {gacha.inv.volts}V</span>
          </div>
        </div>

        <h1 className="text-2xl font-black text-game-purple sf-title tracking-tight">⚡ ガチャ</h1>

        {/* Pickup Banner */}
        {pickupDef && (
          <motion.div
            className="w-full rounded-xl p-3 relative overflow-hidden"
            style={{
              background: `linear-gradient(135deg, ${RARITY_COLOR[pickupDef.r]}15, ${RARITY_COLOR[pickupDef.r]}08)`,
              border: `2px solid ${RARITY_COLOR[pickupDef.r]}55`,
            }}
            animate={{ boxShadow: [`0 0 8px ${RARITY_COLOR[pickupDef.r]}33`, `0 0 16px ${RARITY_COLOR[pickupDef.r]}55`, `0 0 8px ${RARITY_COLOR[pickupDef.r]}33`] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <div className="flex items-center gap-3">
              <span className="text-3xl">{pickupDef.em}</span>
              <div className="flex-1">
                <div className="text-xs font-bold text-game-gold">🎯 ピックアップ</div>
                <div className="text-sm font-black text-foreground">{pickupDef.n}</div>
                <div className="text-[9px] text-muted-foreground">
                  {RARITY_LABEL[pickupDef.r]}排出時50%でピックアップ対象
                </div>
              </div>
              <span className="text-xs font-bold px-2 py-1 rounded" style={{ background: RARITY_COLOR[pickupDef.r] + '22', color: RARITY_COLOR[pickupDef.r] }}>
                {RARITY_LABEL[pickupDef.r]}
              </span>
            </div>
          </motion.div>
        )}

        {/* Pity Counter */}
        <div className="w-full glass-panel rounded-lg p-2">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-muted-foreground">天井カウンター</span>
            <span className="font-mono font-bold" style={{ color: pityPct > 60 ? '#ff9800' : pityPct > 80 ? '#f44336' : '#9e9e9e' }}>
              {gacha.inv.pity}/{PITY_HARD}
            </span>
          </div>
          <div className="w-full h-2 rounded-full bg-muted/30 overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{
                background: pityPct > 80 ? 'linear-gradient(90deg, #ff9800, #f44336)' :
                  pityPct > 60 ? 'linear-gradient(90deg, #ffd700, #ff9800)' :
                  'linear-gradient(90deg, hsl(var(--primary)), hsl(var(--accent)))',
              }}
              animate={{ width: `${pityPct}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
          <div className="text-[9px] text-muted-foreground mt-1">
            {gacha.inv.pity >= 50 ? '🔥 確率UP中！' : `あと${PITY_HARD - gacha.inv.pity}回で★OD確定`} ・ 累計{gacha.inv.totalPulls}回
          </div>
        </div>

        {/* Pull buttons */}
        <div className="flex gap-3 w-full">
          <button onClick={doPull1} disabled={gacha.inv.volts < GACHA_COST}
            className="game-btn-primary flex-1 py-3 text-sm disabled:opacity-30">
            1回ガチャ<br /><span className="text-game-gold text-xs">{GACHA_COST}V</span>
          </button>
          <button onClick={doPull10} disabled={gacha.inv.volts < GACHA_COST_10}
            className="flex-1 py-3 text-sm font-bold rounded-lg disabled:opacity-30"
            style={{
              background: 'linear-gradient(135deg, hsl(var(--game-neon-purple)), hsl(var(--accent)))',
              color: '#fff', border: '1px solid hsl(var(--accent) / 0.5)',
            }}>
            10連ガチャ<br /><span className="text-game-gold text-xs">{GACHA_COST_10}V（お得！）</span>
          </button>
        </div>

        {/* Results */}
        {results.length > 0 && (
          <div className="w-full">
            <div className="grid grid-cols-5 gap-2 mt-2">
              {results.map((tid, i) => {
                const def = TDEFS[tid];
                const revealed = i < revealIdx;
                const isPickup = tid === gacha.inv.pickup;
                return (
                  <motion.div key={`${i}-${tid}`}
                    initial={{ rotateY: 180, opacity: 0 }}
                    animate={revealed ? { rotateY: 0, opacity: 1 } : { rotateY: 180, opacity: 0.3 }}
                    transition={{ duration: 0.4 }}
                    className="flex flex-col items-center p-2 rounded-lg relative"
                    style={{
                      background: revealed ? RARITY_COLOR[def.r] + '15' : 'rgba(255,255,255,0.03)',
                      border: `1.5px solid ${revealed ? RARITY_COLOR[def.r] + '55' : '#333'}`,
                      boxShadow: revealed ? getRarityGlow(def.r) : 'none',
                    }}>
                    {revealed ? (
                      <>
                        {def.r === 'OD' && (
                          <motion.div className="absolute inset-0 rounded-lg"
                            animate={{ opacity: [0.3, 0.6, 0.3] }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                            style={{ background: 'linear-gradient(135deg, rgba(255,215,0,0.15), rgba(255,107,0,0.1))', border: '1px solid rgba(255,215,0,0.3)' }} />
                        )}
                        <span className="text-xl relative z-10">{def.em}</span>
                        <span className="text-[7px] font-black mt-0.5 relative z-10" style={{ color: RARITY_COLOR[def.r] }}>
                          {RARITY_LABEL[def.r]}
                        </span>
                        <span className="text-[8px] text-foreground/70 mt-0.5 relative z-10">{def.n.slice(0, 4)}</span>
                        {isNew(tid) && <span className="text-[7px] text-game-gold font-bold mt-0.5 relative z-10">NEW!</span>}
                        {isPickup && <span className="text-[7px] text-game-gold font-bold relative z-10">🎯PU</span>}
                      </>
                    ) : (
                      <span className="text-lg opacity-30">❓</span>
                    )}
                  </motion.div>
                );
              })}
            </div>
            <button onClick={() => { setResults([]); setRevealing(false); setOdActive(false); playSound?.('ui_tap'); }} className="game-btn-ghost w-full mt-3 text-xs">閉じる</button>
          </div>
        )}

        {/* Owned units */}
        <div className="w-full mt-2">
          <h3 className="text-sm font-bold text-foreground/80 mb-2">所持ユニット ({gacha.inv.owned.length})</h3>
          <div className="grid grid-cols-4 gap-1.5">
            {gacha.inv.owned.map(tid => {
              const def = TDEFS[tid];
              return (
                <div key={tid} className="flex flex-col items-center p-1.5 rounded-lg relative overflow-hidden"
                  style={{ background: RARITY_COLOR[def.r] + '0a', border: `1px solid ${RARITY_COLOR[def.r]}33` }}>
                  <span className="text-lg">{def.em}</span>
                  <span className="text-[7px] font-bold" style={{ color: RARITY_COLOR[def.r] }}>{RARITY_LABEL[def.r]}</span>
                  <span className="text-[8px] text-foreground/60">{def.n.slice(0, 5)}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Rates */}
        <details className="w-full text-xs text-muted-foreground mt-2">
          <summary className="cursor-pointer text-center">排出確率・天井</summary>
          <div className="mt-2 space-y-2">
            <div className="grid grid-cols-4 gap-1">
              {RARITY_ORDER.map(r => (
                <div key={r} className="text-center p-1 rounded" style={{ background: RARITY_COLOR[r] + '15', color: RARITY_COLOR[r] }}>
                  <div className="font-bold">{r}</div>
                  <div className="text-[9px]">{RARITY_LABEL[r]}</div>
                  <div className="text-[10px] font-mono">{(GACHA_RATES[r] * 100).toFixed(1)}%</div>
                </div>
              ))}
            </div>
            <div className="text-[10px] space-y-1 p-2 rounded bg-muted/10">
              <p>🎯 <strong>ピックアップ</strong>: 該当レアリティ排出時、50%でピックアップ対象</p>
              <p>📈 <strong>ソフト天井</strong>: 50回目からOD確率が徐々に上昇</p>
              <p>🔒 <strong>ハード天井</strong>: 80回目でOD確定</p>
            </div>
          </div>
        </details>
      </div>
    </div>
  );
};

export default GachaScreen;
