import { supabase } from '@/lib/supabase'
import Link from 'next/link'

export default async function LabDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const { data: lab } = await supabase
    .from('labs')
    .select('*, lab_tags(tag)')
    .eq('id', id)
    .single()

  if (!lab) return (
    <main className="p-6">
      <p>研究室が見つかりません</p>
      <Link href="/" className="text-blue-600 underline">← マップに戻る</Link>
    </main>
  )

  return (
    <main className="max-w-2xl mx-auto p-6">
      <Link href="/" className="text-blue-600 underline text-sm">← マップに戻る</Link>

      <h1 className="text-2xl font-bold mt-4">{lab.name}</h1>
      <p className="text-gray-500 text-sm mt-1">{lab.faculty_name}</p>

      {lab.lab_url && (
        <a href={lab.lab_url} target="_blank" className="text-blue-600 underline text-sm mt-1 block">
          研究室HP →
        </a>
      )}

      <section className="mt-6">
        <h2 className="font-semibold text-lg">研究概要</h2>
        <p className="text-sm mt-2 whitespace-pre-wrap text-gray-700">
          {lab.summary_text ?? '（未取得）'}
        </p>
      </section>

      <section className="mt-6">
        <h2 className="font-semibold text-lg">タグ</h2>
        <div className="flex flex-wrap gap-2 mt-2">
          {lab.lab_tags?.length > 0
            ? lab.lab_tags.map((t: { tag: string }, i: number) => (
                <span key={i} className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-xs">
                  {t.tag}
                </span>
              ))
            : <p className="text-sm text-gray-400">（未取得）</p>
          }
        </div>
      </section>

      <p className="text-xs text-gray-400 mt-8">
        取得元: {lab.summary_source_url ?? '未設定'} ／ 最終取得: {lab.fetched_at?.slice(0, 10) ?? '未取得'}
      </p>
    </main>
  )
}