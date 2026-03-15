import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  const {
    lab_id, target_type, target_id, field,
    new_value, contributor, guest_name, guest_email,
  } = await req.json()

  if (!lab_id || !field || !new_value) {
    return NextResponse.json({ ok: false, error: 'missing fields' }, { status: 400 })
  }

  const by = contributor || guest_name || 'ゲスト'

  await sb.from('admin_logs').insert({
    target_type: target_type ?? 'lab',
    target_id:   target_id ?? lab_id,
    lab_id,
    field,
    new_value,
    contributor: by,
    guest_name:  guest_name ?? null,
    guest_email: guest_email ?? null,
    status: 'pending',
  })

  // Discord通知
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL
  if (webhookUrl) {
    const jst = new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' })
    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        embeds: [{
          color: 0x10B981,
          fields: [
            { name: '投稿者',   value: by,        inline: true },
            { name: '種別',     value: target_type === 'faculty' ? '👤 教員' : '🏫 研究室', inline: true },
            { name: '更新項目', value: field,      inline: false },
            { name: '📝 内容',  value: `\`\`\`\n${new_value.slice(0, 300)}\n\`\`\``, inline: false },
          ],
          footer: { text: `📬 承認待ち | ${jst}` },
        }],
      }),
    })
  }

  return NextResponse.json({ ok: true })
}