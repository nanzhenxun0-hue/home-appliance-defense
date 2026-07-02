
-- Lock down internal functions
REVOKE ALL ON FUNCTION public.set_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.gen_friend_code() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;

-- Player-callable RPCs: authenticated only
REVOKE ALL ON FUNCTION public.execute_trade(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.execute_trade(uuid) TO authenticated;

REVOKE ALL ON FUNCTION public.submit_score(text, bigint, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.submit_score(text, bigint, integer) TO authenticated;

REVOKE ALL ON FUNCTION public.claim_admin(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.claim_admin(text) TO authenticated;
