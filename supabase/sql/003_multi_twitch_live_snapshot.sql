create table if not exists public.multi_twitch_live_snapshot (
    id text primary key,
    live_channels jsonb not null default '[]'::jsonb,
    refresh_status text not null default 'idle' check (
        refresh_status in ('idle', 'running')
    ),
    refresh_trigger text check (
        refresh_trigger is null or refresh_trigger in ('auto', 'manual')
    ),
    refresh_started_at timestamptz,
    last_error text,
    updated_at timestamptz not null default timezone('utc', now())
);

alter table public.multi_twitch_live_snapshot enable row level security;

drop policy if exists "multi_twitch_live_snapshot_select_public" on public.multi_twitch_live_snapshot;

create policy "multi_twitch_live_snapshot_select_public"
on public.multi_twitch_live_snapshot
for select
to public
using (true);

insert into public.multi_twitch_live_snapshot (
    id,
    live_channels,
    refresh_status,
    refresh_trigger,
    refresh_started_at,
    last_error,
    updated_at
)
values (
    'default',
    '[]'::jsonb,
    'idle',
    null,
    null,
    null,
    timezone('utc', now()) - interval '5 minutes'
)
on conflict (id) do nothing;

create or replace function public.claim_multi_twitch_live_refresh(
    snapshot_id text,
    requested_trigger text,
    stale_before timestamptz,
    running_stale_before timestamptz
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
    rows_updated integer;
begin
    update public.multi_twitch_live_snapshot
    set
        refresh_status = 'running',
        refresh_trigger = requested_trigger,
        refresh_started_at = timezone('utc', now()),
        last_error = null
    where id = snapshot_id
        and updated_at < stale_before
        and (
            refresh_status = 'idle'
            or refresh_started_at is null
            or refresh_started_at < running_stale_before
        );

    get diagnostics rows_updated = row_count;

    return rows_updated > 0;
end;
$$;

grant execute on function public.claim_multi_twitch_live_refresh(text, text, timestamptz, timestamptz)
to authenticated, anon, service_role;
