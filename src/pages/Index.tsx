import { useState, useCallback } from 'react';
import type { DifficultyKey, TowerID } from '@/game/types';
import HomeScreen from '@/components/screens/HomeScreen';
import HowToScreen from '@/components/screens/HowToScreen';
import DifficultyScreen from '@/components/screens/DifficultyScreen';
import GameScreen from '@/components/screens/GameScreen';
import ScoreScreen from '@/components/screens/ScoreScreen';
import GachaScreen from '@/components/screens/GachaScreen';
import TeamScreen from '@/components/screens/TeamScreen';
import { useGacha } from '@/hooks/useGacha';
import { useTeam } from '@/hooks/useTeam';
import { useSound } from '@/hooks/useSound';

type Screen = 'home' | 'howto' | 'diff' | 'game' | 'scores' | 'gacha' | 'team';

const Index = () => {
  const [screen, setScreen] = useState<Screen>('home');
  const [diff, setDiff] = useState<DifficultyKey>('normal');
  const gacha = useGacha();
  const { team, toggle, MAX_TEAM } = useTeam();
  const { play, toggle: toggleSound, init: initSound } = useSound();

  const onVoltEarned = useCallback((amount: number) => {
    gacha.addVolts(amount);
  }, [gacha]);

  // Init audio on first user interaction
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
  return <GameScreen key={diff} diff={diff} team={team} onHome={() => handleScreenChange('home')} onVoltEarned={onVoltEarned} />;
};

export default Index;
