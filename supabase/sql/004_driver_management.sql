alter table public.drivers
add column if not exists status text not null default 'active'
    check (status in ('draft', 'active', 'abandoned'));

alter table public.drivers
add column if not exists active_from_gp_round integer not null default 1
    check (active_from_gp_round >= 1);

alter table public.drivers
add column if not exists abandoned_after_gp_round integer
    check (abandoned_after_gp_round is null or abandoned_after_gp_round >= 1);

alter table public.drivers
add column if not exists abandoned_at timestamptz;

alter table public.drivers
drop constraint if exists drivers_gp_lifecycle_check;

alter table public.drivers
add constraint drivers_gp_lifecycle_check check (
    abandoned_after_gp_round is null
    or abandoned_after_gp_round >= active_from_gp_round
);

update public.drivers
set status = case
    when is_active = true then 'active'
    else 'draft'
end
where status is distinct from case
    when is_active = true then 'active'
    else 'draft'
end;

alter table public.result_entries
add column if not exists team_id text references public.teams(id) on delete restrict;

update public.result_entries re
set team_id = d.team_id
from public.drivers d
where re.driver_id = d.id
  and re.team_id is null;

alter table public.result_entries
alter column team_id set not null;

create index if not exists idx_result_entries_team_id
on public.result_entries (team_id);

insert into public.capabilities (id, label, description, is_system)
values (
    'multi_twitch.test_channels.view',
    'Multi-Twitch tests',
    'Affiche les chaînes Twitch de test dans la liste Multi-Twitch.',
    true
)
on conflict (id) do update
set
    label = excluded.label,
    description = excluded.description,
    is_system = excluded.is_system,
    updated_at = timezone('utc', now());
