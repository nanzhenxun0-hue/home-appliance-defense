import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import type { TowerID, Rarity, GachaBannerType } from '@/game/types';
import { RARITY_COLOR, RARITY_LABEL, RARITY_ORDER, GACHA_RATES, GACHA_BANNERS } from '@/game/types';
import { TDEFS } from '@/game/constants';
import ScreenCrackEffect from '@/components/game/ScreenCrackEffect';
import GachaAnimation from '@/components/game/GachaAnimation';

interface GachaScreenProps {
  gacha: {
    inv: { owned: TowerID[]; volts: number; pity: number; totalPulls: number; pickup: TowerID | null; pickupBanner: string };
    pull1: (banner?: GachaBannerType) => TowerID | null;
    pull10: (banner?: GachaBannerType) => TowerID[] | null;
  };
  onBack: () => void;
  playSound?: (name: string) => void;
}

const PITY_HARD = 80;

const GachaScreen = ({ gacha, onBack, playSound }: GachaScreenProps) => {
  const [animResults, setAnimResults] = useState<TowerID[]>([]);
  const [odActive, setOdActive] = useState(false);
  const [activeBanner, setActiveBanner] = useState<GachaBannerType>('normal');
  const [ownedSnapshot, setOwnedSnapshot] = useState<TowerID[]>([]);

  const banner = GACHA_BANNERS.find(b => b.id === activeBanner) || GACHA_BANNERS[0];

  const startAnim = useCallback((ids: TowerID[]) => {
    setOwnedSnapshot([...gacha.inv.owned]);
    setAnimResults(ids);
    if (ids.some(id => TDEFS[id]?.r === 'OD')) {
      setOdActive(true);
    }
  }, [gacha.inv.owned]);

  const doPull1 = () => {
    const r = gacha.pull1(activeBanner);
    if (r) startAnim([r]);
  };

  const doPull10 = () => {
    const r = gacha.pull10(activeBanner);
    if (r) startAnim(r);
  };

  const closeAnim = () => {
    setAnimResults([]);
    setOdActive(false);
  };

  const isNewAtPull = (tid: TowerID) => !ownedSnapshot.includes(tid);

  const pityPct = Math.min((gacha.inv.pity / PITY_HARD) * 100, 100);

  return (
    <div className="min-h-[100dvh] bg-background flex flex-col items-center p-4 relative overflow-hidden">
      <ScreenCrackEffect active={odActive} onComplete={() => setOdActive(false)} />

      {/* Gacha animation overlay */}
      {animResults.length > 0 && (
        <GachaAnimation
          results={animResults}
          onComplete={closeAnim}
          playSound={playSound}
          isNew={isNewAtPull}
        />
      )}

      <div className="absolute inset-0 z-0 opacity-20"
        style={{ background: 'radial-gradient(ellipse at 50% 30%, hsl(270 80% 30%), transparent 70%)' }} />

      <div className="relative z-10 w-full max-w-md flex flex-col items-center gap-3">
        <div className="flex items-center justify-between w-full">
          <button onClick={() => { playSound?.('ui_back'); onBack(); }} className="game-btn-ghost text-sm">← 戻る</button>
          <div className="flex items-center gap-2">
            <span className="text-game-gold font-bold text-lg">⚡ {gacha.inv.volts}V</span>
          </div>
        </div>

        <h1 className="text-2xl font-black text-game-purple sf-title tracking-tight">📦 家電配送ガチャ</h1>

        {/* Banner tabs */}
        <div className="flex gap-1.5 w-full">
          {GACHA_BANNERS.map(b => (
            <button
              key={b.id}
              onClick={() => setActiveBanner(b.id)}
              className="flex-1 py-2 px-2 rounded-lg text-[10px] font-bold transition-all"
              style={{
                background: activeBanner === b.id ? `${b.col}22` : 'rgba(255,255,255,0.03)',
                border: `1.5px solid ${activeBanner === b.id ? b.col : '#333'}`,
                color: activeBanner === b.id ? b.col : '#888',
                boxShadow: activeBanner === b.id ? `0 0 10px ${b.col}33` : 'none',
              }}>
              {b.em} {b.name}
            </button>
          ))}
        </div>

        {/* Banner info */}
        <div className="w-full glass-panel rounded-lg p-2.5" style={{ borderColor: banner.col + '44' }}>
          <div className="text-xs font-bold" style={{ color: banner.col }}>{banner.em} {banner.name}</div>
          <div className="text-[10px] text-muted-foreground mt-0.5">{banner.desc}</div>
          {banner.pickup && (
            <div className="text-[9px] text-game-gold mt-1">🎯 ピックアップ: {TDEFS[banner.pickup]?.em} {TDEFS[banner.pickup]?.n}</div>
          )}
        </div>

        {/* Pity Counter */}
        <div className="w-full glass-panel rounded-lg p-2">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-muted-foreground">エコ替えカウンター（天井）</span>
            <span className="font-mono font-bold" style={{ color: pityPct > 60 ? '#ff9800' : pityPct > 80 ? '#f44336' : '#9e9e9e' }}>
              {gacha.inv.pity}/{PITY_HARD}
            </span>
          </div>
          <div className="w-full h-2 rounded-full bg-muted/30 overflow-hidden">
            <motion.div className="h-full rounded-full"
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
            {gacha.inv.pity >= 50 ? '🔥 確率UP中！' : `あと${PITY_HARD - gacha.inv.pity}回でOD確定`} ・ 累計{gacha.inv.totalPulls}回
          </div>
        </div>

        {/* Pull buttons */}
        <div className="flex gap-3 w-full">
          <button onClick={doPull1} disabled={gacha.inv.volts < banner.cost1 || animResults.length > 0}
            className="game-btn-primary flex-1 py-3 text-sm disabled:opacity-30">
            🚚 単発<br /><span className="text-game-gold text-xs">{banner.cost1}V</span>
          </button>
          <button onClick={doPull10} disabled={gacha.inv.volts < banner.cost10 || animResults.length > 0}
            className="flex-1 py-3 text-sm font-bold rounded-lg disabled:opacity-30"
            style={{
              background: `linear-gradient(135deg, ${banner.col}dd, ${banner.col}88)`,
              color: '#fff', border: `1px solid ${banner.col}55`,
            }}>
            🚛 10連<br /><span className="text-game-gold text-xs">{banner.cost10}V</span>
          </button>
        </div>

        {/* Owned units */}
        <div className="w-full mt-2">
          <h3 className="text-sm font-bold text-foreground/80 mb-2">所持ユニット ({gacha.inv.owned.length}/{Object.keys(TDEFS).length})</h3>
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
          <summary className="cursor-pointer text-center">排出確率を確認</summary>
          <div className="mt-2 space-y-2">
            <div className="grid grid-cols-4 gap-1">
              {RARITY_ORDER.map(r => {
                const rate = banner.rateBoost?.[r] ?? GACHA_RATES[r];
                return (
                  <div key={r} className="text-center p-1 rounded" style={{ background: RARITY_COLOR[r] + '15', color: RARITY_COLOR[r] }}>
                    <div className="font-bold">{r}</div>
                    <div className="text-[10px] font-mono">{(rate * 100).toFixed(2)}%</div>
                  </div>
                );
              })}
            </div>
          </div>
        </details>
      </div>
    </div>
  );
};

export default GachaScreen;
