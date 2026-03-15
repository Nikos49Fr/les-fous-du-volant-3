create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
    new.updated_at = timezone('utc', now());
    return new;
end;
$$;

create or replace function public.is_valid_revealed_array(values_to_check integer[])
returns boolean
language sql
immutable
as $$
    select
        values_to_check is not null
        and array_length(values_to_check, 1) = 12
        and not exists (
            select 1
            from unnest(values_to_check) as item
            where item < 0 or item > 24
        );
$$;

create table if not exists public.profiles (
    id uuid primary key references auth.users(id) on delete cascade,
    provider text not null default 'twitch',
    provider_user_id text unique,
    provider_login text,
    display_name text not null,
    avatar_url text,
    is_super_admin boolean not null default false,
    created_at timestamptz not null default timezone('utc', now()),
    updated_at timestamptz not null default timezone('utc', now())
);

create trigger set_profiles_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();

create table if not exists public.capabilities (
    id text primary key,
    label text not null,
    description text,
    is_system boolean not null default false,
    created_at timestamptz not null default timezone('utc', now()),
    updated_at timestamptz not null default timezone('utc', now())
);

create trigger set_capabilities_updated_at
before update on public.capabilities
for each row
execute function public.set_updated_at();

create table if not exists public.user_capabilities (
    user_id uuid not null references public.profiles(id) on delete cascade,
    capability_id text not null references public.capabilities(id) on delete cascade,
    enabled boolean not null default true,
    created_at timestamptz not null default timezone('utc', now()),
    created_by uuid references public.profiles(id) on delete set null,
    updated_at timestamptz not null default timezone('utc', now()),
    updated_by uuid references public.profiles(id) on delete set null,
    primary key (user_id, capability_id)
);

create trigger set_user_capabilities_updated_at
before update on public.user_capabilities
for each row
execute function public.set_updated_at();

create table if not exists public.teams (
    id text primary key,
    name text not null unique,
    short_name text not null,
    color_key text not null,
    logo_key text not null,
    created_at timestamptz not null default timezone('utc', now()),
    updated_at timestamptz not null default timezone('utc', now())
);

create trigger set_teams_updated_at
before update on public.teams
for each row
execute function public.set_updated_at();

create table if not exists public.drivers (
    id text primary key,
    display_name text not null unique,
    linked_user_id uuid unique references public.profiles(id) on delete set null,
    racing_number text not null,
    team_id text not null references public.teams(id) on delete restrict,
    is_streamer boolean not null default false,
    is_active boolean not null default true,
    created_at timestamptz not null default timezone('utc', now()),
    updated_at timestamptz not null default timezone('utc', now())
);

create trigger set_drivers_updated_at
before update on public.drivers
for each row
execute function public.set_updated_at();

create table if not exists public.calendar_settings (
    id text primary key,
    revealed integer[] not null,
    updated_at timestamptz not null default timezone('utc', now()),
    updated_by uuid references public.profiles(id) on delete set null,
    constraint calendar_settings_revealed_check check (
        public.is_valid_revealed_array(revealed)
    )
);

create or replace function public.current_profile_is_super_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
    select exists (
        select 1
        from public.profiles
        where id = auth.uid()
            and is_super_admin = true
    );
$$;

create or replace function public.current_user_has_capability(capability_name text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
    select
        public.current_profile_is_super_admin()
        or exists (
            select 1
            from public.user_capabilities uc
            where uc.user_id = auth.uid()
                and uc.capability_id = capability_name
                and uc.enabled = true
        );
$$;

alter table public.profiles enable row level security;
alter table public.capabilities enable row level security;
alter table public.user_capabilities enable row level security;
alter table public.teams enable row level security;
alter table public.drivers enable row level security;
alter table public.calendar_settings enable row level security;

create policy "profiles_select_self_or_super_admin"
on public.profiles
for select
to authenticated
using (
    auth.uid() = id
    or public.current_profile_is_super_admin()
);

create policy "profiles_insert_self"
on public.profiles
for insert
to authenticated
with check (auth.uid() = id);

create policy "profiles_update_self_or_super_admin"
on public.profiles
for update
to authenticated
using (
    auth.uid() = id
    or public.current_profile_is_super_admin()
)
with check (
    auth.uid() = id
    or public.current_profile_is_super_admin()
);

create policy "capabilities_select_authenticated"
on public.capabilities
for select
to authenticated
using (true);

create policy "capabilities_manage_super_admin"
on public.capabilities
for all
to authenticated
using (public.current_profile_is_super_admin())
with check (public.current_profile_is_super_admin());

create policy "user_capabilities_select_self_or_super_admin"
on public.user_capabilities
for select
to authenticated
using (
    user_id = auth.uid()
    or public.current_profile_is_super_admin()
);

create policy "user_capabilities_manage_super_admin"
on public.user_capabilities
for all
to authenticated
using (public.current_profile_is_super_admin())
with check (public.current_profile_is_super_admin());

create policy "teams_select_public"
on public.teams
for select
to public
using (true);

create policy "teams_manage_super_admin"
on public.teams
for all
to authenticated
using (public.current_profile_is_super_admin())
with check (public.current_profile_is_super_admin());

create policy "drivers_select_public"
on public.drivers
for select
to public
using (true);

create policy "drivers_manage_super_admin"
on public.drivers
for all
to authenticated
using (public.current_profile_is_super_admin())
with check (public.current_profile_is_super_admin());

create policy "calendar_select_public"
on public.calendar_settings
for select
to public
using (true);

create policy "calendar_update_calendar_write"
on public.calendar_settings
for update
to authenticated
using (public.current_user_has_capability('calendar.write'))
with check (public.current_user_has_capability('calendar.write'));

create policy "calendar_insert_super_admin"
on public.calendar_settings
for insert
to authenticated
with check (public.current_profile_is_super_admin());

create index if not exists idx_user_capabilities_user_id
on public.user_capabilities (user_id);

create index if not exists idx_drivers_team_id
on public.drivers (team_id);
