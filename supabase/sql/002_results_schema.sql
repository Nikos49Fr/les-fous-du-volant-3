create table if not exists public.result_sessions (
    id uuid primary key default gen_random_uuid(),
    gp_round integer not null check (gp_round between 1 and 12),
    session_type text not null check (
        session_type in (
            'sprint_qualifying',
            'sprint',
            'race_qualifying',
            'race'
        )
    ),
    fastest_lap_driver_id text references public.drivers(id) on delete set null,
    created_at timestamptz not null default timezone('utc', now()),
    updated_at timestamptz not null default timezone('utc', now()),
    updated_by uuid references public.profiles(id) on delete set null,
    unique (gp_round, session_type)
);

drop trigger if exists set_result_sessions_updated_at on public.result_sessions;

create trigger set_result_sessions_updated_at
before update on public.result_sessions
for each row
execute function public.set_updated_at();

create table if not exists public.result_entries (
    session_id uuid not null references public.result_sessions(id) on delete cascade,
    driver_id text not null references public.drivers(id) on delete cascade,
    position integer,
    status text,
    has_fastest_lap boolean not null default false,
    created_at timestamptz not null default timezone('utc', now()),
    updated_at timestamptz not null default timezone('utc', now()),
    updated_by uuid references public.profiles(id) on delete set null,
    primary key (session_id, driver_id),
    constraint result_entries_position_or_status_check check (
        (position is null and status is not null)
        or (position is not null and status is null)
    ),
    constraint result_entries_position_range_check check (
        position is null or position between 1 and 20
    ),
    constraint result_entries_status_check check (
        status is null or status in ('DNS', 'DNF', 'ABS', 'DSQ')
    )
);

drop trigger if exists set_result_entries_updated_at on public.result_entries;

create trigger set_result_entries_updated_at
before update on public.result_entries
for each row
execute function public.set_updated_at();

create unique index if not exists idx_result_entries_single_fastest_lap
on public.result_entries (session_id)
where has_fastest_lap = true;

create index if not exists idx_result_sessions_gp_round
on public.result_sessions (gp_round);

create index if not exists idx_result_entries_driver_id
on public.result_entries (driver_id);

alter table public.result_sessions enable row level security;
alter table public.result_entries enable row level security;

drop policy if exists "result_sessions_select_public" on public.result_sessions;
drop policy if exists "result_entries_select_public" on public.result_entries;
drop policy if exists "result_sessions_manage_results_write" on public.result_sessions;
drop policy if exists "result_entries_manage_results_write" on public.result_entries;

create policy "result_sessions_select_public"
on public.result_sessions
for select
to public
using (true);

create policy "result_entries_select_public"
on public.result_entries
for select
to public
using (true);

create policy "result_sessions_manage_results_write"
on public.result_sessions
for all
to authenticated
using (public.current_user_has_capability('results.write'))
with check (public.current_user_has_capability('results.write'));

create policy "result_entries_manage_results_write"
on public.result_entries
for all
to authenticated
using (public.current_user_has_capability('results.write'))
with check (public.current_user_has_capability('results.write'));

insert into public.capabilities (id, label, description, is_system)
values (
    'results.write',
    'Résultats',
    'Saisit et met à jour les résultats des qualifications et des courses.',
    true
)
on conflict (id) do update
set
    label = excluded.label,
    description = excluded.description,
    is_system = excluded.is_system,
    updated_at = timezone('utc', now());
