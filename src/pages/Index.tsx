import { useState, useCallback, lazy, Suspense, useRef } from 'react';
import type { DifficultyKey, TowerID, AreaKey } from '@/game/types';
import HomeScreen from '@/components/screens/HomeScreen';
import TutorialScreen from '@/components/screens/TutorialScreen';
import PromoRewardModal from '@/components/screens/PromoRewardModal';
const HowToScreen = lazy(() => import('@/components/screens/HowToScreen'));
const GameScreen = lazy(() => import('@/components/screens/GameScreen'));
const ScoreScreen = lazy(() => import('@/components/screens/ScoreScreen'));
const GachaScreen = lazy(() => import('@/components/screens/GachaScreen'));
const TeamScreen = lazy(() => import('@/components/screens/TeamScreen'));
const ComboRecipeScreen = lazy(() => import('@/components/screens/ComboRecipeScreen'));
const PatchNotesScreen = lazy(() => import('@/components/screens/PatchNotesScreen'));
const AreaSelectScreen = lazy(() => import('@/components/screens/AreaSelectScreen'));
const CompendiumScreen = lazy(() => import('@/components/screens/CompendiumScreen'));
const EnemyCompendiumScreen = lazy(() => import('@/components/screens/EnemyCompendiumScreen'));
const CampaignCodeScreen = lazy(() => import('@/components/screens/CampaignCodeScreen'));
const LeaderboardScreen = lazy(() => import('@/components/screens/LeaderboardScreen'));
const TradeScreen = lazy(() => import('@/components/screens/TradeScreen'));
const YarikomiScreen = lazy(() => import('@/components/screens/YarikomiScreen'));
import { useGacha } from '@/hooks/useGacha';
import { useTeam } from '@/hooks/useTeam';
import { useSound } from '@/hooks/useSound';
import { useBGM } from '@/hooks/useBGM';
import { useAreaUnlock } from '@/hooks/useAreaUnlock';
import { useCampaignCodes } from '@/hooks/useCampaignCodes';
import { useAuth } from '@/hooks/useAuth';
import { useMeta } from '@/hooks/useMeta';
import { useToast } from '@/hooks/use-toast';
import type { ChallengeMod } from '@/game/meta';
import type { CodeReward } from '@/hooks/useCampaignCodes';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { safeGetItem, safeSetItem } from '@/lib/persistence';

const ScreenFallback = () => (
  <div className="min-h-[100dvh] bg-background flex items-center justify-center text-cyan-300 text-sm">⚡ LOADING…</div>
);

const ALL_AREAS: AreaKey[] = ['suburb', 'factory', 'downtown', 'volcano', 'glacier', 'sky'];
const EXTREME_CLEARS_KEY = 'kaden-td-extreme-clears';

type Screen = 'home' | 'howto' | 'area' | 'game' | 'scores' | 'gacha' | 'team' | 'combo' | 'tutorial' | 'patch' | 'compendium' | 'enemyCompendium' | 'campaign' | 'leaderboard' | 'trade' | 'yarikomi';

const Index = () => {
  const [screen, setScreen] = useState<Screen>(() => {
    const seen = safeGetItem('kaden-td-tutorial');
    return seen ? 'home' : 'tutorial';
  });
  const [diff, setDiff] = useState<DifficultyKey>('normal');
  const [area, setArea] = useState<AreaKey>('suburb');
  const [promoReward, setPromoReward] = useState<TowerID | null>(null);
  const [challenge, setChallenge] = useState<ChallengeMod | null>(null);
  const gacha = useGacha();
  const { team, toggle, MAX_TEAM } = useTeam();
  const { play, toggle: toggleSound, init: initSound } = useSound();
  const bgm = useBGM();
  const { unlockedAreas, unlockNext } = useAreaUnlock();
  const campaign = useCampaignCodes();
  const auth = useAuth();
  const nav = useNavigate();
  const { toast } = useToast();
  const meta = useMeta((v, label) => {
    gacha.addVolts(v);
    toast({ title: `🎁 ${label}`, description: `+${v} ボルト獲得！` });
  });

  const [extremeClears, setExtremeClears] = useState<Set<AreaKey>>(() => {
    try {
      const raw = safeGetItem(EXTREME_CLEARS_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      return new Set(Array.isArray(parsed) ? parsed.filter((a: AreaKey) => ALL_AREAS.includes(a)) : []);
    } catch { return new Set(); }
  });

  const onVoltEarned = useCallback((amount: number) => {
    gacha.addVolts(amount);
    meta.track({ type: 'volts_earned', amount });
  }, [gacha, meta]);

  // Track gacha pulls whenever totalPulls increases
  const lastPullsRef = useRef(gacha.inv.totalPulls);
  useEffect(() => {
    const diff = gacha.inv.totalPulls - lastPullsRef.current;
    if (diff > 0) meta.track({ type: 'gacha_pull', count: diff });
    lastPullsRef.current = gacha.inv.totalPulls;
  }, [gacha.inv.totalPulls, meta]);

  // Wrap gacha pulls so we track them
  const trackGachaPull = useCallback((count: number) => {
    meta.track({ type: 'gacha_pull', count });
  }, [meta]);

  useEffect(() => {
    if (screen === 'game') bgm.play('battle');
    else if (screen === 'tutorial') bgm.play('tutorial');
    else if (screen === 'gacha') bgm.play('gacha');
    else bgm.play('home');
  }, [screen]);

  const handleScreenChange = (s: Screen) => {
    initSound();
    bgm.init();
    play('ui_tap');
    setScreen(s);
  };

  const handleRewardApply = useCallback((reward: CodeReward) => {
    if (reward.volts) gacha.addVolts(reward.volts);
    if (reward.pulls) {
      for (let i = 0; i < reward.pulls; i++) gacha.addVolts(150);
    }
    if (reward.unit) {
      gacha.grantUnit(reward.unit);
      setPromoReward(reward.unit);
    }
  }, [gacha]);

  const launchChallenge = useCallback((c: ChallengeMod) => {
    setChallenge(c);
    setDiff(c.diff);
    setArea(c.area);
    handleScreenChange('game');
  }, []);

  if (screen === 'tutorial') {
    return (
      <>
        <TutorialScreen onComplete={() => {
          safeSetItem('kaden-td-tutorial', '1');
          gacha.grantUnit('promo_starter');
          setPromoReward('promo_starter');
        }} />
        <PromoRewardModal tid={promoReward} onClose={() => { setPromoReward(null); handleScreenChange('home'); }} />
      </>
    );
  }
  if (screen === 'home') {
    return <HomeScreen
      onPlay={() => handleScreenChange('team')}
      onHowTo={() => handleScreenChange('howto')}
      onScores={() => handleScreenChange('scores')}
      onGacha={() => handleScreenChange('gacha')}
      onCombo={() => handleScreenChange('combo')}
      onTutorial={() => handleScreenChange('tutorial')}
      onPatch={() => handleScreenChange('patch')}
      onCompendium={() => handleScreenChange('compendium')}
      onEnemyCompendium={() => handleScreenChange('enemyCompendium')}
      onCampaignCode={() => handleScreenChange('campaign')}
      onAuth={() => nav('/auth')}
      onTrade={() => handleScreenChange('trade')}
      onLeaderboard={() => handleScreenChange('leaderboard')}
      onYarikomi={() => handleScreenChange('yarikomi')}
      onSignOut={() => { auth.signOut(); }}
      volts={gacha.inv.volts}
      isAdmin={campaign.isAdmin || auth.isAdmin}
      isLoggedIn={!!auth.user}
      displayName={auth.profile?.display_name}
    />;
  }
  const view = (() => {
    if (screen === 'yarikomi') return <YarikomiScreen meta={meta} onBack={() => handleScreenChange('home')} onLaunchChallenge={launchChallenge} />;
    if (screen === 'leaderboard') return <LeaderboardScreen onBack={() => handleScreenChange('home')} />;
    if (screen === 'trade') return <TradeScreen
      onBack={() => handleScreenChange('home')}
      counts={gacha.inv.counts}
      onServerInventory={(serverInv) => {
        // Sync server -> local: use max of local/server for each unit.
        const merged = { ...gacha.inv.counts };
        for (const [tid, c] of Object.entries(serverInv)) {
          merged[tid as any] = Math.max(merged[tid as any] ?? 0, c ?? 0);
          if ((merged[tid as any] ?? 0) > 0 && !gacha.inv.owned.includes(tid as any)) {
            gacha.grantUnit(tid as any);
          }
        }
      }}
    />;
    if (screen === 'campaign') {
      return <CampaignCodeScreen
        isAdmin={campaign.isAdmin}
        codes={campaign.codes}
        redeemed={campaign.redeemed}
        onRedeem={campaign.redeemCode}
        onCreateCode={campaign.createCode}
        onDeleteCode={campaign.deleteCode}
        onDeactivateAdmin={campaign.deactivateAdmin}
        onRewardApply={handleRewardApply}
        onBack={() => handleScreenChange('home')}
      />;
    }
    if (screen === 'compendium') return <CompendiumScreen owned={gacha.inv.owned} onBack={() => handleScreenChange('home')} />;
    if (screen === 'enemyCompendium') return <EnemyCompendiumScreen onBack={() => handleScreenChange('home')} />;
    if (screen === 'patch') return <PatchNotesScreen onBack={() => handleScreenChange('home')} />;
    if (screen === 'howto') return <HowToScreen onBack={() => handleScreenChange('home')} />;
    if (screen === 'area') {
      return <AreaSelectScreen
        unlockedAreas={unlockedAreas}
        onSelect={(a, d) => { setArea(a); setDiff(d); play('wave_start'); setScreen('game'); }}
        onBack={() => handleScreenChange('team')}
      />;
    }
    if (screen === 'scores') return <ScoreScreen onBack={() => handleScreenChange('home')} />;
    if (screen === 'gacha') return <GachaScreen gacha={gacha} onBack={() => handleScreenChange('home')} playSound={play as any} />;
    if (screen === 'team') {
      return <TeamScreen
        owned={gacha.inv.owned}
        counts={gacha.inv.counts}
        team={team}
        maxTeam={MAX_TEAM}
        onToggle={(tid) => { play('ui_tap'); toggle(tid); }}
        onStart={() => handleScreenChange('area')}
        onBack={() => handleScreenChange('home')}
        isAdmin={campaign.isAdmin}
      />;
    }
    if (screen === 'combo') return <ComboRecipeScreen owned={gacha.inv.owned} onBack={() => handleScreenChange('home')} />;
    return (
      <>
        <GameScreen key={`${diff}-${area}-${challenge?.id ?? ''}`} diff={diff} team={team} area={area} challenge={challenge}
          onHome={() => { setChallenge(null); handleScreenChange('home'); }} onVoltEarned={onVoltEarned}
          onWaveCleared={(w, d) => meta.track({ type: 'wave_clear', wave: w, diff: d })}
          onWin={(a) => {
            unlockNext(a);
            meta.track({ type: 'game_win', diff, area: a });
            if (challenge && !meta.progress.challengeClears.includes(challenge.id)) {
              meta.track({ type: 'challenge_win', id: challenge.id });
              gacha.addVolts(challenge.volts);
              toast({ title: `🔥 チャレンジ制覇: ${challenge.name}`, description: `+${challenge.volts} ボルト獲得！` });
            }
            if (diff === 'extreme') {
              const next = new Set([...extremeClears, a]);
              setExtremeClears(next);
              safeSetItem(EXTREME_CLEARS_KEY, JSON.stringify([...next]));
              meta.track({ type: 'extreme_clear', area: a });
              if (ALL_AREAS.every(ar => next.has(ar)) && !gacha.inv.owned.includes('tv')) {
                gacha.grantUnit('tv');
                setPromoReward('tv');
              }
            }
          }}
          onEndlessMilestone={(w) => {
            meta.track({ type: 'endless_milestone', wave: w });
            if (w >= 100 && w % 100 === 0) {
              gacha.grantUnit('promo_endless');
              setPromoReward('promo_endless');
            }
          }} />
        <PromoRewardModal tid={promoReward} onClose={() => setPromoReward(null)} />
      </>
    );
  })();

  return <Suspense fallback={<ScreenFallback />}>{view}</Suspense>;
};

export default Index;
