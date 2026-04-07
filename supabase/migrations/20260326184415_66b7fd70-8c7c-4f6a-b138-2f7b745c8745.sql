
CREATE OR REPLACE FUNCTION public.get_featured_products_lite(p_limit integer DEFAULT 8)
RETURNS TABLE(
  id uuid,
  name text,
  slug text,
  price numeric,
  compare_at_price numeric,
  category text,
  created_at timestamptz,
  first_image text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Try featured products first
  RETURN QUERY
  SELECT p.id, p.name, p.slug, p.price, p.compare_at_price, p.category, p.created_at,
    (SELECT elem::text
     FROM jsonb_array_elements_text(
       CASE WHEN p.images IS NOT NULL AND jsonb_array_length(p.images) > 0 
            THEN p.images ELSE '[]'::jsonb END
     ) AS elem
     WHERE elem NOT LIKE 'data:%'
     LIMIT 1
    ) AS first_image
  FROM public.products p
  WHERE p.is_active = true
    AND p.deleted_at IS NULL
    AND p.is_featured = true
  LIMIT p_limit;

  -- If no featured products found, fall back to newest
  IF NOT FOUND THEN
    RETURN QUERY
    SELECT p.id, p.name, p.slug, p.price, p.compare_at_price, p.category, p.created_at,
      (SELECT elem::text
       FROM jsonb_array_elements_text(
         CASE WHEN p.images IS NOT NULL AND jsonb_array_length(p.images) > 0 
              THEN p.images ELSE '[]'::jsonb END
       ) AS elem
       WHERE elem NOT LIKE 'data:%'
       LIMIT 1
      ) AS first_image
    FROM public.products p
    WHERE p.is_active = true
      AND p.deleted_at IS NULL
    ORDER BY p.created_at DESC
    LIMIT p_limit;
  END IF;
END;
$$;
