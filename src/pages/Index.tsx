import { useState, useCallback, lazy, Suspense } from 'react';
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
import { useGacha } from '@/hooks/useGacha';
import { useTeam } from '@/hooks/useTeam';
import { useSound } from '@/hooks/useSound';
import { useBGM } from '@/hooks/useBGM';
import { useAreaUnlock } from '@/hooks/useAreaUnlock';
import { useCampaignCodes } from '@/hooks/useCampaignCodes';
import { useAuth } from '@/hooks/useAuth';
import type { CodeReward } from '@/hooks/useCampaignCodes';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { safeGetItem, safeSetItem } from '@/lib/persistence';

const ScreenFallback = () => (
  <div className="min-h-[100dvh] bg-background flex items-center justify-center text-cyan-300 text-sm">⚡ LOADING…</div>
);

const ALL_AREAS: AreaKey[] = ['suburb', 'factory', 'downtown', 'volcano', 'glacier', 'sky'];
const EXTREME_CLEARS_KEY = 'kaden-td-extreme-clears';

type Screen = 'home' | 'howto' | 'area' | 'game' | 'scores' | 'gacha' | 'team' | 'combo' | 'tutorial' | 'patch' | 'compendium' | 'enemyCompendium' | 'campaign' | 'leaderboard' | 'trade';

const Index = () => {
  const [screen, setScreen] = useState<Screen>(() => {
    const seen = safeGetItem('kaden-td-tutorial');
    return seen ? 'home' : 'tutorial';
  });
  const [diff, setDiff] = useState<DifficultyKey>('normal');
  const [area, setArea] = useState<AreaKey>('suburb');
  const [promoReward, setPromoReward] = useState<TowerID | null>(null);
  const gacha = useGacha();
  const { team, toggle, MAX_TEAM } = useTeam();
  const { play, toggle: toggleSound, init: initSound } = useSound();
  const bgm = useBGM();
  const { unlockedAreas, unlockNext } = useAreaUnlock();
  const campaign = useCampaignCodes();
  const auth = useAuth();
  const nav = useNavigate();

  const [extremeClears, setExtremeClears] = useState<Set<AreaKey>>(() => {
    try {
      const raw = safeGetItem(EXTREME_CLEARS_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      return new Set(Array.isArray(parsed) ? parsed.filter((a: AreaKey) => ALL_AREAS.includes(a)) : []);
    } catch { return new Set(); }
  });

  const onVoltEarned = useCallback((amount: number) => {
    gacha.addVolts(amount);
  }, [gacha]);

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
      volts={gacha.inv.volts}
      isAdmin={campaign.isAdmin}
    />;
  }
  const view = (() => {
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
        <GameScreen key={`${diff}-${area}`} diff={diff} team={team} area={area} onHome={() => handleScreenChange('home')} onVoltEarned={onVoltEarned}
          onWin={(a) => {
            unlockNext(a);
            if (diff === 'extreme') {
              const next = new Set([...extremeClears, a]);
              setExtremeClears(next);
              safeSetItem(EXTREME_CLEARS_KEY, JSON.stringify([...next]));
              if (ALL_AREAS.every(ar => next.has(ar)) && !gacha.inv.owned.includes('tv')) {
                gacha.grantUnit('tv');
                setPromoReward('tv');
              }
            }
          }}
          onEndlessMilestone={(w) => {
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
