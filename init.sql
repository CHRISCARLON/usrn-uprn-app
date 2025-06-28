-- Create the submissions table
CREATE TABLE IF NOT EXISTS submissions (
    id SERIAL PRIMARY KEY,
    dataset_name VARCHAR(255) NOT NULL,
    dataset_url TEXT NOT NULL,
    dataset_owner VARCHAR(50) NOT NULL,
    owner_name VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    missing_type VARCHAR(10) NOT NULL,
    job_title VARCHAR(255),
    sector VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create an index on created_at for faster queries
CREATE INDEX idx_submissions_created_at ON submissions(created_at);
