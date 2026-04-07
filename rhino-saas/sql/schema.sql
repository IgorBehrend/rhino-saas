-- ============================================================
-- RHINO MACHINES SAAS - SUPABASE SCHEMA
-- Run this in your Supabase SQL editor
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================================
-- PROFILES (extends Supabase auth.users)
-- ============================================================
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text,
  role text default 'user' check (role in ('admin', 'user')),
  avatar_url text,
  company text,
  created_at timestamptz default now()
);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, role)
  values (new.id, new.raw_user_meta_data->>'full_name', 'user');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- MACHINES (main inventory table)
-- ============================================================
create table public.machines (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  code text not null,                          -- e.g. "4931-T"
  name text not null,                          -- full product description
  machine_type text,                           -- "ROUTER", "LASER", "COLADEIRA", etc.
  status text default 'available' check (
    status in ('available', 'production', 'sold', 'maintenance', 'scrapped')
  ),
  qty_system integer default 0,                -- qty in ERP/Prosyst system
  qty_physical integer default 0,              -- qty physically in stock
  contract text,                               -- contract/BL reference
  invoice_in text,                             -- NF entrada
  invoice_out text,                            -- NF saída
  notes text,
  image_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================
-- TECHNICAL SPECS (linked to machine model/code)
-- ============================================================
create table public.specs (
  id uuid default uuid_generate_v4() primary key,
  machine_id uuid references public.machines on delete cascade not null,
  -- Volume 1 dimensions (cm)
  vol1_length numeric,
  vol1_width numeric,
  vol1_height numeric,
  vol1_weight numeric,
  -- Volume 2 dimensions (cm) - some machines have 2 packages
  vol2_length numeric,
  vol2_width numeric,
  vol2_height numeric,
  vol2_weight numeric,
  -- Electrical
  power_kw numeric,
  current_a numeric,
  voltage text,                                -- "220V", "380V", etc.
  -- Operational
  air_consumption text,
  dust_collector_flow text,
  max_speed text,
  created_at timestamptz default now()
);

-- ============================================================
-- PRODUCTION TRACKING (assembly workflow)
-- ============================================================
create table public.production (
  id uuid default uuid_generate_v4() primary key,
  machine_id uuid references public.machines on delete cascade not null,
  user_id uuid references auth.users on delete cascade not null,
  contract text,                               -- CONTRATO / BL ref
  status text default 'pending' check (
    status in ('pending', 'mechanical', 'electrical', 'checklist', 'packaging', 'ready', 'shipped')
  ),
  responsible_mechanical text,
  responsible_electrical text,
  responsible_checklist text,
  responsible_packaging text,
  dt_mechanical timestamptz,
  dt_electrical timestamptz,
  dt_checklist timestamptz,
  dt_packaging timestamptz,
  planned_factory_date date,
  actual_factory_date date,
  planned_delivery_date date,
  actual_delivery_date date,
  delay_days integer generated always as (
    case
      when actual_delivery_date is not null and planned_delivery_date is not null
      then extract(day from actual_delivery_date - planned_delivery_date)::integer
      else null
    end
  ) stored,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================
-- NOTES HISTORY (audit trail per machine)
-- ============================================================
create table public.machine_notes (
  id uuid default uuid_generate_v4() primary key,
  machine_id uuid references public.machines on delete cascade not null,
  user_id uuid references auth.users on delete cascade not null,
  content text not null,
  created_at timestamptz default now()
);

-- ============================================================
-- UPDATED_AT TRIGGER
-- ============================================================
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger machines_updated_at
  before update on public.machines
  for each row execute function public.set_updated_at();

create trigger production_updated_at
  before update on public.production
  for each row execute function public.set_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY (multi-tenant isolation)
-- ============================================================
alter table public.profiles enable row level security;
alter table public.machines enable row level security;
alter table public.specs enable row level security;
alter table public.production enable row level security;
alter table public.machine_notes enable row level security;

-- Profiles: users see only their own
create policy "Users can view own profile" on public.profiles
  for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id);

-- Machines: users see only their own
create policy "Users can view own machines" on public.machines
  for select using (auth.uid() = user_id);
create policy "Users can insert own machines" on public.machines
  for insert with check (auth.uid() = user_id);
create policy "Users can update own machines" on public.machines
  for update using (auth.uid() = user_id);
create policy "Users can delete own machines" on public.machines
  for delete using (auth.uid() = user_id);

-- Specs: inherit access from machines
create policy "Users can manage specs via machines" on public.specs
  for all using (
    exists (
      select 1 from public.machines m
      where m.id = specs.machine_id and m.user_id = auth.uid()
    )
  );

-- Production: users see only their own
create policy "Users can view own production" on public.production
  for select using (auth.uid() = user_id);
create policy "Users can insert own production" on public.production
  for insert with check (auth.uid() = user_id);
create policy "Users can update own production" on public.production
  for update using (auth.uid() = user_id);
create policy "Users can delete own production" on public.production
  for delete using (auth.uid() = user_id);

-- Notes: inherit from machines
create policy "Users can manage notes via machines" on public.machine_notes
  for all using (auth.uid() = user_id);

-- ============================================================
-- STORAGE BUCKET for machine images
-- ============================================================
insert into storage.buckets (id, name, public) values ('machine-images', 'machine-images', true);

create policy "Users can upload machine images" on storage.objects
  for insert with check (bucket_id = 'machine-images' and auth.uid() is not null);
create policy "Anyone can view machine images" on storage.objects
  for select using (bucket_id = 'machine-images');
create policy "Users can delete own machine images" on storage.objects
  for delete using (bucket_id = 'machine-images' and auth.uid() is not null);
