import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { CodeReward, CampaignCode } from '@/hooks/useCampaignCodes';
import type { TowerID } from '@/game/types';
import { TDEFS } from '@/game/constants';
import { RARITY_COLOR } from '@/game/types';

interface CampaignCodeScreenProps {
  isAdmin: boolean;
  codes: CampaignCode[];
  redeemed: string[];
  onRedeem: (code: string) => { ok: true; reward: CodeReward } | { ok: false; error: string };
  onCreateCode: (code: string, reward: CodeReward) => boolean | Promise<boolean>;
  onDeleteCode: (code: string) => void;
  onDeactivateAdmin: () => void;
  onRewardApply: (reward: CodeReward) => void;
  onBack: () => void;
}

const ALL_TOWERS = Object.keys(TDEFS) as TowerID[];

const AdminCodeForm = ({ onCreateCode }: { onCreateCode: (code: string, reward: CodeReward) => boolean | Promise<boolean> }) => {
  const [code, setCode] = useState('');
  const [volts, setVolts] = useState('');
  const [pulls, setPulls] = useState('');
  const [unit, setUnit] = useState<TowerID | ''>('');
  const [desc, setDesc] = useState('');
  const [msg, setMsg] = useState('');

  const submit = async () => {
    if (!code.trim() || !desc.trim()) { setMsg('コードと説明は必須です。'); return; }
    const reward: CodeReward = {
      desc,
      ...(volts ? { volts: Number(volts) } : {}),
      ...(pulls ? { pulls: Number(pulls) } : {}),
      ...(unit ? { unit: unit as TowerID } : {}),
    };
    setMsg('⏳ 同期中…');
    const ok = await onCreateCode(code, reward);
    if (ok) {
      setMsg(`✅ コード「${code.toUpperCase()}」を全サーバーに公開しました！`);
      setCode(''); setVolts(''); setPulls(''); setUnit(''); setDesc('');
    } else {
      setMsg('❌ 作成に失敗しました（重複/通信エラー）。');
    }
  };

  return (
    <div className="sf-hud-frame p-3 rounded-xl flex flex-col gap-2">
      <div className="text-xs font-bold sf-chrome-text">▸ NEW CODE TRANSMISSION</div>
      <input
        className="rounded-lg border border-purple-500/40 bg-background/60 px-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-purple-400 font-mono tracking-widest"
        placeholder="コード名（英数字）" value={code}
        onChange={e => setCode(e.target.value.toUpperCase())}
        maxLength={20}
      />
      <input
        className="rounded-lg border border-yellow-500/40 bg-background/60 px-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-yellow-400"
        placeholder="ボルト報酬（例: 500）" type="number" value={volts}
        onChange={e => setVolts(e.target.value)}
      />
      <input
        className="rounded-lg border border-blue-500/40 bg-background/60 px-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-blue-400"
        placeholder="ガチャ引き数（例: 10）" type="number" value={pulls}
        onChange={e => setPulls(e.target.value)}
      />
      <select
        className="rounded-lg border border-pink-500/40 bg-background/60 px-3 py-1.5 text-sm text-foreground focus:outline-none focus:border-pink-400"
        value={unit}
        onChange={e => setUnit(e.target.value as TowerID | '')}
      >
        <option value="">キャラ報酬（任意）— 選択しない</option>
        {ALL_TOWERS.map(tid => {
          const d = TDEFS[tid];
          return <option key={tid} value={tid}>[{d.r}] {d.n}</option>;
        })}
      </select>
      <input
        className="rounded-lg border border-green-500/40 bg-background/60 px-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-green-400"
        placeholder="報酬説明（例: 夏のキャンペーン特典）" value={desc}
        onChange={e => setDesc(e.target.value)}
        maxLength={40}
      />
      <button onClick={submit} className="game-btn-primary text-sm py-1.5">＋ コード作成</button>
      {msg && <div className="text-xs text-center" style={{ color: msg.startsWith('✅') ? '#4ade80' : '#f87171' }}>{msg}</div>}
    </div>
  );
};

const AdminCodeList = ({ codes, redeemed, onDelete }: { codes: CampaignCode[]; redeemed: string[]; onDelete: (c: string) => void }) => {
  if (codes.length === 0) return <div className="text-xs text-muted-foreground text-center py-2">コードがまだありません</div>;
  return (
    <div className="flex flex-col gap-1.5 max-h-52 overflow-y-auto">
      {codes.map(c => (
        <div key={c.code} className="glass-panel rounded-lg px-3 py-2 flex items-center justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="text-xs font-bold text-yellow-300 font-mono">{c.code}</div>
            <div className="text-[10px] text-muted-foreground truncate">{c.reward.desc}</div>
            <div className="text-[10px] flex gap-2 mt-0.5 flex-wrap">
              {c.reward.volts && <span className="text-yellow-400">⚡ {c.reward.volts}V</span>}
              {c.reward.pulls && <span className="text-blue-400">🎰 {c.reward.pulls}回</span>}
              {c.reward.unit && <span className="text-pink-400">🎁 {TDEFS[c.reward.unit]?.n ?? c.reward.unit}</span>}
              <span className={redeemed.includes(c.code) ? 'text-green-400' : 'text-muted-foreground'}>
                {redeemed.includes(c.code) ? '使用済み(自分)' : '未使用'}
              </span>
            </div>
          </div>
          <button onClick={() => onDelete(c.code)} className="text-red-400 hover:text-red-300 text-lg leading-none px-1">×</button>
        </div>
      ))}
    </div>
  );
};

const AdminUnitList = () => (
  <div>
    <div className="text-xs font-bold text-green-300 mb-1">全ユニット一覧（{ALL_TOWERS.length}体）</div>
    <div className="grid grid-cols-6 gap-1 max-h-44 overflow-y-auto">
      {ALL_TOWERS.map(tid => {
        const def = TDEFS[tid];
        return (
          <div key={tid} className="flex flex-col items-center rounded-lg p-1"
            style={{ background: RARITY_COLOR[def.r] + '18', border: `1px solid ${RARITY_COLOR[def.r]}44` }}>
            <span className="text-base">{def.em}</span>
            <span className="text-[6px] font-bold" style={{ color: RARITY_COLOR[def.r] }}>{def.r}</span>
            <span className="text-[6px] text-muted-foreground leading-tight text-center">{def.n.slice(0,4)}</span>
          </div>
        );
      })}
    </div>
    <div className="text-[9px] text-muted-foreground mt-1">※ 管理者モード中は「編成」画面で全ユニットを選択可能</div>
  </div>
);

const CampaignCodeScreen = ({
  isAdmin, codes, redeemed,
  onRedeem, onCreateCode, onDeleteCode, onDeactivateAdmin,
  onRewardApply, onBack,
}: CampaignCodeScreenProps) => {
  const [input, setInput] = useState('');
  const [result, setResult] = useState<{ ok: boolean; msg: string; reward?: CodeReward } | null>(null);
  const [adminTab, setAdminTab] = useState<'codes' | 'units' | 'create'>('codes');

  const handleSubmit = () => {
    const res = onRedeem(input.trim());
    if (res.ok) {
      onRewardApply(res.reward);
      setResult({ ok: true, msg: res.reward.desc === '管理者モード有効化' ? '🛡️ 管理者モードを有効化しました' : `✅ コード「${input.trim().toUpperCase()}」を使用しました！`, reward: res.reward });
      setInput('');
    } else {
      setResult({ ok: false, msg: (res as { ok: false; error: string }).error });
    }
  };

  return (
    <div className="min-h-[100dvh] bg-background flex flex-col p-3 relative overflow-hidden">
      <div className="absolute inset-0 z-0 opacity-20"
        style={{ background: 'radial-gradient(ellipse at 50% 30%, hsl(270 80% 25%), transparent 70%)' }} />

      <div className="relative z-10 flex flex-col gap-3 flex-1 min-h-0 max-w-sm mx-auto w-full">
        {/* Header */}
        <div className="flex items-center justify-between pt-1">
          <button onClick={onBack} className="game-btn-ghost text-sm">← 戻る</button>
          <h1 className="text-base font-black" style={{
            background: isAdmin ? 'linear-gradient(90deg,#ffd700,#ff4081,#7c4dff)' : 'linear-gradient(90deg,#a855f7,#6366f1)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>
            {isAdmin ? '🛡️ 管理者パネル' : '🎟️ キャンペーンコード'}
          </h1>
          <div className="w-12" />
        </div>

        {/* Admin badge */}
        {isAdmin && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
            className="glass-panel rounded-xl px-3 py-2 flex items-center justify-between gap-2"
            style={{ border: '1px solid #ffd70066', background: 'rgba(255,215,0,0.05)' }}>
            <div>
              <div className="text-xs font-black text-yellow-300">🛡️ 管理者モード有効</div>
              <div className="text-[10px] text-muted-foreground">全機能にアクセスできます</div>
            </div>
            <button onClick={onDeactivateAdmin} className="text-[10px] text-red-400 hover:text-red-300 border border-red-500/30 rounded px-2 py-0.5">解除</button>
          </motion.div>
        )}

        {/* Code input */}
        <div className="glass-panel rounded-xl p-4 flex flex-col gap-3">
          <div className="text-xs font-bold text-muted-foreground">コードを入力してください</div>
          <div className="flex gap-2">
            <input
              className="flex-1 rounded-lg border border-purple-500/40 bg-background/60 px-3 py-2 text-sm font-mono text-foreground uppercase placeholder:text-muted-foreground focus:outline-none focus:border-purple-400 tracking-widest"
              placeholder="CODE"
              value={input}
              onChange={e => { setInput(e.target.value.toUpperCase()); setResult(null); }}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              maxLength={24}
            />
            <button onClick={handleSubmit} disabled={!input.trim()}
              className="game-btn-primary px-4 text-sm disabled:opacity-40">
              使用
            </button>
          </div>
          <AnimatePresence>
            {result && (
              <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="rounded-lg px-3 py-2 text-sm font-bold text-center"
                style={{ background: result.ok ? 'rgba(74,222,128,0.1)' : 'rgba(248,113,113,0.1)', border: `1px solid ${result.ok ? '#4ade8055' : '#f8717155'}`, color: result.ok ? '#4ade80' : '#f87171' }}>
                {result.msg}
                {result.ok && result.reward && (
                  <div className="flex gap-3 justify-center mt-1.5 flex-wrap">
                    {result.reward.volts && <span className="text-yellow-300 text-xs">⚡ +{result.reward.volts}V</span>}
                    {result.reward.pulls && <span className="text-blue-300 text-xs">🎰 +{result.reward.pulls}回</span>}
                    {result.reward.unit && <span className="text-pink-300 text-xs">🎁 {TDEFS[result.reward.unit]?.n ?? result.reward.unit} 入手！</span>}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Admin panel */}
        {isAdmin && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-3 flex-1 min-h-0">
            {/* Tabs */}
            <div className="flex rounded-lg overflow-hidden border border-purple-500/30">
              {(['codes', 'create', 'units'] as const).map(tab => (
                <button key={tab} onClick={() => setAdminTab(tab)}
                  className="flex-1 text-xs py-1.5 font-bold transition-colors"
                  style={{ background: adminTab === tab ? 'rgba(168,85,247,0.25)' : 'transparent', color: adminTab === tab ? '#d8b4fe' : '#71717a' }}>
                  {tab === 'codes' ? '📋 コード一覧' : tab === 'create' ? '＋ 作成' : '🎮 全ユニット'}
                </button>
              ))}
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto">
              {adminTab === 'codes' && (
                <AdminCodeList codes={codes} redeemed={redeemed} onDelete={onDeleteCode} />
              )}
              {adminTab === 'create' && (
                <AdminCodeForm onCreateCode={onCreateCode} />
              )}
              {adminTab === 'units' && (
                <AdminUnitList />
              )}
            </div>
          </motion.div>
        )}

        {/* Hint for non-admin */}
        {!isAdmin && (
          <div className="text-center text-[10px] text-muted-foreground/50 mt-auto pb-2">
            ※ 特別なコードを入力すると追加報酬が得られます
          </div>
        )}
      </div>
    </div>
  );
};

export default CampaignCodeScreen;
