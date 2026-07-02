import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { lovable } from '@/integrations/lovable/index';
import { toast } from 'sonner';

const Auth = () => {
  const nav = useNavigate();
  const { session, signIn, signUp, resetPassword } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup' | 'reset'>('signin');
  const [email, setEmail] = useState('');
  const [pass, setPass]   = useState('');
  const [name, setName]   = useState('');
  const [busy, setBusy]   = useState(false);

  useEffect(() => { if (session) nav('/'); }, [session, nav]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === 'signin') {
        const { error } = await signIn(email, pass);
        if (error) toast.error(error.message); else nav('/');
      } else if (mode === 'signup') {
        const { error } = await signUp(email, pass, name);
        if (error) toast.error(error.message); else toast.success('登録メールを確認してください');
      } else {
        const { error } = await resetPassword(email);
        if (error) toast.error(error.message); else toast.success('パスワード再設定メールを送信しました');
      }
    } finally { setBusy(false); }
  };

  const google = async () => {
    setBusy(true);
    try {
      const r = await lovable.auth.signInWithOAuth('google', { redirect_uri: window.location.origin });
      if (r.error) toast.error(String((r.error as any).message ?? r.error));
    } finally { setBusy(false); }
  };

  return (
    <div className="min-h-[100dvh] flex items-center justify-center p-4 bg-background text-foreground">
      <div className="glass-panel w-full max-w-sm p-6 space-y-4">
        <div className="text-center">
          <div className="text-3xl">🔐</div>
          <h1 className="text-xl font-black text-cyan-300 mt-1">
            {mode === 'signin' ? 'ログイン' : mode === 'signup' ? '新規登録' : 'パスワード再設定'}
          </h1>
        </div>

        <button onClick={google} disabled={busy}
          className="w-full py-2.5 rounded-lg text-sm font-bold bg-white text-slate-900 flex items-center justify-center gap-2 disabled:opacity-50">
          <span>G</span> Google でサインイン
        </button>

        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
          <div className="flex-1 h-px bg-white/10" /> または <div className="flex-1 h-px bg-white/10" />
        </div>

        <form onSubmit={submit} className="space-y-2">
          {mode === 'signup' && (
            <input value={name} onChange={e => setName(e.target.value)} placeholder="表示名"
              className="w-full px-3 py-2 rounded bg-black/40 border border-white/10 text-sm" />
          )}
          <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="メールアドレス"
            className="w-full px-3 py-2 rounded bg-black/40 border border-white/10 text-sm" />
          {mode !== 'reset' && (
            <input type="password" required value={pass} onChange={e => setPass(e.target.value)} placeholder="パスワード（6文字以上）" minLength={6}
              className="w-full px-3 py-2 rounded bg-black/40 border border-white/10 text-sm" />
          )}
          <button type="submit" disabled={busy} className="game-btn-primary w-full py-2 text-sm">
            {busy ? '…' : mode === 'signin' ? 'ログイン' : mode === 'signup' ? '登録' : '再設定メール送信'}
          </button>
        </form>

        <div className="flex justify-between text-[11px] text-cyan-300">
          {mode !== 'signin' && <button onClick={() => setMode('signin')}>← ログイン</button>}
          {mode === 'signin' && <button onClick={() => setMode('signup')}>新規登録 →</button>}
          {mode === 'signin' && <button onClick={() => setMode('reset')}>パスワードを忘れた</button>}
        </div>

        <Link to="/" className="block text-center text-[11px] text-muted-foreground">← ホームへ戻る</Link>
      </div>
    </div>
  );
};

export default Auth;
