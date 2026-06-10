-- Add new job status columns and extend status enum
-- Run this after 001_jobs.sql

-- Add new columns
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS applied_at TIMESTAMPTZ;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS apply_channel TEXT;

-- Update status constraint to allow new values
ALTER TABLE jobs DROP CONSTRAINT IF EXISTS jobs_status_check;
ALTER TABLE jobs ADD CONSTRAINT jobs_status_check 
  CHECK (status IN ('pending', 'approved', 'rejected', 'prepared', 'failed', 'applied', 'interview', 'offer', 'declined', 'withdrawn'));

-- Index for applied jobs
CREATE INDEX IF NOT EXISTS idx_jobs_applied_at ON jobs(applied_at DESC) WHERE applied_at IS NOT NULL;
