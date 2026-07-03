export const isCloudConfigured = () =>
  Boolean(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY);

let clientPromise: Promise<any | null> | null = null;

export const getSupabaseClient = async () => {
  if (!isCloudConfigured()) return null;
  if (!clientPromise) {
    clientPromise = import('@/integrations/supabase/client')
      .then(mod => mod.supabase)
      .catch(error => {
        console.warn('Backend client unavailable; online features are disabled for this build.', error);
        return null;
      });
  }
  return clientPromise;
};

export const cloudUnavailableError = () =>
  new Error('オンライン機能はバックエンド設定済みのビルドで利用できます。');