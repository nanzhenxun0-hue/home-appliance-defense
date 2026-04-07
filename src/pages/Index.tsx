import { useState, useCallback } from 'react';
import type { DifficultyKey, TowerID } from '@/game/types';
import HomeScreen from '@/components/screens/HomeScreen';
import HowToScreen from '@/components/screens/HowToScreen';
import DifficultyScreen from '@/components/screens/DifficultyScreen';
import GameScreen from '@/components/screens/GameScreen';
import ScoreScreen from '@/components/screens/ScoreScreen';
import GachaScreen from '@/components/screens/GachaScreen';
import TeamScreen from '@/components/screens/TeamScreen';
import ComboRecipeScreen from '@/components/screens/ComboRecipeScreen';
import { useGacha } from '@/hooks/useGacha';
import { useTeam } from '@/hooks/useTeam';
import { useSound } from '@/hooks/useSound';
import { useBGM } from '@/hooks/useBGM';
import { useEffect } from 'react';

type Screen = 'home' | 'howto' | 'diff' | 'game' | 'scores' | 'gacha' | 'team' | 'combo';

const Index = () => {
  const [screen, setScreen] = useState<Screen>('home');
  const [diff, setDiff] = useState<DifficultyKey>('normal');
  const gacha = useGacha();
  const { team, toggle, MAX_TEAM } = useTeam();
  const { play, toggle: toggleSound, init: initSound } = useSound();
  const bgm = useBGM();

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

  if (screen === 'home') {
    return <HomeScreen
      onPlay={() => handleScreenChange('team')}
      onHowTo={() => handleScreenChange('howto')}
      onScores={() => handleScreenChange('scores')}
      onGacha={() => handleScreenChange('gacha')}
      onCombo={() => handleScreenChange('combo')}
      volts={gacha.inv.volts}
    />;
  }
  if (screen === 'howto') return <HowToScreen onBack={() => handleScreenChange('home')} />;
  if (screen === 'diff') {
    return <DifficultyScreen onSelect={(d) => { setDiff(d); play('wave_start'); setScreen('game'); }} onBack={() => handleScreenChange('team')} />;
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
      onStart={() => handleScreenChange('diff')}
      onBack={() => handleScreenChange('home')}
    />;
  }
  if (screen === 'combo') {
    return <ComboRecipeScreen owned={gacha.inv.owned} onBack={() => handleScreenChange('home')} />;
  }
  return <GameScreen key={diff} diff={diff} team={team} onHome={() => handleScreenChange('home')} onVoltEarned={onVoltEarned} />;
};

export default Index;
