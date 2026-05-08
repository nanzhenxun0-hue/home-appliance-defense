import { useState, useCallback } from 'react';
import type { DifficultyKey, TowerID, AreaKey } from '@/game/types';
import HomeScreen from '@/components/screens/HomeScreen';
import HowToScreen from '@/components/screens/HowToScreen';
import GameScreen from '@/components/screens/GameScreen';
import ScoreScreen from '@/components/screens/ScoreScreen';
import GachaScreen from '@/components/screens/GachaScreen';
import TeamScreen from '@/components/screens/TeamScreen';
import ComboRecipeScreen from '@/components/screens/ComboRecipeScreen';
import PatchNotesScreen from '@/components/screens/PatchNotesScreen';
import AreaSelectScreen from '@/components/screens/AreaSelectScreen';
import TutorialScreen from '@/components/screens/TutorialScreen';
import CompendiumScreen from '@/components/screens/CompendiumScreen';
import EnemyCompendiumScreen from '@/components/screens/EnemyCompendiumScreen';
import { useGacha } from '@/hooks/useGacha';
import { useTeam } from '@/hooks/useTeam';
import { useSound } from '@/hooks/useSound';
import { useBGM } from '@/hooks/useBGM';
import { useAreaUnlock } from '@/hooks/useAreaUnlock';
import { useEffect } from 'react';

type Screen = 'home' | 'howto' | 'area' | 'game' | 'scores' | 'gacha' | 'team' | 'combo' | 'tutorial' | 'patch' | 'compendium' | 'enemyCompendium';

const Index = () => {
  const [screen, setScreen] = useState<Screen>(() => {
    const seen = localStorage.getItem('kaden-td-tutorial');
    return seen ? 'home' : 'tutorial';
  });
  const [diff, setDiff] = useState<DifficultyKey>('normal');
  const [area, setArea] = useState<AreaKey>('suburb');
  const gacha = useGacha();
  const { team, toggle, MAX_TEAM } = useTeam();
  const { play, toggle: toggleSound, init: initSound } = useSound();
  const bgm = useBGM();
  const { unlockedAreas, unlockNext } = useAreaUnlock();

  const onVoltEarned = useCallback((amount: number) => {
    gacha.addVolts(amount);
  }, [gacha]);

  useEffect(() => {
    if (screen === 'game') {
      bgm.play('battle');
    } else {
      bgm.play('home');
    }
  }, [screen]);

  const handleScreenChange = (s: Screen) => {
    initSound();
    play('ui_tap');
    setScreen(s);
  };

  if (screen === 'tutorial') {
    return <TutorialScreen onComplete={() => {
      const wasFirst = !localStorage.getItem('kaden-td-tutorial');
      localStorage.setItem('kaden-td-tutorial', '1');
      if (wasFirst) {
        const added = gacha.grantUnit('promo_starter');
        if (added) alert('🎁 限定キャラ「プロト家電（P）」をプレゼント！');
      }
      handleScreenChange('home');
    }} />;
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
      volts={gacha.inv.volts}
    />;
  }
  if (screen === 'compendium') {
    return <CompendiumScreen owned={gacha.inv.owned} onBack={() => handleScreenChange('home')} />;
  }
  if (screen === 'enemyCompendium') {
    return <EnemyCompendiumScreen onBack={() => handleScreenChange('home')} />;
  }
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
  if (screen === 'gacha') {
    return <GachaScreen gacha={gacha} onBack={() => handleScreenChange('home')} playSound={play as any} />;
  }
  if (screen === 'team') {
    return <TeamScreen
      owned={gacha.inv.owned}
      team={team}
      maxTeam={MAX_TEAM}
      onToggle={(tid) => { play('ui_tap'); toggle(tid); }}
      onStart={() => handleScreenChange('area')}
      onBack={() => handleScreenChange('home')}
    />;
  }
  if (screen === 'combo') {
    return <ComboRecipeScreen owned={gacha.inv.owned} onBack={() => handleScreenChange('home')} />;
  }
  return <GameScreen key={`${diff}-${area}`} diff={diff} team={team} area={area} onHome={() => handleScreenChange('home')} onVoltEarned={onVoltEarned} onWin={unlockNext} onEndlessMilestone={(w) => {
    if (w >= 100 && !localStorage.getItem('kaden-td-endless100')) {
      localStorage.setItem('kaden-td-endless100', '1');
      const added = gacha.grantUnit('promo_endless');
      if (added) alert('🏆 エンドレス100W突破！限定キャラ「∞マスター（P）」獲得！');
    }
  }} />;
};

export default Index;
