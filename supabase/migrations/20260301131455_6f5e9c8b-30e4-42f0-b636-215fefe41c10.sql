
DROP FUNCTION IF EXISTS public.get_db_functions();

CREATE OR REPLACE FUNCTION public.get_db_functions()
RETURNS TABLE(routine_name text, full_definition text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    p.proname::text AS routine_name,
    pg_get_functiondef(p.oid)::text AS full_definition
  FROM pg_proc p
  JOIN pg_namespace n ON p.pronamespace = n.oid
  WHERE n.nspname = 'public'
    AND p.prokind = 'f'
  ORDER BY p.proname;
END;
$function$;
