import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PATCH_NOTES, PATCH_CATEGORY_META, APP_VERSION, type PatchCategory } from '@/game/patchNotes';

interface Props { onBack: () => void; }

const PatchNotesScreen = ({ onBack }: Props) => {
  const [open, setOpen] = useState<string>(PATCH_NOTES[0]?.version ?? '');

  return (
    <div className="min-h-[100dvh] bg-background p-4 pb-8">
      <div className="flex items-center justify-between mb-4">
        <button onClick={onBack} className="game-btn-ghost text-sm px-3 py-1.5">← 戻る</button>
        <h1 className="font-black text-lg text-purple-300">📋 パッチノート</h1>
        <span className="text-[10px] text-muted-foreground">{APP_VERSION}</span>
      </div>

      <div className="flex flex-col gap-3 max-w-md mx-auto">
        {PATCH_NOTES.map((p, idx) => {
          const isOpen = open === p.version;
          return (
            <motion.div
              key={p.version}
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="glass-panel overflow-hidden"
            >
              <button
                onClick={() => setOpen(isOpen ? '' : p.version)}
                className="w-full flex items-center justify-between p-3 text-left"
              >
                <div>
                  <div className="font-black text-sm text-yellow-300">{p.version}</div>
                  <div className="text-[10px] text-muted-foreground">{p.date}</div>
                </div>
                <span className="text-xs text-purple-300">{isOpen ? '▼' : '▶'}</span>
              </button>

              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="px-3 pb-3 space-y-3">
                      {p.highlights.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {p.highlights.map(h => (
                            <span key={h} className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-200 border border-purple-500/30">
                              ⭐ {h}
                            </span>
                          ))}
                        </div>
                      )}

                      {(Object.keys(p.changes) as PatchCategory[]).map(cat => {
                        const meta = PATCH_CATEGORY_META[cat];
                        const items = p.changes[cat] ?? [];
                        if (!items.length) return null;
                        return (
                          <div key={cat}>
                            <div className="flex items-center gap-1.5 mb-1">
                              <span
                                className="text-[10px] px-1.5 py-0.5 rounded font-bold"
                                style={{ background: meta.color + '33', color: meta.color, border: `1px solid ${meta.color}66` }}
                              >
                                {meta.em} {meta.label}
                              </span>
                            </div>
                            <ul className="text-xs text-muted-foreground space-y-1 pl-3">
                              {items.map((it, i) => (
                                <li key={i} className="leading-relaxed">・{it}</li>
                              ))}
                            </ul>
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default PatchNotesScreen;
