import { Resend } from 'resend'
import { NextRequest, NextResponse } from 'next/server'

const resend = new Resend(process.env.RESEND_API_KEY)

const TYPE_LABELS: Record<string, string> = {
  correction: '📝 情報修正依頼',
  feature:    '💡 新機能要望',
  bug:        '🐛 不具合報告',
  other:      '💬 その他',
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { type, lab_name, correction_field, body: content, email } = body

    const typeLabel = TYPE_LABELS[type] ?? type ?? '不明'

    const html = `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;">
        <h2 style="color:#1F2937;margin-bottom:4px;">新しいお問い合わせが届きました</h2>
        <p style="color:#6B7280;font-size:13px;margin-top:0;">東北大学 研究室マップ</p>
        <hr style="border:none;border-top:1px solid #E5E7EB;margin:16px 0;" />

        <table style="width:100%;border-collapse:collapse;font-size:14px;">
          <tr>
            <td style="padding:8px 12px;background:#F9FAFB;font-weight:600;color:#6B7280;width:120px;border-radius:4px;">種別</td>
            <td style="padding:8px 12px;color:#1F2937;">${typeLabel}</td>
          </tr>
          ${lab_name ? `
          <tr>
            <td style="padding:8px 12px;background:#F9FAFB;font-weight:600;color:#6B7280;border-radius:4px;">研究室</td>
            <td style="padding:8px 12px;color:#1F2937;">${lab_name}</td>
          </tr>` : ''}
          ${correction_field ? `
          <tr>
            <td style="padding:8px 12px;background:#F9FAFB;font-weight:600;color:#6B7280;border-radius:4px;">修正項目</td>
            <td style="padding:8px 12px;color:#1F2937;">${correction_field}</td>
          </tr>` : ''}
          ${email ? `
          <tr>
            <td style="padding:8px 12px;background:#F9FAFB;font-weight:600;color:#6B7280;border-radius:4px;">返信先</td>
            <td style="padding:8px 12px;color:#1F2937;"><a href="mailto:${email}">${email}</a></td>
          </tr>` : ''}
        </table>

        <div style="margin-top:16px;padding:14px 16px;background:#F3F4F6;border-radius:8px;">
          <p style="font-size:12px;font-weight:600;color:#6B7280;margin:0 0 6px;">内容</p>
          <p style="font-size:14px;color:#1F2937;margin:0;white-space:pre-wrap;line-height:1.7;">${content}</p>
        </div>

        <hr style="border:none;border-top:1px solid #E5E7EB;margin:20px 0;" />
        <p style="font-size:12px;color:#9CA3AF;margin:0;">
          <a href="${process.env.NEXT_PUBLIC_APP_URL ?? 'https://lab-map.vercel.app'}/admin" style="color:#3B82F6;">管理画面で確認する →</a>
        </p>
      </div>
    `

    await resend.emails.send({
      from: 'lab-map <onboarding@resend.dev>',
      to: process.env.NOTIFY_EMAIL!,
      subject: `【lab-map】${typeLabel}${lab_name ? ` - ${lab_name}` : ''}`,
      html,
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Resend error:', error)
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
