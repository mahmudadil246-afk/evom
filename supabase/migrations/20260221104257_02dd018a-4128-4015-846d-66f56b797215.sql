
-- Create a function to get storage RLS policies
CREATE OR REPLACE FUNCTION public.get_storage_policies()
RETURNS TABLE(schemaname text, tablename text, policyname text, permissive text, roles text[], cmd text, qual text, with_check text)
LANGUAGE plpgsql
AS $function$
BEGIN
    RETURN QUERY
    SELECT
        p.schemaname::text,
        p.tablename::text,
        p.policyname::text,
        p.permissive::text,
        p.roles::text[],
        p.cmd::text,
        p.qual::text,
        p.with_check::text
    FROM pg_policies p
    WHERE p.schemaname = 'storage'
    ORDER BY p.tablename, p.policyname;
END;
$function$;
