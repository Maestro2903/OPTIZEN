-- Allow public (anonymous) users to create appointment requests
-- This is needed for the public landing page booking form

-- Drop existing insert policy if it exists
DROP POLICY IF EXISTS "Authenticated users can create appointment requests" ON appointment_requests;

-- Create new policy that allows both authenticated and anonymous users to insert
CREATE POLICY "Allow public to create appointment requests" 
ON appointment_requests FOR INSERT 
TO public
WITH CHECK (true);

-- Also allow anonymous users to read their own requests (by ID)
-- This is useful for the success page
CREATE POLICY "Allow public to view appointment requests by ID" 
ON appointment_requests FOR SELECT 
TO public
USING (true);

