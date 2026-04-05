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

type Screen = 'home' | 'howto' | 'diff' | 'game' | 'scores' | 'gacha' | 'team';

const Index = () => {
  const [screen, setScreen] = useState<Screen>('home');
  const [diff, setDiff] = useState<DifficultyKey>('normal');
  const gacha = useGacha();
  const { team, toggle, MAX_TEAM } = useTeam();

  const onVoltEarned = useCallback((amount: number) => {
    gacha.addVolts(amount);
  }, [gacha]);

  if (screen === 'home') {
    return <HomeScreen
      onPlay={() => setScreen('team')}
      onHowTo={() => setScreen('howto')}
      onScores={() => setScreen('scores')}
      onGacha={() => setScreen('gacha')}
      volts={gacha.inv.volts}
    />;
  }
  if (screen === 'howto') return <HowToScreen onBack={() => setScreen('home')} />;
  if (screen === 'diff') {
    return <DifficultyScreen onSelect={(d) => { setDiff(d); setScreen('game'); }} onBack={() => setScreen('team')} />;
  }
  if (screen === 'scores') return <ScoreScreen onBack={() => setScreen('home')} />;
  if (screen === 'gacha') {
    return <GachaScreen gacha={gacha} onBack={() => setScreen('home')} />;
  }
  if (screen === 'team') {
    return <TeamScreen
      owned={gacha.inv.owned}
      team={team}
      maxTeam={MAX_TEAM}
      onToggle={toggle}
      onStart={() => setScreen('diff')}
      onBack={() => setScreen('home')}
    />;
  }
  return <GameScreen key={diff} diff={diff} team={team} onHome={() => setScreen('home')} onVoltEarned={onVoltEarned} />;
};

export default Index;
