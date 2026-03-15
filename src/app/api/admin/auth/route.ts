import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Clerkログイン（clerk_user_idでrole照合・自動登録）
export async function POST(req: NextRequest) {
  const body = await req.json()
  const cookieOpts = {
    httpOnly: true, sameSite: 'strict' as const,
    maxAge: 60 * 60 * 24 * 7, path: '/',
  }

  // ── Clerkログイン
  if (body.clerk_user_id) {
    const { data, error } = await sb.rpc('get_or_create_clerk_user', {
      p_clerk_user_id: body.clerk_user_id,
      p_name:          body.name ?? 'unknown',
      p_email:         body.email ?? null,
    })
    if (error || !data || data.length === 0) {
      return NextResponse.json({ ok: false }, { status: 401 })
    }
    const user = data[0] as { id: string; name: string; role: string }
    const res  = NextResponse.json({ ok: true, role: user.role, name: user.name })
    res.cookies.set('admin_token', process.env.ADMIN_PASSWORD!, cookieOpts)
    res.cookies.set('user_name',   user.name,                    cookieOpts)
    res.cookies.set('user_role',   user.role,                    cookieOpts)
    res.cookies.set('clerk_uid',   body.clerk_user_id,           cookieOpts)
    return res
  }

  // ── パスワードログイン（Clerkアカウントを持たない外部協力者用）
  if (body.name && body.password) {
    const { data, error } = await sb.rpc('check_contributor_password', {
      p_name:     body.name,
      p_password: body.password,
    })
    if (error || !data || data.length === 0) {
      return NextResponse.json({ ok: false }, { status: 401 })
    }
    const user = data[0] as { name: string; role: string }
    const res  = NextResponse.json({ ok: true, role: user.role, name: user.name })
    res.cookies.set('admin_token', process.env.ADMIN_PASSWORD!, cookieOpts)
    res.cookies.set('user_name',   user.name,                    cookieOpts)
    res.cookies.set('user_role',   user.role,                    cookieOpts)
    return res
  }

  return NextResponse.json({ ok: false }, { status: 400 })
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true })
  res.cookies.delete('admin_token')
  res.cookies.delete('user_name')
  res.cookies.delete('user_role')
  res.cookies.delete('clerk_uid')
  return res
}