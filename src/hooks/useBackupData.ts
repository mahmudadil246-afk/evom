import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { logAuditAction } from "@/lib/auditLog";

export interface BackupRecord {
  id: string;
  backup_type: "manual" | "scheduled";
  file_format: "json" | "csv";
  file_path: string;
  file_size: number | null;
  tables_included: string[];
  status: "pending" | "in_progress" | "completed" | "failed";
  error_message: string | null;
  created_by: string | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
}

export interface RestoreResult {
  success: boolean;
  total_restored: number;
  tables_restored: number;
  results: Record<string, { success: boolean; count: number; error?: string }>;
  failed_tables?: string[];
  missing_tables?: string[];
  error?: string;
}

export interface SchemaExportResult {
  success: boolean;
  schema: string;
  file_size: number;
  stats: {
    tables: number;
    columns: number;
    constraints: number;
    indexes: number;
    policies: number;
    functions: number;
    triggers: number;
    enums: number;
  };
}

export function useBackupData() {
  const [backups, setBackups] = useState<BackupRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [exportingSchema, setExportingSchema] = useState(false);
  const [exportingFull, setExportingFull] = useState(false);

  const fetchBackups = async () => {
    try {
      const { data, error } = await supabase
        .from("database_backups")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      setBackups((data || []) as BackupRecord[]);
    } catch (error: unknown) {
      console.error("Error fetching backups:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBackups();
  }, []);

  const createBackup = async (format: "json" | "csv") => {
    setCreating(true);
    try {
      // Use fetch with extended timeout (3 minutes) since backup can take a while
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 180000); // 3 min timeout

      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error("No active session. Please sign in again.");
      }
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/database-backup`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${session.access_token}`,
            "apikey": import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({ format, backup_type: "manual" }),
          signal: controller.signal,
        }
      );
      clearTimeout(timeoutId);

      const data = await response.json();

      if (!response.ok) throw new Error(data?.error || "Backup failed");

      if (data?.success) {
        logAuditAction({ action: "create", resource_type: "backup", description: `Database backup created (${format})`, new_value: { format, file_size: data.file_size } });
        toast.success(`Backup created successfully! (${formatFileSize(data.file_size)})`);
        await fetchBackups();
        return data;
      } else {
        throw new Error(data?.error || "Unknown error");
      }
    } catch (error: unknown) {
      if (error instanceof DOMException && error.name === "AbortError") {
        // Backup is likely still running server-side, poll for completion
        toast.info("Backup is taking longer than expected. It will continue in the background.");
        // Poll every 5s for up to 2 minutes
        let attempts = 0;
        const poll = setInterval(async () => {
          attempts++;
          await fetchBackups();
          const latest = backups[0];
          if (latest?.status === "completed" || latest?.status === "failed" || attempts >= 24) {
            clearInterval(poll);
            setCreating(false);
            if (latest?.status === "completed") {
              toast.success("Backup completed!");
            }
          }
        }, 5000);
        return;
      }
      const errorMessage = error instanceof Error ? error.message : "Failed to create backup";
      console.error("Backup error:", error);
      toast.error(errorMessage);
      throw error;
    } finally {
      setCreating(false);
    }
  };

  const restoreBackup = async (
    file: File,
    mode: "merge" | "replace" = "merge"
  ): Promise<RestoreResult> => {
    setRestoring(true);
    try {
      const content = await file.text();
      const format = file.name.endsWith(".csv") ? "csv" : "json";

      const { data, error } = await supabase.functions.invoke("database-restore", {
        body: {
          backup_data: content,
          format,
          mode,
        },
      });

      // supabase.functions.invoke returns error for non-2xx, extract message
      if (error) {
        // Try to parse the error context for a better message
        const errorMsg = (error as any)?.context?.body 
          ? await (error as any).context.text().catch(() => error.message)
          : error.message;
        let parsed = errorMsg;
        try { parsed = JSON.parse(errorMsg)?.error || errorMsg; } catch {}
        throw new Error(parsed);
      }

      if (data?.missing_tables?.length > 0 && data?.total_restored === 0) {
        toast.error(`Restore failed: ${data.missing_tables.length} tables missing. Run schema SQL first.`);
        return data as RestoreResult;
      } else if (data?.success) {
        toast.success(`Restore complete! ${data.total_restored} records restored.`);
        return data as RestoreResult;
      } else if (data?.failed_tables?.length > 0) {
        toast.warning(`Partial restore: ${data.total_restored} records. Some tables had issues.`);
        return data as RestoreResult;
      } else {
        throw new Error(data?.error || "Restore failed");
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Failed to restore backup";
      console.error("Restore error:", error);
      toast.error(errorMessage);
      throw error;
    } finally {
      setRestoring(false);
    }
  };

  const exportSchema = async (): Promise<SchemaExportResult> => {
    setExportingSchema(true);
    try {
      const { data, error } = await supabase.functions.invoke("database-schema-export");

      if (error) throw error;

      if (data?.success) {
        // Download the schema file
        const blob = new Blob([data.schema], { type: "text/sql" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
        a.download = `schema_${timestamp}.sql`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        toast.success(
          `Schema export complete! ${data.stats.tables} tables, ${data.stats.policies} policies.`
        );
        return data as SchemaExportResult;
      } else {
        throw new Error(data?.error || "Schema export failed");
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Failed to export schema";
      console.error("Schema export error:", error);
      toast.error(errorMessage);
      throw error;
    } finally {
      setExportingSchema(false);
    }
  };

  const exportFull = async (): Promise<void> => {
    setExportingFull(true);
    try {
      // First get schema
      const { data: schemaData, error: schemaError } = await supabase.functions.invoke(
        "database-schema-export"
      );
      if (schemaError) throw schemaError;
      if (!schemaData?.success) throw new Error(schemaData?.error || "Schema export failed");

      // Then get data backup with extended timeout
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error("No active session. Please sign in again.");
      }
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 180000);

      const backupResponse = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/database-backup`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${session.access_token}`,
            "apikey": import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({ format: "json", backup_type: "manual" }),
          signal: controller.signal,
        }
      );
      clearTimeout(timeoutId);

      const backupData = await backupResponse.json();
      if (!backupResponse.ok || !backupData?.success) throw new Error(backupData?.error || "Backup failed");

      // Download the backup file
      const { data: fileData, error: downloadError } = await supabase.storage
        .from("database-backups")
        .download(backupData.file_name);

      if (downloadError) throw downloadError;

      const dataContent = await fileData.text();

      // Create README
      const readme = `# Database Migration Package
Generated: ${new Date().toISOString()}

## Files Included
- schema.sql - Database structure (tables, constraints, indexes, RLS policies)
- data.json - All table data

## How to Restore in a New Project

### Step 1: Create New Lovable Project
Create a new project at lovable.dev

### Step 2: Run Schema SQL
Go to Cloud View > Run SQL and execute the contents of schema.sql

### Step 3: Upload Data
Go to Settings > Backup > Upload/Restore
Select data.json and choose "Merge" mode

### Step 4: Copy Edge Functions
Edge function code needs to be copied manually from the source project

## Limitations
- Auth users are NOT included (security reasons)
- Storage files (images, documents) are NOT included
- Environment variables/Secrets need to be reconfigured

## Stats
- Tables: ${schemaData.stats.tables}
- RLS Policies: ${schemaData.stats.policies}
- Indexes: ${schemaData.stats.indexes}
- Functions: ${schemaData.stats.functions}
`;

      // Create a ZIP-like structure using multiple downloads
      // Since we can't create actual ZIP in browser easily, download files separately
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");

      // Download schema
      const schemaBlob = new Blob([schemaData.schema], { type: "text/sql" });
      const schemaUrl = URL.createObjectURL(schemaBlob);
      const schemaLink = document.createElement("a");
      schemaLink.href = schemaUrl;
      schemaLink.download = `full_export_${timestamp}_schema.sql`;
      document.body.appendChild(schemaLink);
      schemaLink.click();
      document.body.removeChild(schemaLink);
      URL.revokeObjectURL(schemaUrl);

      // Download data
      const dataBlob = new Blob([dataContent], { type: "application/json" });
      const dataUrl = URL.createObjectURL(dataBlob);
      const dataLink = document.createElement("a");
      dataLink.href = dataUrl;
      dataLink.download = `full_export_${timestamp}_data.json`;
      document.body.appendChild(dataLink);
      dataLink.click();
      document.body.removeChild(dataLink);
      URL.revokeObjectURL(dataUrl);

      // Download README
      const readmeBlob = new Blob([readme], { type: "text/plain" });
      const readmeUrl = URL.createObjectURL(readmeBlob);
      const readmeLink = document.createElement("a");
      readmeLink.href = readmeUrl;
      readmeLink.download = `full_export_${timestamp}_README.txt`;
      document.body.appendChild(readmeLink);
      readmeLink.click();
      document.body.removeChild(readmeLink);
      URL.revokeObjectURL(readmeUrl);

      await fetchBackups();
      toast.success("Full export complete! 3 files downloaded.");
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Failed to export";
      console.error("Full export error:", error);
      toast.error(errorMessage);
      throw error;
    } finally {
      setExportingFull(false);
    }
  };

  const downloadBackup = async (backup: BackupRecord) => {
    try {
      const { data, error } = await supabase.storage
        .from("database-backups")
        .download(backup.file_path);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement("a");
      a.href = url;
      a.download = backup.file_path;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success("Backup downloaded!");
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Failed to download backup";
      console.error("Download error:", error);
      toast.error(errorMessage);
    }
  };

  const deleteBackup = async (backup: BackupRecord) => {
    try {
      await supabase.storage.from("database-backups").remove([backup.file_path]);

      const { error } = await supabase
        .from("database_backups")
        .delete()
        .eq("id", backup.id);

      if (error) throw error;

      setBackups((prev) => prev.filter((b) => b.id !== backup.id));
      toast.success("Backup deleted");
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Failed to delete backup";
      console.error("Delete error:", error);
      toast.error(errorMessage);
    }
  };

  return {
    backups,
    loading,
    creating,
    restoring,
    exportingSchema,
    exportingFull,
    createBackup,
    restoreBackup,
    exportSchema,
    exportFull,
    downloadBackup,
    deleteBackup,
    refetch: fetchBackups,
  };
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}
