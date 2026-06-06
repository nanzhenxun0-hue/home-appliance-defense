// Auto-discover character art under src/assets/chars/<tid>.png
// Falls back to emoji when art is missing.
import type { TowerID } from '@/game/types';
import { TDEFS } from '@/game/constants';

const modules = import.meta.glob('@/assets/chars/*.png', { eager: true, query: '?url', import: 'default' }) as Record<string, string>;
const ART: Partial<Record<TowerID, string>> = {};
for (const [path, url] of Object.entries(modules)) {
  const m = path.match(/chars\/([^/]+)\.png$/);
  if (m) ART[m[1] as TowerID] = url;
}

export const getCharArt = (tid: TowerID): string | null => ART[tid] ?? null;
export const hasCharArt = (tid: TowerID): boolean => !!ART[tid];

interface Props {
  tid: TowerID;
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}

const CharIcon = ({ tid, size = 36, className = '', style }: Props) => {
  const url = getCharArt(tid);
  const em  = TDEFS[tid]?.em ?? '❓';
  if (url) {
    return (
      <img
        src={url}
        alt={TDEFS[tid]?.n ?? tid}
        width={size}
        height={size}
        className={`object-contain pixelated select-none ${className}`}
        style={{ imageRendering: 'auto', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.55))', ...style }}
        draggable={false}
      />
    );
  }
  return (
    <span className={`inline-flex items-center justify-center ${className}`} style={{ fontSize: size * 0.9, lineHeight: 1, ...style }}>
      {em}
    </span>
  );
};

export default CharIcon;
