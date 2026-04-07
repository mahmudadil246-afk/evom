
-- Add unique constraint on section_type for homepage_sections
ALTER TABLE public.homepage_sections ADD CONSTRAINT homepage_sections_section_type_unique UNIQUE (section_type);
