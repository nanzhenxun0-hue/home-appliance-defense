import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const ResetPassword = () => {
  const nav = useNavigate();
  const [pass, setPass] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password: pass });
    setBusy(false);
    if (error) toast.error(error.message);
    else { toast.success('パスワードを更新しました'); nav('/'); }
  };

  return (
    <div className="min-h-[100dvh] flex items-center justify-center p-4 bg-background">
      <form onSubmit={submit} className="glass-panel w-full max-w-sm p-6 space-y-3">
        <h1 className="text-lg font-black text-cyan-300">🔑 新しいパスワード</h1>
        <input type="password" required minLength={6} value={pass} onChange={e => setPass(e.target.value)}
          placeholder="新しいパスワード（6文字以上）"
          className="w-full px-3 py-2 rounded bg-black/40 border border-white/10 text-sm" />
        <button type="submit" disabled={busy} className="game-btn-primary w-full py-2 text-sm">
          {busy ? '…' : '更新'}
        </button>
      </form>
    </div>
  );
};

export default ResetPassword;
