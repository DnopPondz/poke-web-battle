create table if not exists pokemon_cache (
  id integer primary key,
  name text not null,
  types jsonb,
  stats jsonb,
  image_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Add RLS policies if needed, but for now assuming public read or service role write
alter table pokemon_cache enable row level security;

create policy "Allow public read access"
  on pokemon_cache for select
  using (true);

-- Assuming backend/service role will insert
create policy "Allow authenticated insert"
  on pokemon_cache for insert
  with check (auth.role() = 'authenticated' OR auth.role() = 'anon');
