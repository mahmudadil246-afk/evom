

## Fix: Realtime Publication Error

### সমস্যা
`support_tickets` এবং `support_ticket_messages` tables database-এ নেই, কিন্তু SQL export-এ hardcoded realtime list-এ আছে। নতুন project-এ SQL run করলে error আসে।

### সমাধান
Hardcoded list বাদ দিয়ে **dynamically detect** করবো কোন tables আসলে `supabase_realtime` publication-এ আছে। এতে ভবিষ্যতে নতুন table add/remove করলেও সমস্যা হবে না।

### Technical Change

**File:** `supabase/functions/database-schema-export/index.ts`

1. নতুন RPC বা direct query দরকার নেই — existing `columns` data থেকে table names জানা আছে
2. Realtime section-এ hardcoded array বাদ দিয়ে, শুধু সেই tables include করবো যেগুলো **আসলে database-এ exist করে**:

```typescript
// Before (hardcoded — breaks if tables don't exist):
const realtimeTables = ["live_chat_conversations", "support_ticket_messages", ...];

// After (only include tables that actually exist):
const allTableNames = columns ? [...new Set(columns.map(c => c.table_name))] : [];
const candidateRealtimeTables = [
  "live_chat_conversations",
  "live_chat_messages", 
  "notifications",
  "admin_presence",
  "support_tickets",
  "support_ticket_messages",
];
const realtimeTables = candidateRealtimeTables.filter(t => allTableNames.includes(t));
```

3. এতে শুধু যেসব table আসলে আছে সেগুলোই `ALTER PUBLICATION` statement-এ যাবে

### Files Changed
- `supabase/functions/database-schema-export/index.ts` — realtime section fix (lines 396-410)

