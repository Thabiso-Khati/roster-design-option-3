-- ============================================================
-- ROSTER — Migration 027: Atomic AI budget increment RPC
-- ------------------------------------------------------------
-- Creates the `increment_ai_spent` Postgres function so the
-- lib/ai/budget.ts recordCall path can use a single atomic
-- UPDATE instead of a read-modify-write round-trip.
--
-- Without this, concurrent AI calls from the same user can
-- read the same `spent_usd` value, each add their cost, and
-- both write back — the second write silently overwrites the
-- first, causing under-counting and allowing spend to exceed
-- the monthly budget cap.
--
-- The function is SECURITY DEFINER so it can write to ai_usage
-- even though client RLS blocks direct UPDATE on that table.
-- ============================================================

create or replace function public.increment_ai_spent(
  p_user_id uuid,
  p_amount   numeric
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.ai_usage
     set spent_usd  = spent_usd + p_amount,
         updated_at = now()
   where user_id = p_user_id;

  -- Guard: if the row doesn't exist yet (race between seed and first
  -- call), insert it.  ON CONFLICT makes this idempotent.
  if not found then
    insert into public.ai_usage (user_id, spent_usd)
    values (p_user_id, p_amount)
    on conflict (user_id) do update
       set spent_usd  = ai_usage.spent_usd + p_amount,
           updated_at = now();
  end if;
end;
$$;

-- Revoke public execute; only the service role (used by the server)
-- should be able to call this function.
revoke execute on function public.increment_ai_spent(uuid, numeric) from public;
revoke execute on function public.increment_ai_spent(uuid, numeric) from anon;
revoke execute on function public.increment_ai_spent(uuid, numeric) from authenticated;
