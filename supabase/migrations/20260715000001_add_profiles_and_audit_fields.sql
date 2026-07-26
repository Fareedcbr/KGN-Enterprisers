-- Create profiles table for storing extended user information
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name VARCHAR(255),
    avatar_url TEXT,
    website TEXT,
    bio TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create policy for profiles: Allow users to view their own profile
CREATE POLICY "Users can view their own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

-- Create policy for profiles: Allow users to update their own profile
CREATE POLICY "Users can update their own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- Create policy for profiles: Allow users to insert their own profile
CREATE POLICY "Users can insert their own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Add audit fields to vehicles table
ALTER TABLE public.vehicles
    ADD COLUMN created_by UUID REFERENCES public.admins(id),
    ADD COLUMN updated_by UUID REFERENCES public.admins(id);

-- Create indexes for frequently queried fields
CREATE INDEX idx_vehicles_category ON public.vehicles(category);
CREATE INDEX idx_vehicles_brand ON public.vehicles(brand);
CREATE INDEX idx_vehicles_featured ON public.vehicles(featured);

-- Update foreign key constraints for existing tables if needed (none)

-- Note: The application code should be updated to set created_by and updated_by
-- when creating or updating vehicles. The updated_at column is already present
-- and should be set by the application on update.