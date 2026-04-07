import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Helper RPCs used only for export — exclude from output
const HELPER_RPC_NAMES = [
  "get_table_columns",
  "get_table_constraints",
  "get_table_indexes",
  "get_rls_policies",
  "get_db_functions",
  "get_db_triggers",
  "get_enum_types",
  "get_storage_policies",
  "get_storage_buckets",
];

// Functions that do NOT reference any table — safe to create before tables
const PRE_TABLE_FUNCTIONS = [
  "has_admin_role",
  "get_2fa_status",
];

// Map PostgreSQL internal array type names to proper SQL syntax
const ARRAY_TYPE_MAP: Record<string, string> = {
  _text: "text[]",
  _uuid: "uuid[]",
  _int4: "integer[]",
  _int8: "bigint[]",
  _bool: "boolean[]",
  _float4: "real[]",
  _float8: "double precision[]",
  _numeric: "numeric[]",
  _varchar: "varchar[]",
  _timestamptz: "timestamptz[]",
  _timestamp: "timestamp[]",
  _jsonb: "jsonb[]",
  _json: "json[]",
};

function mapColumnType(udtName: string, charMaxLen: number | null): string {
  if (ARRAY_TYPE_MAP[udtName]) return ARRAY_TYPE_MAP[udtName];
  let t = udtName;
  if (charMaxLen) t += `(${charMaxLen})`;
  return t;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Verify user is admin
    const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await userClient.auth.getUser(
      authHeader.replace("Bearer ", "")
    );
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey);
    const { data: roles } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);

    const isAdmin = roles?.some((r: any) =>
      ["admin", "manager"].includes(r.role)
    );
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Admin access required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch all schema info in parallel
    const [
      { data: columns },
      { data: constraints },
      { data: indexes },
      { data: policies },
      { data: functions },
      { data: triggers },
      { data: enums },
      { data: storagePolicies },
      { data: storageBuckets },
    ] = await Promise.all([
      adminClient.rpc("get_table_columns"),
      adminClient.rpc("get_table_constraints"),
      adminClient.rpc("get_table_indexes"),
      adminClient.rpc("get_rls_policies"),
      adminClient.rpc("get_db_functions"),
      adminClient.rpc("get_db_triggers"),
      adminClient.rpc("get_enum_types"),
      adminClient.rpc("get_storage_policies"),
      adminClient.rpc("get_storage_buckets"),
    ]);

    // Filter out helper RPCs from functions list
    const appFunctions = (functions || []).filter(
      (f: any) => !HELPER_RPC_NAMES.includes(f.routine_name)
    );

    // Split into pre-table and post-table functions
    const preTableFns = appFunctions.filter((f: any) =>
      PRE_TABLE_FUNCTIONS.includes(f.routine_name)
    );
    const postTableFns = appFunctions.filter(
      (f: any) => !PRE_TABLE_FUNCTIONS.includes(f.routine_name)
    );

    // Build SQL output
    let sql = "-- ============================================\n";
    sql += "-- Complete Database Schema Export\n";
    sql += `-- Generated at: ${new Date().toISOString()}\n`;
    sql += "-- ============================================\n\n";

    // 1. EXTENSIONS
    sql += "-- ============================================\n";
    sql += "-- Extensions\n";
    sql += "-- ============================================\n";
    sql += 'CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;\n';
    sql += 'CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA extensions;\n\n';

    // 2. ENUM TYPES
    if (enums?.length) {
      sql += "-- ============================================\n";
      sql += "-- Enum Types\n";
      sql += "-- ============================================\n";
      const enumMap: Record<string, string[]> = {};
      for (const e of enums) {
        if (!enumMap[e.typname]) enumMap[e.typname] = [];
        enumMap[e.typname].push(e.enumlabel);
      }
      for (const [name, labels] of Object.entries(enumMap)) {
        sql += `DO $$ BEGIN\n`;
        sql += `  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = '${name}') THEN\n`;
        sql += `    CREATE TYPE public.${name} AS ENUM (${labels.map((l) => `'${l}'`).join(", ")});\n`;
        sql += `  END IF;\n`;
        sql += `END $$;\n\n`;
      }
    }

    // 3. PRE-TABLE FUNCTIONS (no table dependencies)
    if (preTableFns.length) {
      sql += "-- ============================================\n";
      sql += "-- Pre-table Helper Functions\n";
      sql += "-- ============================================\n";
      // has_admin_role first
      const sorted = [...preTableFns].sort((a: any, b: any) => {
        if (a.routine_name === "has_admin_role") return -1;
        if (b.routine_name === "has_admin_role") return 1;
        return a.routine_name.localeCompare(b.routine_name);
      });
      for (const f of sorted) {
        sql += `-- Function: ${f.routine_name}\n`;
        sql += `${f.full_definition};\n\n`;
      }
    }

    // 4. TABLES with PRIMARY KEY
    const pkMap: Record<string, string[]> = {};
    if (constraints?.length) {
      for (const c of constraints) {
        if (c.constraint_type === "PRIMARY KEY") {
          if (!pkMap[c.table_name]) pkMap[c.table_name] = [];
          if (!pkMap[c.table_name].includes(c.column_name)) {
            pkMap[c.table_name].push(c.column_name);
          }
        }
      }
    }

    if (columns?.length) {
      sql += "-- ============================================\n";
      sql += "-- Tables\n";
      sql += "-- ============================================\n";

      const tableMap: Record<string, any[]> = {};
      for (const col of columns) {
        if (!tableMap[col.table_name]) tableMap[col.table_name] = [];
        tableMap[col.table_name].push(col);
      }

      for (const [tableName, cols] of Object.entries(tableMap)) {
        sql += `\n-- Table: ${tableName}\n`;
        sql += `CREATE TABLE IF NOT EXISTS public.${tableName} (\n`;
        const colDefs = cols.map((c: any) => {
          const typeName = mapColumnType(c.udt_name, c.character_maximum_length);
          let def = `  ${c.column_name} ${typeName}`;
          if (c.is_nullable === "NO") def += " NOT NULL";
          if (c.column_default) def += ` DEFAULT ${c.column_default}`;
          return def;
        });

        const pkCols = pkMap[tableName];
        if (pkCols?.length) {
          colDefs.push(`  PRIMARY KEY (${pkCols.join(", ")})`);
        }

        sql += colDefs.join(",\n");
        sql += "\n);\n";
      }
      sql += "\n";
    }

    // 5. UNIQUE CONSTRAINTS
    if (constraints?.length) {
      const uniqueConstraints = constraints.filter(
        (c: any) => c.constraint_type === "UNIQUE"
      );
      if (uniqueConstraints.length) {
        sql += "-- ============================================\n";
        sql += "-- Unique Constraints\n";
        sql += "-- ============================================\n";
        const ucMap: Record<string, { table: string; columns: string[] }> = {};
        for (const c of uniqueConstraints) {
          if (!ucMap[c.constraint_name]) {
            ucMap[c.constraint_name] = { table: c.table_name, columns: [] };
          }
          if (!ucMap[c.constraint_name].columns.includes(c.column_name)) {
            ucMap[c.constraint_name].columns.push(c.column_name);
          }
        }
        for (const [name, info] of Object.entries(ucMap)) {
          sql += `DO $$ BEGIN\n`;
          sql += `  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '${name}') THEN\n`;
          sql += `    ALTER TABLE public.${info.table} ADD CONSTRAINT ${name} UNIQUE (${info.columns.join(", ")});\n`;
          sql += `  END IF;\n`;
          sql += `END $$;\n\n`;
        }
      }
    }

    // 6. FOREIGN KEY CONSTRAINTS
    if (constraints?.length) {
      const fkConstraints = constraints.filter(
        (c: any) => c.constraint_type === "FOREIGN KEY"
      );
      if (fkConstraints.length) {
        sql += "-- ============================================\n";
        sql += "-- Foreign Key Constraints\n";
        sql += "-- ============================================\n";
        const fkMap: Record<string, { table: string; columns: string[]; refTable: string; refColumns: string[] }> = {};
        for (const c of fkConstraints) {
          if (!fkMap[c.constraint_name]) {
            fkMap[c.constraint_name] = {
              table: c.table_name,
              columns: [],
              refTable: c.foreign_table_name,
              refColumns: [],
            };
          }
          if (!fkMap[c.constraint_name].columns.includes(c.column_name)) {
            fkMap[c.constraint_name].columns.push(c.column_name);
          }
          if (!fkMap[c.constraint_name].refColumns.includes(c.foreign_column_name)) {
            fkMap[c.constraint_name].refColumns.push(c.foreign_column_name);
          }
        }
        for (const [name, info] of Object.entries(fkMap)) {
          sql += `DO $$ BEGIN\n`;
          sql += `  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '${name}') THEN\n`;
          sql += `    ALTER TABLE public.${info.table} ADD CONSTRAINT ${name} FOREIGN KEY (${info.columns.join(", ")}) REFERENCES public.${info.refTable}(${info.refColumns.join(", ")});\n`;
          sql += `  END IF;\n`;
          sql += `END $$;\n\n`;
        }
      }
    }

    // 7. POST-TABLE FUNCTIONS (reference tables)
    if (postTableFns.length) {
      sql += "-- ============================================\n";
      sql += "-- Post-table Functions (depend on tables)\n";
      sql += "-- ============================================\n";
      const sorted = [...postTableFns].sort((a: any, b: any) =>
        a.routine_name.localeCompare(b.routine_name)
      );
      for (const f of sorted) {
        sql += `-- Function: ${f.routine_name}\n`;
        sql += `${f.full_definition};\n\n`;
      }
    }

    // 8. INDEXES
    if (indexes?.length) {
      sql += "-- ============================================\n";
      sql += "-- Indexes\n";
      sql += "-- ============================================\n";
      for (const idx of indexes) {
        if (idx.indexname?.endsWith("_pkey")) continue;
        let indexDef = idx.indexdef;
        if (indexDef && !indexDef.includes("IF NOT EXISTS")) {
          indexDef = indexDef.replace("CREATE INDEX ", "CREATE INDEX IF NOT EXISTS ");
          indexDef = indexDef.replace("CREATE UNIQUE INDEX ", "CREATE UNIQUE INDEX IF NOT EXISTS ");
        }
        sql += `${indexDef};\n`;
      }
      sql += "\n";
    }

    // 9. ENABLE RLS
    if (columns?.length) {
      sql += "-- ============================================\n";
      sql += "-- Enable Row Level Security\n";
      sql += "-- ============================================\n";
      const tableNames = [...new Set(columns.map((c: any) => c.table_name))];
      for (const t of tableNames) {
        sql += `ALTER TABLE public.${t} ENABLE ROW LEVEL SECURITY;\n`;
      }
      sql += "\n";
    }

    // 10. RLS POLICIES
    if (policies?.length) {
      sql += "-- ============================================\n";
      sql += "-- RLS Policies\n";
      sql += "-- ============================================\n";
      for (const p of policies) {
        sql += `DROP POLICY IF EXISTS "${p.policyname}" ON public.${p.tablename};\n`;
        sql += `CREATE POLICY "${p.policyname}" ON public.${p.tablename}`;
        if (p.permissive === "PERMISSIVE") sql += ` AS PERMISSIVE`;
        else if (p.permissive === "RESTRICTIVE") sql += ` AS RESTRICTIVE`;
        sql += ` FOR ${p.cmd}`;
        sql += ` TO ${p.roles?.join(", ") || "public"}`;
        if (p.qual) sql += ` USING (${p.qual})`;
        if (p.with_check) sql += ` WITH CHECK (${p.with_check})`;
        sql += ";\n\n";
      }
    }

    // 11. STORAGE BUCKETS
    if (storageBuckets?.length) {
      sql += "-- ============================================\n";
      sql += "-- Storage Buckets\n";
      sql += "-- ============================================\n";
      for (const b of storageBuckets) {
        sql += `INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)\n`;
        sql += `  VALUES ('${b.id}', '${b.name}', ${b.public}, ${b.file_size_limit || "NULL"}, ${b.allowed_mime_types ? `ARRAY[${b.allowed_mime_types.map((m: string) => `'${m}'`).join(",")}]` : "NULL"})\n`;
        sql += `  ON CONFLICT (id) DO NOTHING;\n\n`;
      }
    }

    // 12. STORAGE POLICIES
    if (storagePolicies?.length) {
      sql += "-- ============================================\n";
      sql += "-- Storage Policies\n";
      sql += "-- ============================================\n";
      for (const p of storagePolicies) {
        sql += `DROP POLICY IF EXISTS "${p.policyname}" ON storage.${p.tablename};\n`;
        sql += `CREATE POLICY "${p.policyname}" ON storage.${p.tablename}`;
        if (p.permissive === "PERMISSIVE") sql += ` AS PERMISSIVE`;
        else if (p.permissive === "RESTRICTIVE") sql += ` AS RESTRICTIVE`;
        sql += ` FOR ${p.cmd}`;
        sql += ` TO ${p.roles?.join(", ") || "public"}`;
        if (p.qual) sql += ` USING (${p.qual})`;
        if (p.with_check) sql += ` WITH CHECK (${p.with_check})`;
        sql += ";\n\n";
      }
    }

    // 13. TRIGGERS
    if (triggers?.length) {
      sql += "-- ============================================\n";
      sql += "-- Triggers\n";
      sql += "-- ============================================\n";
      for (const t of triggers) {
        sql += `DROP TRIGGER IF EXISTS ${t.trigger_name} ON public.${t.event_object_table};\n`;
        sql += `CREATE TRIGGER ${t.trigger_name} ${t.action_timing} ${t.event_manipulation} ON public.${t.event_object_table} ${t.action_statement};\n\n`;
      }
    }

    // Build stats
    const tableNames = columns ? [...new Set(columns.map((c: any) => c.table_name))] : [];

    // 14. REALTIME PUBLICATION
    const candidateRealtimeTables = [
      "live_chat_conversations",
      "live_chat_messages",
      "notifications",
      "admin_presence",
      "support_tickets",
      "support_ticket_messages",
    ];
    const realtimeTables = candidateRealtimeTables.filter(t => tableNames.includes(t));
    if (realtimeTables.length) {
      sql += "-- ============================================\n";
      sql += "-- Realtime Publication\n";
      sql += "-- ============================================\n";
      for (const t of realtimeTables) {
        sql += `ALTER PUBLICATION supabase_realtime ADD TABLE public.${t};\n`;
      }
      sql += "\n";
    }
    const stats = {
      tables: tableNames.length,
      columns: columns?.length || 0,
      constraints: constraints?.length || 0,
      indexes: indexes?.length || 0,
      policies: policies?.length || 0,
      functions: appFunctions.length,
      triggers: triggers?.length || 0,
      enums: enums?.length || 0,
      storage_buckets: storageBuckets?.length || 0,
      storage_policies: storagePolicies?.length || 0,
    };

    return new Response(JSON.stringify({ schema: sql, stats, success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message, success: false }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
