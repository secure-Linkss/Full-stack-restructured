-- Migration: Create Geography Data Table
-- Description: Creates table for geography/atlas map data

-- Create geography data table
CREATE TABLE IF NOT EXISTS geography_data (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    country VARCHAR(100),
    country_code VARCHAR(10),
    city VARCHAR(100),
    region VARCHAR(100),
    latitude DECIMAL(10, 7),
    longitude DECIMAL(10, 7),
    clicks INTEGER DEFAULT 0,
    visitors INTEGER DEFAULT 0,
    last_visit TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES "user"(id) ON DELETE CASCADE
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_geography_user ON geography_data(user_id);
CREATE INDEX IF NOT EXISTS idx_geography_country ON geography_data(country_code);
CREATE INDEX IF NOT EXISTS idx_geography_city ON geography_data(city);

-- Populate from existing tracking events
INSERT INTO geography_data (user_id, country, country_code, city, latitude, longitude, clicks, visitors, last_visit)
SELECT 
    l.user_id,
    te.country,
    te.country_code,
    te.city,
    CAST(te.latitude AS DECIMAL(10,7)),
    CAST(te.longitude AS DECIMAL(10,7)),
    COUNT(*) as clicks,
    COUNT(DISTINCT te.ip_address) as visitors,
    MAX(te.timestamp) as last_visit
FROM tracking_event te
JOIN link l ON l.id = te.link_id
WHERE te.country IS NOT NULL
GROUP BY l.user_id, te.country, te.country_code, te.city, te.latitude, te.longitude
ON CONFLICT DO NOTHING;
