import { useBGM } from '@/hooks/useBGM';
import { useSound } from '@/hooks/useSound';

interface Props {
  className?: string;
}

const AudioSettings = ({ className = '' }: Props) => {
  const bgm = useBGM();
  const sfx = useSound();
  return (
    <div className={`flex gap-1 ${className}`}>
      <button
        onClick={() => { bgm.toggle(); }}
        className="px-2 py-1 rounded-full text-[10px] font-bold border transition-colors"
        style={{
          background: bgm.enabled ? 'rgba(124,58,237,0.2)' : 'rgba(60,60,60,0.4)',
          color: bgm.enabled ? '#c4b5fd' : '#71717a',
          borderColor: bgm.enabled ? 'rgba(192,132,252,0.5)' : 'rgba(120,120,120,0.4)',
        }}
        title="BGM ON/OFF"
      >
        🎵 {bgm.enabled ? 'ON' : 'OFF'}
      </button>
      <button
        onClick={() => { sfx.init(); sfx.toggle(); }}
        className="px-2 py-1 rounded-full text-[10px] font-bold border transition-colors"
        style={{
          background: sfx.enabled ? 'rgba(34,197,94,0.2)' : 'rgba(60,60,60,0.4)',
          color: sfx.enabled ? '#86efac' : '#71717a',
          borderColor: sfx.enabled ? 'rgba(74,222,128,0.5)' : 'rgba(120,120,120,0.4)',
        }}
        title="SE ON/OFF"
      >
        🔊 {sfx.enabled ? 'ON' : 'OFF'}
      </button>
    </div>
  );
};

export default AudioSettings;
