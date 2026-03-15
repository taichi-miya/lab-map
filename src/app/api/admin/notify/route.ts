import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST(req: NextRequest) {
  const token = (await cookies()).get('admin_token')?.value
  if (token !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ ok: false }, { status: 401 })
  }

  const { targetType, labName, fieldLabel, newValue, oldValue, contributor } = await req.json()
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL
  if (!webhookUrl) return NextResponse.json({ ok: false, error: 'no webhook' })

  const preview = (val: string | null) => {
    if (!val) return '（なし）'
    return val.length > 200 ? val.slice(0, 200) + '…' : val
  }

  const jst = new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' })

  const fields = [
    { name: '研究室 / 教員', value: labName      || '不明',   inline: true },
    { name: '更新者',        value: contributor  || '未設定', inline: true },
    { name: '更新項目',      value: `${targetType === 'faculty' ? '👤' : '🏫'} ${fieldLabel}`, inline: false },
    { name: '📝 新しい内容', value: `\`\`\`\n${preview(newValue)}\n\`\`\``, inline: false },
  ]

  // old_value がある場合だけ追加
  if (oldValue) {
    fields.push({
      name: '🗑 上書き前の内容', value: `\`\`\`\n${preview(oldValue)}\n\`\`\``, inline: false,
    })
  }

  const embed = {
    color: 0x3B82F6,
    fields,
    footer: { text: jst },
  }

  await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ embeds: [embed] }),
  })

  return NextResponse.json({ ok: true })
}