import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export async function POST(req: NextRequest) {
  const { url, mode, field } = await req.json()

  // researchmap IDだけ欲しい場合はAI不要 → URLからそのまま返す
  if (field === 'researchmap_id') {
    return NextResponse.json({ text: url })
  }
  // Twitter/Instagram URLもそのまま返す
  if (['twitter_url','instagram_url','x_username'].includes(field)) {
    const username = field === 'x_username'
      ? url.replace(/.*twitter\.com\/|.*x\.com\//, '').split('/')[0].replace('@','')
      : url
    return NextResponse.json({ text: username })
  }

  const html = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } })
    .then(r => r.text()).catch(() => '')
  const text = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').slice(0, 8000)

  const prompt = mode === 'faculty'
    ? `以下は研究者のページです。教員の情報を200字以内で要約してください。\n\n${text}`
    : `以下は研究室のWebページです。研究概要として200〜400字で要約してください。日本語で。\n\n${text}`

  const res = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 600,
  })

  return NextResponse.json({ text: res.choices[0].message.content ?? '' })
}