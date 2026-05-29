-- Fix enum values in licenses table
-- Update 'subscription' to 'user' and 'perpetual' to 'device'

-- First, alter the column to text temporarily
ALTER TABLE licenses ALTER COLUMN type TYPE text;

-- Update the values
UPDATE licenses SET type = 'user' WHERE type = 'subscription';
UPDATE licenses SET type = 'device' WHERE type = 'perpetual';

-- Drop the old enum type
DROP TYPE IF EXISTS licenses_type_enum CASCADE;

-- Recreate the enum with correct values
CREATE TYPE licenses_type_enum AS ENUM ('user', 'device', 'site', 'usage', 'concurrent');

-- Convert the column back to enum
ALTER TABLE licenses ALTER COLUMN type TYPE licenses_type_enum USING type::licenses_type_enum;
