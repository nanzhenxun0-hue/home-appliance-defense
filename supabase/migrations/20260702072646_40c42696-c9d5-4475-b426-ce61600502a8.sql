
-- ========== ENUMS ==========
CREATE TYPE public.app_role AS ENUM ('admin', 'user');
CREATE TYPE public.trade_status AS ENUM ('pending', 'accepted', 'declined', 'cancelled');

-- ========== PROFILES ==========
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  friend_code TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles readable by authenticated"
  ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "users update own profile"
  ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "users insert own profile"
  ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- ========== USER ROLES ==========
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users read own roles"
  ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

-- ========== INVENTORIES ==========
CREATE TABLE public.inventories (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tower_id TEXT NOT NULL,
  count INTEGER NOT NULL DEFAULT 1 CHECK (count >= 0),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, tower_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.inventories TO authenticated;
GRANT ALL ON public.inventories TO service_role;
ALTER TABLE public.inventories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users manage own inventory"
  ON public.inventories FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ========== TRADES ==========
CREATE TABLE public.trades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  to_user   UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  offer   JSONB NOT NULL, -- [{tower_id, count}]
  request JSONB NOT NULL,
  status trade_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.trades TO authenticated;
GRANT ALL ON public.trades TO service_role;
ALTER TABLE public.trades ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users see own trades"
  ON public.trades FOR SELECT TO authenticated
  USING (auth.uid() = from_user OR auth.uid() = to_user);
CREATE POLICY "users create trades as sender"
  ON public.trades FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = from_user);
CREATE POLICY "users cancel own sent trades"
  ON public.trades FOR UPDATE TO authenticated
  USING (auth.uid() = from_user OR auth.uid() = to_user)
  WITH CHECK (auth.uid() = from_user OR auth.uid() = to_user);

CREATE INDEX trades_to_user_idx ON public.trades(to_user, status);
CREATE INDEX trades_from_user_idx ON public.trades(from_user, status);

-- ========== LEADERBOARD ==========
CREATE TABLE public.leaderboard (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  diff TEXT NOT NULL,
  score BIGINT NOT NULL,
  wave INTEGER NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, diff)
);
GRANT SELECT ON public.leaderboard TO anon, authenticated;
GRANT INSERT, UPDATE ON public.leaderboard TO authenticated;
GRANT ALL ON public.leaderboard TO service_role;
ALTER TABLE public.leaderboard ENABLE ROW LEVEL SECURITY;
CREATE POLICY "leaderboard public read"
  ON public.leaderboard FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "users insert own leaderboard"
  ON public.leaderboard FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users update own leaderboard"
  ON public.leaderboard FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ========== TRIGGERS ==========
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER inventories_updated_at BEFORE UPDATE ON public.inventories
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trades_updated_at BEFORE UPDATE ON public.trades
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER leaderboard_updated_at BEFORE UPDATE ON public.leaderboard
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Friend code generator
CREATE OR REPLACE FUNCTION public.gen_friend_code()
RETURNS TEXT LANGUAGE plpgsql SET search_path = public AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  code TEXT;
  i INT;
  tries INT := 0;
BEGIN
  LOOP
    code := 'KADEN-';
    FOR i IN 1..6 LOOP
      code := code || substr(chars, 1 + floor(random() * length(chars))::int, 1);
    END LOOP;
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.profiles WHERE friend_code = code);
    tries := tries + 1;
    IF tries > 20 THEN RAISE EXCEPTION 'Cannot generate unique friend code'; END IF;
  END LOOP;
  RETURN code;
END; $$;

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, friend_code)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1), 'Player'),
    public.gen_friend_code()
  );
  RETURN NEW;
END; $$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ========== RPC: execute_trade ==========
CREATE OR REPLACE FUNCTION public.execute_trade(_trade_id UUID)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  t public.trades%ROWTYPE;
  item JSONB;
  tid TEXT;
  cnt INTEGER;
  cur INTEGER;
BEGIN
  SELECT * INTO t FROM public.trades WHERE id = _trade_id FOR UPDATE;
  IF NOT FOUND THEN RETURN jsonb_build_object('ok', false, 'error', 'trade_not_found'); END IF;
  IF t.status <> 'pending' THEN RETURN jsonb_build_object('ok', false, 'error', 'not_pending'); END IF;
  IF auth.uid() <> t.to_user THEN RETURN jsonb_build_object('ok', false, 'error', 'not_recipient'); END IF;

  -- Verify sender has offer
  FOR item IN SELECT * FROM jsonb_array_elements(t.offer) LOOP
    tid := item->>'tower_id';
    cnt := (item->>'count')::int;
    SELECT count INTO cur FROM public.inventories WHERE user_id = t.from_user AND tower_id = tid;
    IF COALESCE(cur, 0) < cnt THEN
      UPDATE public.trades SET status = 'cancelled' WHERE id = _trade_id;
      RETURN jsonb_build_object('ok', false, 'error', 'sender_insufficient');
    END IF;
  END LOOP;

  -- Verify recipient has request
  FOR item IN SELECT * FROM jsonb_array_elements(t.request) LOOP
    tid := item->>'tower_id';
    cnt := (item->>'count')::int;
    SELECT count INTO cur FROM public.inventories WHERE user_id = t.to_user AND tower_id = tid;
    IF COALESCE(cur, 0) < cnt THEN
      RETURN jsonb_build_object('ok', false, 'error', 'recipient_insufficient');
    END IF;
  END LOOP;

  -- Transfer offer: sender -> recipient
  FOR item IN SELECT * FROM jsonb_array_elements(t.offer) LOOP
    tid := item->>'tower_id';
    cnt := (item->>'count')::int;
    UPDATE public.inventories SET count = count - cnt WHERE user_id = t.from_user AND tower_id = tid;
    INSERT INTO public.inventories (user_id, tower_id, count)
      VALUES (t.to_user, tid, cnt)
      ON CONFLICT (user_id, tower_id) DO UPDATE SET count = public.inventories.count + EXCLUDED.count;
  END LOOP;

  -- Transfer request: recipient -> sender
  FOR item IN SELECT * FROM jsonb_array_elements(t.request) LOOP
    tid := item->>'tower_id';
    cnt := (item->>'count')::int;
    UPDATE public.inventories SET count = count - cnt WHERE user_id = t.to_user AND tower_id = tid;
    INSERT INTO public.inventories (user_id, tower_id, count)
      VALUES (t.from_user, tid, cnt)
      ON CONFLICT (user_id, tower_id) DO UPDATE SET count = public.inventories.count + EXCLUDED.count;
  END LOOP;

  UPDATE public.trades SET status = 'accepted' WHERE id = _trade_id;
  RETURN jsonb_build_object('ok', true);
END; $$;

-- ========== RPC: submit_score ==========
CREATE OR REPLACE FUNCTION public.submit_score(_diff TEXT, _score BIGINT, _wave INTEGER)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  uid UUID := auth.uid();
  dname TEXT;
BEGIN
  IF uid IS NULL THEN RETURN jsonb_build_object('ok', false, 'error', 'not_authenticated'); END IF;
  SELECT display_name INTO dname FROM public.profiles WHERE id = uid;
  IF dname IS NULL THEN dname := 'Player'; END IF;
  INSERT INTO public.leaderboard (user_id, display_name, diff, score, wave)
    VALUES (uid, dname, _diff, _score, _wave)
    ON CONFLICT (user_id, diff) DO UPDATE
      SET score = GREATEST(public.leaderboard.score, EXCLUDED.score),
          wave  = GREATEST(public.leaderboard.wave,  EXCLUDED.wave),
          display_name = EXCLUDED.display_name,
          updated_at = now();
  RETURN jsonb_build_object('ok', true);
END; $$;

-- ========== RPC: claim_admin ==========
CREATE OR REPLACE FUNCTION public.claim_admin(_passcode TEXT)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE uid UUID := auth.uid();
BEGIN
  IF uid IS NULL THEN RETURN jsonb_build_object('ok', false, 'error', 'not_authenticated'); END IF;
  IF _passcode <> 'CEO' THEN RETURN jsonb_build_object('ok', false, 'error', 'invalid_passcode'); END IF;
  INSERT INTO public.user_roles (user_id, role) VALUES (uid, 'admin') ON CONFLICT DO NOTHING;
  RETURN jsonb_build_object('ok', true);
END; $$;
