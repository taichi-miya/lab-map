import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  const { name, password } = await req.json()
  if (!name || !password) {
    return NextResponse.json({ ok: false }, { status: 401 })
  }

  // DB の md5() で照合
  const { data, error } = await sb.rpc('check_contributor_password', {
    p_name: name,
    p_password: password,
  })

  if (error || !data || data.length === 0) {
    return NextResponse.json({ ok: false }, { status: 401 })
  }

  const user = data[0] as { name: string; role: string }

  const res = NextResponse.json({ ok: true, role: user.role, name: user.name })
  // cookie に role と name を保存（7日間）
  const cookieOpts = { httpOnly: true, sameSite: 'strict' as const, maxAge: 60 * 60 * 24 * 7, path: '/' }
  res.cookies.set('admin_token', process.env.ADMIN_PASSWORD!, cookieOpts)
  res.cookies.set('user_name',   user.name,                    cookieOpts)
  res.cookies.set('user_role',   user.role,                    cookieOpts)
  return res
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true })
  res.cookies.delete('admin_token')
  res.cookies.delete('user_name')
  res.cookies.delete('user_role')
  return res
}