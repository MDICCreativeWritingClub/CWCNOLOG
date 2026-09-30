-- Reader accounts replace the old anonymous machine-fingerprint dedup
-- entirely for this version of the site. Voting, commenting, and
-- submitting now all require a verified Supabase Auth account, so "one
-- vote per article" can simply mean "one row per (article_id, user_id)"
-- -- no IP, no hardware signature, no session/fingerprint fallback
-- needed, since a real signed-in identity is a much stronger key than
-- any of those heuristics.
--
-- Safe to run alongside the existing voter_log table from the previous
-- (anonymous) voting system -- this adds a new nullable user_id column
-- and a new function rather than altering old rows or dropping
-- anything. The old machine_key/session_id/fingerprint columns and
-- cast_vote_v2 are left untouched.

alter table public.voter_log add column if not exists user_id uuid references auth.users(id);

-- One vote per article per account.
create unique index if not exists voter_log_article_user_idx
  on public.voter_log (article_id, user_id)
  where user_id is not null;

create or replace function public.cast_vote_v3(
  p_article_id text
)
returns integer
security definer
set search_path = public
language plpgsql
as $function$
declare
  new_count integer;
  already_voted boolean;
  v_user_id uuid;
begin
  -- auth.uid() resolves from the caller's own JWT (Supabase forwards it
  -- automatically on an rpc() call) -- not a client-supplied value, so
  -- there's nothing here for a caller to spoof by passing a different id.
  v_user_id := auth.uid();

  if v_user_id is null then
    raise exception 'NOT_AUTHENTICATED: you must be signed in to vote'
      using errcode = 'P0001';
  end if;

  select exists(
    select 1 from voter_log
    where article_id = p_article_id and user_id = v_user_id
  ) into already_voted;

  if already_voted then
    raise exception 'ALREADY_VOTED: you have already voted for this article'
      using errcode = 'P0001';
  end if;

  begin
    insert into voter_log (article_id, user_id)
    values (p_article_id, v_user_id);
  exception when unique_violation then
    -- Same race-condition guard as cast_vote_v2: the unique index
    -- catches two near-simultaneous requests from the same account.
    raise exception 'ALREADY_VOTED: you have already voted for this article'
      using errcode = 'P0001';
  end;

  insert into votes (article_id, count)
  values (p_article_id, 1)
  on conflict (article_id)
  do update set count = votes.count + 1
  returning count into new_count;

  return new_count;
end;
$function$;

grant execute on function public.cast_vote_v3(text) to authenticated;

-- Lets a signed-in reader check which articles they've already voted on.
-- Deliberately a function rather than an RLS policy on voter_log: this
-- table is still read directly (via the anon key, not through a
-- function) by the original interactive site's /api/vote GET handler,
-- and enabling table-wide RLS here would change that table's default
-- access for that unrelated code path too. A security definer function
-- avoids touching voter_log's existing RLS posture at all.
create or replace function public.get_my_voted_articles()
returns table (article_id text)
security definer
set search_path = public
language sql
as $function$
  select v.article_id
  from voter_log v
  where v.user_id = auth.uid();
$function$;

grant execute on function public.get_my_voted_articles() to authenticated;

-- The old anon-based cast_vote/cast_vote_v2 paths remain granted to
-- anon as a fallback and are not revoked here, but the app no longer
-- calls them now that voting requires a real account.
