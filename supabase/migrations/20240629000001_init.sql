-- Create vehicles table
CREATE TABLE public.vehicles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    brand VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    offer_price DECIMAL(10, 2),
    battery VARCHAR(100),
    range VARCHAR(100),
    charging_time VARCHAR(100),
    top_speed VARCHAR(100),
    motor_power VARCHAR(100),
    description TEXT,
    specifications JSONB,
    colors TEXT[],
    featured BOOLEAN DEFAULT FALSE,
    availability VARCHAR(50) DEFAULT 'available',
    stock INTEGER DEFAULT 0,
    images TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security on vehicles
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;

-- Create policy for vehicles: Allow public to view all vehicles
CREATE POLICY "Public vehicles are viewable by everyone" ON public.vehicles
    FOR SELECT USING (true);

-- Create policy for vehicles: Allow authenticated users (admins) to insert, update, delete
CREATE POLICY "Admins can manage vehicles" ON public.vehicles
    FOR ALL USING (auth.role() = 'authenticated' AND EXISTS (SELECT 1 FROM public.admins WHERE id = auth.uid()));

-- Create enquiries table
CREATE TABLE public.enquiries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_name VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    email VARCHAR(255),
    vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE SET NULL,
    vehicle_name VARCHAR(255), -- denormalized for ease of display, can be derived from vehicle_id
    message TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'new', -- e.g., new, contacted, quoted, sold, lost
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security on enquiries
ALTER TABLE public.enquiries ENABLE ROW LEVEL SECURITY;

-- Create policy for enquiries: Allow public to insert enquiries
CREATE POLICY "Public can submit enquiries" ON public.enquiries
    FOR INSERT WITH CHECK (true);

-- Create policy for enquiries: Allow authenticated users (admins) to view and update enquiries
CREATE POLICY "Admins can view and manage enquiries" ON public.enquiries
    FOR ALL USING (auth.role() = 'authenticated' AND EXISTS (SELECT 1 FROM public.admins WHERE id = auth.uid()));

-- Create admins table (extends auth.users)
CREATE TABLE public.admins (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security on admins
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;

-- Create policy for admins: Allow users to read their own admin profile
CREATE POLICY "Users can view their own admin profile" ON public.admins
    FOR SELECT USING (auth.uid() = id);

-- Create policy for admins: Allow admins to insert their own profile (on sign up)
CREATE POLICY "Users can insert their own admin profile" ON public.admins
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Set up storage for vehicle images
-- Create a bucket for vehicle images if it doesn't exist
-- Note: In Supabase, you can create buckets via the dashboard or via SQL.
-- We'll create a bucket called 'vehicle-images'

-- Insert a bucket for vehicle images
INSERT INTO storage.buckets (id, name, public)
VALUES ('vehicle-images', 'vehicle-images', true)
ON CONFLICT (id) DO NOTHING;

-- Set up storage policies for the vehicle-images bucket
-- Allow public to view files
CREATE POLICY "Publicly accessible files" ON storage.objects
    FOR SELECT USING (bucket_id = 'vehicle-images');

-- Allow authenticated users (admins) to insert, update, delete files
CREATE POLICY "Admins can manage vehicle images" ON storage.objects
    FOR ALL USING (
        bucket_id = 'vehicle-images'
        AND auth.role() = 'authenticated'
        AND EXISTS (SELECT 1 FROM public.admins WHERE id = auth.uid())
    );

-- Enable realtime for vehicles and enquiries
-- Note: In Supabase, you need to enable replication for each table you want to listen to.
-- We'll do that via the SQL below.

-- Enable realtime for vehicles
alter publication supabase_realtime add table vehicles;

-- Enable realtime for enquiries
alter publication supabase_realtime add table enquiries;

-- Enable realtime for admins (optional, but useful for admin panel)
alter publication supabase_realtime add table admins;