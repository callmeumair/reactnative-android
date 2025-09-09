-- CommuteTimely Supabase Database Schema
-- Run this in your Supabase SQL editor to create the required tables

-- Enable Row Level Security (RLS)
-- We'll use user_id for data isolation

-- Destinations table
CREATE TABLE IF NOT EXISTS destinations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    address TEXT NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    arrival_time TEXT NOT NULL, -- HH:MM format
    icon TEXT NOT NULL,
    color TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Commute calculations table
CREATE TABLE IF NOT EXISTS commute_calculations (
    id SERIAL PRIMARY KEY,
    destination_id UUID REFERENCES destinations(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL,
    date DATE NOT NULL, -- YYYY-MM-DD
    leave_time TEXT NOT NULL, -- HH:MM
    duration INTEGER NOT NULL, -- seconds
    weather_condition TEXT NOT NULL,
    weather_delay INTEGER NOT NULL, -- seconds
    calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(destination_id, date, user_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_destinations_user_id ON destinations(user_id);
CREATE INDEX IF NOT EXISTS idx_destinations_is_active ON destinations(is_active);
CREATE INDEX IF NOT EXISTS idx_destinations_created_at ON destinations(created_at);

CREATE INDEX IF NOT EXISTS idx_commute_calculations_user_id ON commute_calculations(user_id);
CREATE INDEX IF NOT EXISTS idx_commute_calculations_destination_id ON commute_calculations(destination_id);
CREATE INDEX IF NOT EXISTS idx_commute_calculations_date ON commute_calculations(date);

-- Row Level Security (RLS) policies
-- Enable RLS on both tables
ALTER TABLE destinations ENABLE ROW LEVEL SECURITY;
ALTER TABLE commute_calculations ENABLE ROW LEVEL SECURITY;

-- Destinations policies
-- Allow users to read their own destinations
CREATE POLICY "Users can read their own destinations" ON destinations
    FOR SELECT USING (user_id = current_setting('app.current_user_id', true));

-- Allow users to insert their own destinations
CREATE POLICY "Users can insert their own destinations" ON destinations
    FOR INSERT WITH CHECK (user_id = current_setting('app.current_user_id', true));

-- Allow users to update their own destinations
CREATE POLICY "Users can update their own destinations" ON destinations
    FOR UPDATE USING (user_id = current_setting('app.current_user_id', true));

-- Allow users to delete their own destinations
CREATE POLICY "Users can delete their own destinations" ON destinations
    FOR DELETE USING (user_id = current_setting('app.current_user_id', true));

-- Commute calculations policies
-- Allow users to read their own commute calculations
CREATE POLICY "Users can read their own commute calculations" ON commute_calculations
    FOR SELECT USING (user_id = current_setting('app.current_user_id', true));

-- Allow users to insert their own commute calculations
CREATE POLICY "Users can insert their own commute calculations" ON commute_calculations
    FOR INSERT WITH CHECK (user_id = current_setting('app.current_user_id', true));

-- Allow users to update their own commute calculations
CREATE POLICY "Users can update their own commute calculations" ON commute_calculations
    FOR UPDATE USING (user_id = current_setting('app.current_user_id', true));

-- Allow users to delete their own commute calculations
CREATE POLICY "Users can delete their own commute calculations" ON commute_calculations
    FOR DELETE USING (user_id = current_setting('app.current_user_id', true));

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at on destinations
CREATE TRIGGER update_destinations_updated_at
    BEFORE UPDATE ON destinations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Sample data for testing (optional)
-- INSERT INTO destinations (user_id, name, address, latitude, longitude, arrival_time, icon, color, is_active)
-- VALUES 
--     ('test_user_123', 'Work', '123 Business St, San Francisco, CA', 37.7849, -122.4094, '09:00', 'work', '["#667eea", "#764ba2"]', true),
--     ('test_user_123', 'Gym', '456 Fitness Ave, San Francisco, CA', 37.7749, -122.4194, '18:00', 'fitness-center', '["#f093fb", "#f5576c"]', true);

-- Verify the setup
SELECT 'Destinations table created successfully' as status;
SELECT 'Commute calculations table created successfully' as status;
SELECT 'Indexes created successfully' as status;
SELECT 'RLS policies created successfully' as status;
