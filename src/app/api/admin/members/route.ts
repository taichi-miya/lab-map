import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@supabase/supabase-js'

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const SUPERADMIN_ID = 'user_3AgMgxAzuTbup4F7c6PGEBiied8'

// superadmin チェック
async function isSuperAdmin(req: NextRequest) {
  const cookieStore = await cookies()
  const clerkUid    = cookieStore.get('clerk_uid')?.value
  return clerkUid === SUPERADMIN_ID
}

// メンバー一覧取得
export async function GET(req: NextRequest) {
  if (!await isSuperAdmin(req)) return NextResponse.json({ ok: false }, { status: 403 })
  const { data } = await sb
    .from('contributors')
    .select('id, name, role, clerk_user_id, created_at')
    .order('created_at')
  return NextResponse.json({ ok: true, members: data ?? [] })
}

// role更新（admin昇格・降格）
export async function PATCH(req: NextRequest) {
  if (!await isSuperAdmin(req)) return NextResponse.json({ ok: false }, { status: 403 })
  const { id, role } = await req.json()
  if (!['admin', 'contributor'].includes(role)) {
    return NextResponse.json({ ok: false, error: 'invalid role' }, { status: 400 })
  }
  await sb.from('contributors').update({ role }).eq('id', id)
  return NextResponse.json({ ok: true })
}