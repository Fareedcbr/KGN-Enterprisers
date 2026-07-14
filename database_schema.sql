-- ===========================================
-- KGN Enterprises Database Schema
-- ===========================================
-- This schema includes:
--   - vehicles table
--   - enquiries table
--   - admins table
--   - Row Level Security (RLS) policies
--   - Supabase Storage bucket for vehicle images
--   - Realtime replication enabled for relevant tables
-- ===========================================

-- -------------------------
-- 1. Enable uuid-ossp extension (if not already enabled)
-- -------------------------
create extension if not exists "uuid-ossp";

-- -------------------------
-- 2. Tables
-- -------------------------

-- Vehicles table
create table public.vehicles (
    id uuid primary key default uuid_generate_v4(),
    name varchar(255) not null,
    brand varchar(255) not null,
    category varchar(100) not null,
    price decimal(10, 2) not null,
    offer_price decimal(10, 2),
    battery varchar(100),
    range varchar(100),
    charging_time varchar(100),
    top_speed varchar(100),
    motor_power varchar(100),
    description text,
    specifications jsonb,
    colors text[],
    featured boolean default false,
    availability varchar(50) default 'available',
    stock integer default 0,
    images text[] default '{}',
    hidden boolean default false,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- Enquiries table
create table public.enquiries (
    id uuid primary key default uuid_generate_v4(),
    customer_name varchar(255) not null,
    phone varchar(50),
    email varchar(255),
    vehicle_id uuid references public.vehicles(id) on delete set null,
    vehicle_name varchar(255),
    message text not null,
    status varchar(50) default 'new', -- e.g., new, contacted, quoted, sold, lost
    created_at timestamptz default now()
);

-- Admins table (extends auth.users)
create table public.admins (
    id uuid primary key references auth.users(id) on delete cascade,
    full_name varchar(255),
    created_at timestamptz default now()
);

-- -------------------------
-- 3. Row Level Security (RLS)
-- -------------------------

-- Enable RLS on vehicles
alter table public.vehicles enable row level security;

-- Policy: Public can view vehicles (only non-hidden ones)
create policy "Public vehicles are viewable by everyone" on public.vehicles
    for select
    using (not hidden);

-- Policy: Admins can manage vehicles
create policy "Admins can manage vehicles" on public.vehicles
    for all
    using (
        auth.role() = 'authenticated'
        and exists (
            select 1 from public.admins where id = auth.uid()
        )
    );

-- Enable RLS on enquiries
alter table public.enquiries enable row level security;

-- Policy: Public can submit enquiries
create policy "Public can submit enquiries" on public.enquiries
    for insert
    with check (true);

-- Policy: Admins can view and manage enquiries
create policy "Admins can view and manage enquiries" on public.enquiries
    for all
    using (
        auth.role() = 'authenticated'
        and exists (
            select 1 from public.admins where id = auth.uid()
        )
    );

-- Enable RLS on admins
alter table public.admins enable row level security;

-- Policy: Users can view their own admin profile
create policy "Users can view their own admin profile" on public.admins
    for select
    using (auth.uid() = id);

-- Policy: Users can insert their own admin profile (on sign up)
create policy "Users can insert their own admin profile" on public.admins
    for insert
    with check (auth.uid() = id);

-- -------------------------
-- 4. Storage
-- -------------------------

-- Insert bucket for vehicle images (if not exists)
insert into storage.buckets (id, name, public)
values ('vehicle-images', 'vehicle-images', true)
on conflict (id) do nothing;

-- Policy: Publicly accessible files
create policy "Publicly accessible files" on storage.objects
    for select
    using (bucket_id = 'vehicle-images');

-- Policy: Admins can manage vehicle images
create policy "Admins can manage vehicle images" on storage.objects
    for all
    using (
        bucket_id = 'vehicle-images'
        and auth.role() = 'authenticated'
        and exists (select 1 from public.admins where id = auth.uid())
    );

-- -------------------------
-- 5. Realtime
-- -------------------------

-- Enable realtime for vehicles
alter publication supabase_realtime add table vehicles;

-- Enable realtime for enquiries
alter publication supabase_realtime add table enquiries;

-- Enable realtime for admins (optional)
alter publication supabase_realtime add table admins;