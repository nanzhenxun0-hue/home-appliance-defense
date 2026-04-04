import { useState } from 'react';
import type { DifficultyKey } from '@/game/types';
import HomeScreen from '@/components/screens/HomeScreen';
import HowToScreen from '@/components/screens/HowToScreen';
import DifficultyScreen from '@/components/screens/DifficultyScreen';
import GameScreen from '@/components/screens/GameScreen';
import ScoreScreen from '@/components/screens/ScoreScreen';

type Screen = 'home' | 'howto' | 'diff' | 'game' | 'scores';

const Index = () => {
  const [screen, setScreen] = useState<Screen>('home');
  const [diff, setDiff] = useState<DifficultyKey>('normal');

  if (screen === 'home') {
    return <HomeScreen onPlay={() => setScreen('diff')} onHowTo={() => setScreen('howto')} onScores={() => setScreen('scores')} />;
  }
  if (screen === 'howto') return <HowToScreen onBack={() => setScreen('home')} />;
  if (screen === 'diff') {
    return <DifficultyScreen onSelect={(d) => { setDiff(d); setScreen('game'); }} onBack={() => setScreen('home')} />;
  }
  if (screen === 'scores') return <ScoreScreen onBack={() => setScreen('home')} />;
  return <GameScreen key={diff} diff={diff} onHome={() => setScreen('home')} />;
};

export default Index;
