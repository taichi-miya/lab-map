import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST(req: NextRequest) {
  // 認証チェック
  const token = (await cookies()).get('admin_token')?.value
  if (token !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ ok: false }, { status: 401 })
  }

  const { targetType, labName, fieldLabel, newValue, contributor } = await req.json()
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL
  if (!webhookUrl) return NextResponse.json({ ok: false, error: 'no webhook' })

  // 追加内容のプレビュー（長すぎる場合は切り詰め）
  const preview = newValue
    ? newValue.length > 300
      ? newValue.slice(0, 300) + '…'
      : newValue
    : '（URLまたは構造データ）'

  const jst = new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' })

  const embed = {
    color: 0x3B82F6,
    fields: [
      { name: '研究室',   value: labName      || '不明', inline: true },
      { name: '更新者',   value: contributor  || '未設定', inline: true },
      { name: '更新項目', value: `${targetType === 'faculty' ? '👤 教員：' : '🏫 研究室：'}${fieldLabel}`, inline: false },
      { name: '追加内容', value: `\`\`\`\n${preview}\n\`\`\``, inline: false },
    ],
    footer: { text: jst },
  }

  await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ embeds: [embed] }),
  })

  return NextResponse.json({ ok: true })
}