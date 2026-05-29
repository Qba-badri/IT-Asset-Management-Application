-- Add New Asset Fields for Purchase/Rental Tracking
-- Run this script to add the new fields to the assets table

-- 1. Add "Acquisition Type" column (purchased or rented)
ALTER TABLE assets 
ADD COLUMN IF NOT EXISTS acquisition_type VARCHAR(20) DEFAULT 'purchased' NOT NULL;

-- 2. Add "Received from Vendor Date" column
ALTER TABLE assets 
ADD COLUMN IF NOT EXISTS received_from_vendor_date DATE;

-- 3. Add "Vendor Monthly Rent" column
ALTER TABLE assets 
ADD COLUMN IF NOT EXISTS vendor_monthly_rent DECIMAL(10, 2);

-- Verify the columns were added
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'assets'
AND column_name IN ('acquisition_type', 'received_from_vendor_date', 'vendor_monthly_rent')
ORDER BY column_name;

-- Expected output:
-- column_name                  | data_type         | is_nullable | column_default
-- -----------------------------+-------------------+-------------+------------------
-- acquisition_type             | character varying | NO          | 'purchased'::character varying
-- received_from_vendor_date    | date              | YES         | NULL
-- vendor_monthly_rent          | numeric           | YES         | NULL
