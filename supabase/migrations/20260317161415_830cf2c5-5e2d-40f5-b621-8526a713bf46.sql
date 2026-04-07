
-- Add deleted_at column to 5 tables for soft delete support
ALTER TABLE public.support_tickets ADD COLUMN IF NOT EXISTS deleted_at timestamptz DEFAULT NULL;
ALTER TABLE public.contact_messages ADD COLUMN IF NOT EXISTS deleted_at timestamptz DEFAULT NULL;
ALTER TABLE public.product_reviews ADD COLUMN IF NOT EXISTS deleted_at timestamptz DEFAULT NULL;
ALTER TABLE public.homepage_carousel_slides ADD COLUMN IF NOT EXISTS deleted_at timestamptz DEFAULT NULL;
ALTER TABLE public.auto_discount_rules ADD COLUMN IF NOT EXISTS deleted_at timestamptz DEFAULT NULL;
