
CREATE OR REPLACE FUNCTION public.get_storage_buckets()
RETURNS TABLE(id text, name text, public boolean, file_size_limit bigint, allowed_mime_types text[])
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT b.id::text, b.name::text, b.public, b.file_size_limit, b.allowed_mime_types
  FROM storage.buckets b
  ORDER BY b.name;
END;
$$;
