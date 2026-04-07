
-- Drop and recreate get_enum_types with correct column names
DROP FUNCTION IF EXISTS public.get_enum_types();

CREATE FUNCTION public.get_enum_types()
RETURNS TABLE(typname text, enumlabel text)
LANGUAGE plpgsql
AS $function$
BEGIN
    RETURN QUERY
    SELECT
        t.typname::text,
        e.enumlabel::text
    FROM pg_type t
    JOIN pg_enum e ON t.oid = e.enumtypid
    JOIN pg_namespace n ON t.typnamespace = n.oid
    WHERE n.nspname = 'public'
    ORDER BY t.typname, e.enumsortorder;
END;
$function$;

-- Fix get_rls_policies: ambiguous column references
CREATE OR REPLACE FUNCTION public.get_rls_policies()
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
    WHERE p.schemaname = 'public'
    ORDER BY p.tablename, p.policyname;
END;
$function$;

-- Fix get_table_indexes: ambiguous column references
CREATE OR REPLACE FUNCTION public.get_table_indexes()
RETURNS TABLE(tablename text, indexname text, indexdef text)
LANGUAGE plpgsql
AS $function$
BEGIN
    RETURN QUERY
    SELECT
        i.tablename::text,
        i.indexname::text,
        i.indexdef::text
    FROM pg_indexes i
    WHERE i.schemaname = 'public'
    ORDER BY i.tablename, i.indexname;
END;
$function$;

-- Fix get_db_triggers: ambiguous column references
CREATE OR REPLACE FUNCTION public.get_db_triggers()
RETURNS TABLE(trigger_name text, event_manipulation text, event_object_table text, action_statement text, action_timing text)
LANGUAGE plpgsql
AS $function$
BEGIN
    RETURN QUERY
    SELECT
        t.trigger_name::text,
        t.event_manipulation::text,
        t.event_object_table::text,
        t.action_statement::text,
        t.action_timing::text
    FROM information_schema.triggers t
    WHERE t.trigger_schema = 'public'
    ORDER BY t.event_object_table, t.trigger_name;
END;
$function$;
