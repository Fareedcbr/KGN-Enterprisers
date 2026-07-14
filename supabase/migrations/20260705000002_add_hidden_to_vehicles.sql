-- Add hidden column to vehicles table
ALTER TABLE public.vehicles ADD COLUMN hidden BOOLEAN DEFAULT FALSE;

-- Update public policy to exclude hidden vehicles
DROP POLICY IF EXISTS "Public vehicles are viewable by everyone" ON public.vehicles;
CREATE POLICY "Public vehicles are viewable by everyone" ON public.vehicles
    FOR SELECT USING (NOT hidden);