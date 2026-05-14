'use server'

import { createClient } from '@/lib/supabase/server'
import { headers } from 'next/headers'

export interface LogAuditParams {
  action: string
  module: string
  tableName?: string
  recordId?: string
  oldData?: unknown
  newData?: unknown
}

export async function logAudit(params: LogAuditParams): Promise<void> {
  const h = headers()
  const ipAddress =
    h.get('x-forwarded-for')?.split(',')?.[0]?.trim() ||
    h.get('x-real-ip') ||
    undefined

  const userAgent = h.get('user-agent') || undefined

  const sessionClient = createClient(false)
  const {
    data: { user },
  } = await sessionClient.auth.getUser()

  const serviceClient = createClient(true)

  // Best-effort user_name; audit can still be inserted even if profile fetch fails.
  let userName: string | undefined
  if (user) {
    const { data: profile } = await serviceClient
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .maybeSingle()
    userName = profile?.full_name
  }

  await serviceClient.from('audit_logs').insert({
    user_id: user?.id,
    user_name: userName,
    action: params.action,
    module: params.module,
    table_name: params.tableName,
    record_id: params.recordId,
    old_data: params.oldData as unknown as Record<string, unknown>,
    new_data: params.newData as unknown as Record<string, unknown>,
    ip_address: ipAddress,
    user_agent: userAgent,
  })
}

