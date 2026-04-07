import { motion } from 'framer-motion';
import { TDEFS } from '@/game/constants';
import { RARITY_COLOR, type TowerID } from '@/game/types';

interface HowToScreenProps {
  onBack: () => void;
}

const SECTIONS = [
  { em: '👆', t: 'タップで設置', d: '下のデプロイバーからタワーを選んで、緑のマスをタップで配置。' },
  { em: '🔌', t: '電力管理', d: '攻撃タワーは電力を消費する。延長コードで発電！電力が0になると低電力モードに。' },
  { em: '🔗', t: '依存チェーン', d: '高レアタワーは依存元が必要。依存元をフィールドに先に設置しないと機能しない！' },
  { em: '💤', t: '連携切れで停止', d: '依存元を売ると依存先が💤停止。線が赤くなったら危険！' },
  { em: '🌊', t: 'ウェーブ攻略', d: 'Waveボタンで開始。敵を倒して電力とVoltsを稼ごう！' },
  { em: '⛓️', t: 'チェーンコンボ', d: '依存チェーンを完成させるとコンボ発動！火力・攻速にボーナスがかかる。' },
];

// Build dependency tree for visualization
interface TreeNode {
  tid: TowerID;
  children: TreeNode[];
}

const buildTree = (): TreeNode[] => {
  const roots: TreeNode[] = [];
  const nodeMap: Record<string, TreeNode> = {};
  
  for (const [tid] of Object.entries(TDEFS)) {
    nodeMap[tid] = { tid: tid as TowerID, children: [] };
  }
  for (const [tid, def] of Object.entries(TDEFS)) {
    if (!def.req) {
      roots.push(nodeMap[tid]);
    } else if (nodeMap[def.req]) {
      nodeMap[def.req].children.push(nodeMap[tid]);
    }
  }
  return roots;
};

const TreeNodeView = ({ node, depth = 0 }: { node: TreeNode; depth?: number }) => {
  const def = TDEFS[node.tid];
  const color = RARITY_COLOR[def.r];
  
  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-1" style={{ paddingLeft: depth * 16 }}>
        {depth > 0 && (
          <span className="text-game-green text-[10px]">└→</span>
        )}
        <div
          className="flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] bg-game-surface"
          style={{ borderLeft: `3px solid ${color}` }}
        >
          <span>{def.em}</span>
          <span className="text-foreground/90 font-bold">{def.n}</span>
          <span className="text-[8px] opacity-60">({def.r})</span>
        </div>
      </div>
      {node.children.map(child => (
        <TreeNodeView key={child.tid} node={child} depth={depth + 1} />
      ))}
    </div>
  );
};

const RARITY_LIST = [
  { key: 'C', label: 'コモン', col: '#9e9e9e' },
  { key: 'U', label: 'アンコモン', col: '#4caf50' },
  { key: 'R', label: 'レア', col: '#2196f3' },
  { key: 'E', label: 'エピック', col: '#ab47bc' },
  { key: 'L', label: 'レジェンド', col: '#ff9800' },
  { key: 'M', label: 'ミシック', col: '#e91e63' },
  { key: 'G', label: 'ギャラクシー', col: '#00e5ff' },
  { key: 'OD', label: 'オーバードライブ', col: '#ffd700' },
];

const HowToScreen = ({ onBack }: HowToScreenProps) => {
  const tree = buildTree();

  return (
    <div className="min-h-screen bg-background flex flex-col items-center p-4 pt-6 pb-20">
      <div className="max-w-xl w-full">
        <motion.h2
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-game-gold font-black text-xl mb-4 text-center"
        >
          📖 遊び方
        </motion.h2>

        {SECTIONS.map(({ em, t, d }, i) => (
          <motion.div
            key={t}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.06 }}
            className="glass-panel flex gap-3 mb-2 p-3"
          >
            <span className="text-2xl flex-shrink-0">{em}</span>
            <div>
              <div className="text-foreground font-black text-xs mb-0.5">{t}</div>
              <div className="text-muted-foreground text-[10px] leading-relaxed">{d}</div>
            </div>
          </motion.div>
        ))}

        {/* Full dependency tree */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="glass-panel p-3 mb-2"
        >
          <div className="text-game-green text-[11px] font-black mb-2">🌳 依存チェーン関係図</div>
          <div className="space-y-1">
            {tree.map(root => (
              <TreeNodeView key={root.tid} node={root} />
            ))}
          </div>
          <div className="text-muted-foreground text-[9px] mt-2">
            ※ 下位タワーが設置済みでないと上位タワーは機能しません
          </div>
        </motion.div>

        {/* Rarity list */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="glass-panel p-3 mb-2"
        >
          <div className="text-game-gold text-[11px] font-black mb-2">⭐ レアリティ一覧</div>
          <div className="grid grid-cols-2 gap-1">
            {RARITY_LIST.map(r => (
              <div key={r.key} className="flex items-center gap-1.5 text-[10px]">
                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: r.col }} />
                <span className="text-foreground/80 font-bold">{r.key}</span>
                <span className="text-muted-foreground">{r.label}</span>
              </div>
            ))}
          </div>
        </motion.div>

        <button onClick={onBack} className="game-btn-secondary w-full mt-2">
          ← 戻る
        </button>
      </div>
    </div>
  );
};

export default HowToScreen;
