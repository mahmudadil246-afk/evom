CREATE OR REPLACE FUNCTION public.get_featured_products_lite(p_limit integer DEFAULT 8)
RETURNS TABLE(id uuid, name text, slug text, price numeric, compare_at_price numeric, category text, created_at timestamp with time zone, first_image text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT p.id, p.name, p.slug, p.price, p.compare_at_price, p.category, p.created_at,
    COALESCE(
      (SELECT elem FROM unnest(p.images) AS elem WHERE elem NOT LIKE 'data:%' LIMIT 1),
      (SELECT elem FROM unnest(p.images) AS elem LIMIT 1)
    ) AS first_image
  FROM public.products p
  WHERE p.is_active = true AND p.deleted_at IS NULL AND p.is_featured = true
  LIMIT p_limit;

  IF NOT FOUND THEN
    RETURN QUERY
    SELECT p.id, p.name, p.slug, p.price, p.compare_at_price, p.category, p.created_at,
      COALESCE(
        (SELECT elem FROM unnest(p.images) AS elem WHERE elem NOT LIKE 'data:%' LIMIT 1),
        (SELECT elem FROM unnest(p.images) AS elem LIMIT 1)
      ) AS first_image
    FROM public.products p
    WHERE p.is_active = true AND p.deleted_at IS NULL
    ORDER BY p.created_at DESC
    LIMIT p_limit;
  END IF;
END;
$$;