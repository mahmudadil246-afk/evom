import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

interface BackupRequest {
  format: 'json' | 'csv'
  backup_type: 'manual' | 'scheduled'
  tables?: string[]
}

function arrayToCSV(data: Record<string, unknown>[]): string {
  if (!data || data.length === 0) return ''
  const headers = Object.keys(data[0])
  const csvRows = [headers.join(',')]
  for (const row of data) {
    const values = headers.map(header => {
      const val = row[header]
      if (val === null || val === undefined) return ''
      if (typeof val === 'object') return `"${JSON.stringify(val).replace(/"/g, '""')}"`
      if (typeof val === 'string' && (val.includes(',') || val.includes('"') || val.includes('\n'))) {
        return `"${val.replace(/"/g, '""')}"`
      }
      return String(val)
    })
    csvRows.push(values.join(','))
  }
  return csvRows.join('\n')
}

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function fetchAllRows(supabaseAdmin: ReturnType<typeof createClient>, table: string): Promise<{ data: unknown[]; error?: string }> {
  const allRows: unknown[] = []
  let offset = 0
  const pageSize = 1000
  const maxRetries = 3

  try {
    while (true) {
      let lastError: string | null = null
      let pageData: unknown[] | null = null

      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          const { data, error } = await supabaseAdmin
            .from(table)
            .select('*')
            .range(offset, offset + pageSize - 1)
          
          if (error) {
            lastError = error.message
            if (attempt < maxRetries) {
              await delay(1000 * attempt)
              continue
            }
          } else {
            pageData = data
            lastError = null
            break
          }
        } catch (fetchErr: unknown) {
          const msg = fetchErr instanceof Error ? fetchErr.message : 'Unknown fetch error'
          lastError = msg
          if (attempt < maxRetries) {
            await delay(1000 * attempt)
            continue
          }
        }
      }

      if (lastError) {
        return { data: allRows, error: `${table}: ${lastError}` }
      }

      if (pageData && pageData.length > 0) {
        allRows.push(...pageData)
        offset += pageSize
        if (pageData.length < pageSize) break
      } else {
        break
      }
    }
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown error'
    return { data: allRows, error: `${table}: ${msg}` }
  }

  return { data: allRows }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')
    
    if (!supabaseUrl || !supabaseServiceKey || !supabaseAnonKey) {
      const missing = [
        !supabaseUrl && 'SUPABASE_URL',
        !supabaseServiceKey && 'SUPABASE_SERVICE_ROLE_KEY', 
        !supabaseAnonKey && 'SUPABASE_ANON_KEY'
      ].filter(Boolean).join(', ')
      return new Response(
        JSON.stringify({ error: `Missing required secrets: ${missing}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)
    
    // --- Auth: token-based validation (no getUser) ---
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized: No valid authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    const authClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    })

    const { data: claimsData, error: claimsError } = await authClient.auth.getUser(token)
    if (claimsError || !claimsData?.user?.id) {
      console.error('Auth validation failed:', claimsError?.message)
      return new Response(
        JSON.stringify({ error: 'Unauthorized: Invalid or expired token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const userId = claimsData.user.id

    // Check admin role using service-role client
    const { data: isAdmin } = await supabaseAdmin.rpc('has_admin_role', { user_uuid: userId })

    if (!isAdmin) {
      return new Response(
        JSON.stringify({ error: 'Admin access required. Your user does not have admin or manager role.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Parse request
    const { format, backup_type, tables }: BackupRequest = await req.json()

    // Dynamically discover ALL public tables if none specified
    let tablesToBackup: string[]
    if (tables && tables.length > 0) {
      tablesToBackup = tables
    } else {
      const { data: tableList, error: tableListError } = await supabaseAdmin
        .rpc('get_table_columns')
      
      if (tableListError) {
        console.error('Failed to fetch table list:', tableListError)
        throw new Error('Failed to discover tables')
      }
      
      const uniqueTables = new Set<string>()
      for (const row of (tableList || [])) {
        uniqueTables.add((row as { table_name: string }).table_name)
      }
      tablesToBackup = Array.from(uniqueTables).sort()
    }

    console.log(`Starting ${backup_type} backup in ${format} format for ${tablesToBackup.length} tables`)

    // Create backup record
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const fileName = `backup_${backup_type}_${timestamp}.${format === 'json' ? 'json' : 'zip'}`
    
    const { data: backupRecord, error: recordError } = await supabaseAdmin
      .from('database_backups')
      .insert({
        backup_type,
        file_format: format,
        file_path: fileName,
        tables_included: tablesToBackup,
        status: 'in_progress',
        created_by: userId,
        started_at: new Date().toISOString()
      })
      .select()
      .single()

    if (recordError) {
      console.error('Failed to create backup record:', recordError)
      throw new Error('Failed to create backup record')
    }

    // Fetch all table data in parallel batches
    const backupData: Record<string, unknown[]> = {}
    const errors: string[] = []
    let totalRecords = 0
    const batchSize = 5

    for (let i = 0; i < tablesToBackup.length; i += batchSize) {
      const batch = tablesToBackup.slice(i, i + batchSize)
      const results = await Promise.all(
        batch.map(table => fetchAllRows(supabaseAdmin, table))
      )
      
      for (let j = 0; j < batch.length; j++) {
        const table = batch[j]
        const result = results[j]
        if (result.error) {
          errors.push(result.error)
          backupData[table] = []
        } else {
          backupData[table] = result.data
          totalRecords += result.data.length
        }
        console.log(`Fetched ${result.data.length} rows from ${table}`)
      }
    }

    // Generate backup content
    let content: string
    let contentType: string
    
    if (format === 'json') {
      content = JSON.stringify({
        backup_info: {
          created_at: new Date().toISOString(),
          type: backup_type,
          tables: tablesToBackup,
          total_tables: tablesToBackup.length,
          total_records: totalRecords
        },
        data: backupData,
        errors: errors.length > 0 ? errors : undefined
      }, null, 2)
      contentType = 'application/json'
    } else {
      const csvParts: string[] = []
      for (const [table, data] of Object.entries(backupData)) {
        if (data.length > 0) {
          csvParts.push(`\n### TABLE: ${table} ###\n`)
          csvParts.push(arrayToCSV(data as Record<string, unknown>[]))
        }
      }
      content = csvParts.join('\n')
      contentType = 'text/csv'
    }

    const fileSize = new Blob([content]).size

    // Upload to storage
    const { error: uploadError } = await supabaseAdmin
      .storage
      .from('database-backups')
      .upload(fileName, content, {
        contentType,
        upsert: true
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      
      await supabaseAdmin
        .from('database_backups')
        .update({
          status: 'failed',
          error_message: uploadError.message,
          completed_at: new Date().toISOString()
        })
        .eq('id', backupRecord.id)

      throw new Error(`Failed to upload backup: ${uploadError.message}`)
    }

    await supabaseAdmin
      .from('database_backups')
      .update({
        status: 'completed',
        file_size: fileSize,
        completed_at: new Date().toISOString(),
        error_message: errors.length > 0 ? `Partial errors: ${errors.join('; ')}` : null
      })
      .eq('id', backupRecord.id)

    console.log(`Backup completed: ${fileName} (${fileSize} bytes, ${totalRecords} records)`)

    return new Response(
      JSON.stringify({
        success: true,
        backup_id: backupRecord.id,
        file_name: fileName,
        file_size: fileSize,
        tables_backed_up: tablesToBackup.length,
        total_records: totalRecords,
        errors: errors.length > 0 ? errors : undefined
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('Backup error:', error)
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
