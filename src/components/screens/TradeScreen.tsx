import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useTrades, syncInventoryUp, fetchInventory, type TradeItem } from '@/hooks/useTrades';
import type { TowerID } from '@/game/types';
import { TDEFS } from '@/game/constants';
import CharIcon from '@/components/CharIcon';
import { toast } from 'sonner';

interface Props {
  onBack: () => void;
  counts: Partial<Record<TowerID, number>>;
  onServerInventory: (inv: Partial<Record<TowerID, number>>) => void;
}

const TradeScreen = ({ onBack, counts, onServerInventory }: Props) => {
  const { user, profile } = useAuth();
  const { incoming, outgoing, history, send, accept, decline, cancel } = useTrades(user?.id);
  const [tab, setTab] = useState<'send' | 'in' | 'out' | 'hist'>('send');
  const [friendCode, setFriendCode] = useState('');
  const [offer, setOffer]     = useState<Partial<Record<TowerID, number>>>({});
  const [request, setRequest] = useState<Partial<Record<TowerID, number>>>({});
  const [picker, setPicker] = useState<'offer' | 'request' | null>(null);

  // Push local counts up on mount, then pull server inventory for accurate offer amounts.
  useEffect(() => {
    if (!user) return;
    (async () => {
      await syncInventoryUp(user.id, counts);
      const server = await fetchInventory(user.id);
      onServerInventory(server);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  if (!user) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center p-4 bg-background">
        <div className="glass-panel p-6 text-center space-y-2">
          <p className="text-sm">🔐 ログインが必要です</p>
          <button onClick={onBack} className="game-btn-primary text-xs px-4 py-1.5">戻る</button>
        </div>
      </div>
    );
  }

  const owned = useMemo(() => (Object.entries(counts) as [TowerID, number][])
    .filter(([, c]) => (c ?? 0) > 0), [counts]);

  const bump = (which: 'offer' | 'request', tid: TowerID, delta: number) => {
    const setter = which === 'offer' ? setOffer : setRequest;
    setter(prev => {
      const cur = prev[tid] ?? 0;
      const owned = counts[tid] ?? 0;
      const max = which === 'offer' ? owned : 99;
      const next = Math.max(0, Math.min(max, cur + delta));
      const out = { ...prev };
      if (next === 0) delete out[tid]; else out[tid] = next;
      return out;
    });
  };

  const doSend = async () => {
    const off = (Object.entries(offer) as [TowerID, number][]).map(([tower_id, count]) => ({ tower_id, count }));
    const req = (Object.entries(request) as [TowerID, number][]).map(([tower_id, count]) => ({ tower_id, count }));
    if (!friendCode.trim()) return toast.error('相手のフレンドコードを入力');
    if (!off.length || !req.length) return toast.error('提供と要求を1つ以上選択');
    const r = await send(friendCode, off as TradeItem[], req as TradeItem[]);
    if (!r.ok) return toast.error(r.error);
    toast.success('トレード申請を送信しました');
    setOffer({}); setRequest({}); setFriendCode('');
    setTab('out');
  };

  const doAccept = async (id: string) => {
    const r = await accept(id);
    if (!r?.ok) return toast.error(r?.error ?? '失敗');
    toast.success('トレード成立！');
    if (user) { const s = await fetchInventory(user.id); onServerInventory(s); }
  };

  const renderItems = (items: TradeItem[]) => (
    <div className="flex flex-wrap gap-1">
      {items.map(it => {
        const d = TDEFS[it.tower_id];
        return <span key={it.tower_id} className="flex items-center gap-1 bg-white/5 rounded px-1.5 py-0.5 text-[10px]">
          <CharIcon tid={it.tower_id} size={14} /> {d?.name ?? it.tower_id} ×{it.count}
        </span>;
      })}
    </div>
  );

  return (
    <div className="min-h-[100dvh] p-3 bg-background text-foreground">
      <div className="max-w-md mx-auto space-y-3">
        <div className="flex items-center justify-between">
          <button onClick={onBack} className="game-btn-ghost text-xs">← 戻る</button>
          <h1 className="text-lg font-black text-cyan-300">🔄 トレード</h1>
          <div className="w-14" />
        </div>

        <div className="glass-panel p-2 text-[11px]">
          <div className="text-muted-foreground">自分のフレンドコード</div>
          <div className="flex items-center gap-2">
            <div className="text-cyan-300 font-black text-sm select-all">{profile?.friend_code ?? '…'}</div>
            {profile?.friend_code && (
              <button onClick={() => { navigator.clipboard.writeText(profile.friend_code); toast.success('コピーしました'); }}
                className="text-[10px] px-2 py-0.5 rounded bg-white/10">Copy</button>
            )}
          </div>
        </div>

        <div className="flex gap-1">
          {(['send','in','out','hist'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`flex-1 px-1 py-1.5 rounded text-[10px] font-bold ${tab===t?'bg-cyan-500 text-black':'bg-white/5 text-cyan-200'}`}>
              {t==='send'?'📮 送信':t==='in'?`📥 受信(${incoming.length})`:t==='out'?`📤 送信中(${outgoing.length})`:'📜 履歴'}
            </button>
          ))}
        </div>

        {tab === 'send' && (
          <div className="space-y-2">
            <input value={friendCode} onChange={e => setFriendCode(e.target.value.toUpperCase())}
              placeholder="相手のフレンドコード KADEN-XXXXXX"
              className="w-full px-3 py-2 rounded bg-black/40 border border-white/10 text-sm" />
            <div className="glass-panel p-2 space-y-1">
              <div className="flex justify-between text-[11px]">
                <span className="text-green-300">📤 提供 ({Object.keys(offer).length})</span>
                <button onClick={() => setPicker('offer')} className="text-[10px] px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-200">+ 追加</button>
              </div>
              {Object.entries(offer).map(([tid, c]) => (
                <div key={tid} className="flex items-center gap-2 text-[11px]">
                  <CharIcon tid={tid as TowerID} size={16} />
                  <span className="flex-1">{TDEFS[tid as TowerID]?.name}</span>
                  <button onClick={() => bump('offer', tid as TowerID, -1)} className="w-5 h-5 rounded bg-white/10">-</button>
                  <span className="w-8 text-center">{c}/{counts[tid as TowerID] ?? 0}</span>
                  <button onClick={() => bump('offer', tid as TowerID, +1)} className="w-5 h-5 rounded bg-white/10">+</button>
                </div>
              ))}
            </div>
            <div className="glass-panel p-2 space-y-1">
              <div className="flex justify-between text-[11px]">
                <span className="text-yellow-300">📥 要求 ({Object.keys(request).length})</span>
                <button onClick={() => setPicker('request')} className="text-[10px] px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-200">+ 追加</button>
              </div>
              {Object.entries(request).map(([tid, c]) => (
                <div key={tid} className="flex items-center gap-2 text-[11px]">
                  <CharIcon tid={tid as TowerID} size={16} />
                  <span className="flex-1">{TDEFS[tid as TowerID]?.name}</span>
                  <button onClick={() => bump('request', tid as TowerID, -1)} className="w-5 h-5 rounded bg-white/10">-</button>
                  <span className="w-8 text-center">{c}</span>
                  <button onClick={() => bump('request', tid as TowerID, +1)} className="w-5 h-5 rounded bg-white/10">+</button>
                </div>
              ))}
            </div>
            <button onClick={doSend} className="game-btn-primary w-full py-2 text-sm">🚀 申請を送信</button>
          </div>
        )}

        {tab === 'in' && (
          <div className="space-y-2">
            {incoming.length === 0 && <div className="text-xs text-muted-foreground text-center py-6">受信中の申請はありません</div>}
            {incoming.map(t => (
              <div key={t.id} className="glass-panel p-2 space-y-1.5 text-[11px]">
                <div className="text-green-300">相手が提供:</div>{renderItems(t.offer)}
                <div className="text-yellow-300 mt-1">あなたに要求:</div>{renderItems(t.request)}
                <div className="flex gap-2 pt-1">
                  <button onClick={() => doAccept(t.id)} className="game-btn-primary flex-1 text-xs py-1">✓ 承認</button>
                  <button onClick={() => decline(t.id)} className="game-btn-ghost flex-1 text-xs py-1">✗ 拒否</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === 'out' && (
          <div className="space-y-2">
            {outgoing.length === 0 && <div className="text-xs text-muted-foreground text-center py-6">送信中の申請はありません</div>}
            {outgoing.map(t => (
              <div key={t.id} className="glass-panel p-2 space-y-1.5 text-[11px]">
                <div className="text-green-300">提供:</div>{renderItems(t.offer)}
                <div className="text-yellow-300 mt-1">要求:</div>{renderItems(t.request)}
                <button onClick={() => cancel(t.id)} className="game-btn-ghost w-full text-xs py-1 mt-1">キャンセル</button>
              </div>
            ))}
          </div>
        )}

        {tab === 'hist' && (
          <div className="space-y-1">
            {history.length === 0 && <div className="text-xs text-muted-foreground text-center py-6">履歴はありません</div>}
            {history.map(t => (
              <div key={t.id} className="glass-panel p-2 text-[10px]">
                <div className={`font-bold ${t.status==='accepted'?'text-green-300':t.status==='declined'?'text-red-300':'text-muted-foreground'}`}>
                  {t.status.toUpperCase()} · {new Date(t.created_at).toLocaleDateString('ja-JP')}
                </div>
                <div className="mt-1">{renderItems(t.offer)}</div>
                <div className="text-muted-foreground text-center">↕</div>
                <div>{renderItems(t.request)}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {picker && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-end sm:items-center justify-center p-3" onClick={() => setPicker(null)}>
          <div onClick={e => e.stopPropagation()} className="glass-panel w-full max-w-sm max-h-[70dvh] overflow-y-auto p-3 space-y-1">
            <div className="text-xs font-bold text-cyan-300 mb-2">追加するキャラを選択</div>
            {owned.map(([tid, c]) => (
              <button key={tid} onClick={() => { bump(picker, tid, +1); setPicker(null); }}
                className="w-full flex items-center gap-2 p-1.5 rounded hover:bg-white/5 text-[11px]">
                <CharIcon tid={tid} size={20} />
                <span className="flex-1 text-left">{TDEFS[tid]?.name}</span>
                <span className="text-muted-foreground">×{c}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default TradeScreen;
