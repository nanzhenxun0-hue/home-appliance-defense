import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { consumeReturnPath } from '@/lib/authRedirect';

/**
 * 互換用コールバック。旧設定の /auth/callback に戻ってきた場合でも
 * 404 にせず、セッション確立後にアプリ内へ戻す。
 */
const AuthCallback = () => {
  const nav = useNavigate();

  useEffect(() => {
    let done = false;
    const go = () => {
      if (done) return;
      done = true;
      nav(consumeReturnPath() ?? '/', { replace: true });
    };
    (async () => {
      try {
        const { supabase } = await import('@/integrations/supabase/client');
        await supabase.auth.getSession();
      } catch {}
      go();
    })();
    const t = setTimeout(go, 4000);
    return () => clearTimeout(t);
  }, [nav]);

  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-background text-foreground">
      <div className="glass-panel px-6 py-4 text-sm text-cyan-300">サインイン処理中…</div>
    </div>
  );
};

export default AuthCallback;
