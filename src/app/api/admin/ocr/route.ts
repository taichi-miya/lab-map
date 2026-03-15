import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export async function POST(req: NextRequest) {
  const { image, mimeType } = await req.json()

  const res = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [{
      role: 'user',
      content: [
        { type: 'image_url', image_url: { url: `data:${mimeType};base64,${image}` } },
        { type: 'text', text: '画像内のテキストをすべて抽出してください。研究室の情報が含まれる場合は研究概要として整理してください。' }
      ]
    }],
    max_tokens: 800,
  })

  return NextResponse.json({ text: res.choices[0].message.content ?? '' })
}