-- Migration: Add Campaign Stats Fields
-- Description: Adds statistics tracking fields to campaign table

-- Add stats columns to campaigns
ALTER TABLE campaign ADD COLUMN IF NOT EXISTS clicks INTEGER DEFAULT 0;
ALTER TABLE campaign ADD COLUMN IF NOT EXISTS visitors INTEGER DEFAULT 0;
ALTER TABLE campaign ADD COLUMN IF NOT EXISTS conversions INTEGER DEFAULT 0;
ALTER TABLE campaign ADD COLUMN IF NOT EXISTS conversion_rate DECIMAL(5,2) DEFAULT 0.0;

-- Update existing campaign stats from tracking events
WITH campaign_stats AS (
    SELECT 
        c.id as campaign_id,
        COUNT(DISTINCT te.id) as total_clicks,
        COUNT(DISTINCT te.ip_address) as unique_visitors
    FROM campaign c
    LEFT JOIN link l ON l.campaign = c.name
    LEFT JOIN tracking_event te ON te.link_id = l.id
    GROUP BY c.id
)
UPDATE campaign c
SET 
    clicks = COALESCE(cs.total_clicks, 0),
    visitors = COALESCE(cs.unique_visitors, 0),
    conversion_rate = CASE 
        WHEN COALESCE(cs.total_clicks, 0) > 0 
        THEN (COALESCE(c.conversions, 0)::DECIMAL / cs.total_clicks * 100)
        ELSE 0 
    END
FROM campaign_stats cs
WHERE c.id = cs.campaign_id;
