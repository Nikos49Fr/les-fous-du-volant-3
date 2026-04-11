alter table public.drivers
add column if not exists bio text not null default '';
