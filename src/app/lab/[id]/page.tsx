import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import PinButton from '@/components/PinButton'

const CLUSTER_COLORS = ['#3B82F6', '#22C55E', '#F59E0B', '#EF4444']
const CLUSTER_NAMES  = ['プラズマ・核融合', '材料・照射', '計測・レーザー', '安全・システム']
const C_CHIP = ['rgba(59,130,246,0.12)', 'rgba(34,197,94,0.12)', 'rgba(245,158,11,0.12)', 'rgba(239,68,68,0.12)']
const C_STROKE = ['rgba(59,130,246,0.35)', 'rgba(34,197,94,0.35)', 'rgba(245,158,11,0.35)', 'rgba(239,68,68,0.35)']

export default async function LabDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const { data: lab } = await supabase
    .from('labs')
    .select('*, lab_tags(tag)')
    .eq('id', id)
    .single()

  if (!lab) return (
    <main style={{ padding: 24 }}>
      <p>研究室が見つかりません</p>
      <Link href="/" style={{ color: '#3B82F6' }}>← マップに戻る</Link>
    </main>
  )

  // 近い研究室 Top5
  const { data: edgesA } = await supabase
    .from('edges')
    .select('lab_b,similarity')
    .eq('lab_a', id)
    .order('similarity', { ascending: false })
    .limit(5)

  const { data: edgesB } = await supabase
    .from('edges')
    .select('lab_a,similarity')
    .eq('lab_b', id)
    .order('similarity', { ascending: false })
    .limit(5)

  const rawNeighbors = [
    ...(edgesA ?? []).map(e => ({ id: e.lab_b, similarity: e.similarity })),
    ...(edgesB ?? []).map(e => ({ id: e.lab_a, similarity: e.similarity })),
  ].sort((a, b) => b.similarity - a.similarity).slice(0, 5)

  const neighborIds = rawNeighbors.map(n => n.id)
  const { data: neighborLabs } = neighborIds.length > 0
    ? await supabase.from('labs').select('id,name,faculty_name,cluster_id,lab_tags(tag)').in('id', neighborIds)
    : { data: [] }

  const neighbors = rawNeighbors
    .map(n => ({ ...n, lab: neighborLabs?.find(l => l.id === n.id) }))
    .filter(n => n.lab)

  const ci = lab.cluster_id ?? null
  const clusterColor = ci !== null ? CLUSTER_COLORS[ci] : '#94A3B8'
  const clusterName  = ci !== null ? CLUSTER_NAMES[ci]  : '未分類'
  const chipBg       = ci !== null ? C_CHIP[ci]          : 'rgba(148,163,184,0.12)'
  const strokeColor  = ci !== null ? C_STROKE[ci]        : 'rgba(148,163,184,0.35)'

  return (
    <main style={{
      maxWidth: 680, margin: '0 auto', padding: '32px 20px 64px',
      fontFamily: "'Hiragino Kaku Gothic ProN','Hiragino Sans','Noto Sans JP',sans-serif",
      color: '#1F2937',
    }}>
      {/* 戻るリンク */}
      <Link href="/" style={{
        fontSize: 13, color: '#6B7280', textDecoration: 'none',
        display: 'inline-flex', alignItems: 'center', gap: 4,
        marginBottom: 20,
      }}>
        ← マップに戻る
      </Link>

      {/* カード */}
      <div style={{
        background: 'white', borderRadius: 18,
        border: `1.5px solid ${strokeColor}`,
        boxShadow: '0 4px 24px rgba(17,24,39,0.08)',
        padding: '24px 28px',
        marginBottom: 20,
      }}>
        {/* クラスタバッジ＋ピンボタン */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            fontSize: 11, fontWeight: 600, color: clusterColor,
            background: chipBg, padding: '3px 10px 3px 7px', borderRadius: 999,
          }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: clusterColor, flexShrink: 0 }} />
            {clusterName}
          </span>
          {/* ← Client Component */}
          <PinButton labId={id} />
        </div>

        <h1 style={{ fontSize: 24, fontWeight: 800, margin: '0 0 4px', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
          {lab.name}
        </h1>
        <p style={{ fontSize: 14, color: '#6B7280', margin: '0 0 12px' }}>{lab.faculty_name}</p>

        {lab.lab_url && (
          <a href={lab.lab_url} target="_blank" rel="noopener noreferrer" style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            fontSize: 13, color: '#3B82F6', textDecoration: 'none', marginBottom: 20,
          }}>
            研究室HP →
          </a>
        )}

        {/* タグ */}
        {lab.lab_tags?.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: '#9CA3AF', marginBottom: 8, letterSpacing: '0.05em' }}>
              TAGS
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {lab.lab_tags.map((t: { tag: string }, i: number) => (
                <span key={i} style={{
                  fontSize: 12, padding: '4px 10px', borderRadius: 999,
                  background: chipBg, color: clusterColor, fontWeight: 500,
                }}>{t.tag}</span>
              ))}
            </div>
          </div>
        )}

        {/* 研究概要 */}
        <div style={{
          borderTop: '1px solid #F3F4F6', paddingTop: 20,
        }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: '#9CA3AF', marginBottom: 10, letterSpacing: '0.05em' }}>
            研究概要
          </p>
          <p style={{ fontSize: 14, lineHeight: 1.85, color: '#374151', whiteSpace: 'pre-wrap', margin: 0 }}>
            {lab.summary_text ?? '（未取得）'}
          </p>
          {lab.summary_source_url && (
            <a href={lab.summary_source_url} target="_blank" rel="noopener noreferrer" style={{
              fontSize: 11, color: '#9CA3AF', textDecoration: 'underline', marginTop: 10, display: 'inline-block',
            }}>
              出典を見る →
            </a>
          )}
        </div>
      </div>

      {/* 近い研究室 Top5 */}
      {neighbors.length > 0 && (
        <div>
          <p style={{ fontSize: 13, fontWeight: 700, color: '#6B7280', marginBottom: 10 }}>
            近い研究室 Top{neighbors.length}
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {neighbors.map((n, i) => {
              const nci = n.lab!.cluster_id ?? null
              const nc = nci !== null ? CLUSTER_COLORS[nci] : '#94A3B8'
              const nChipBg = nci !== null ? C_CHIP[nci] : 'rgba(148,163,184,0.12)'
              return (
                <Link
                  key={n.id}
                  href={`/lab/${n.id}`}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '12px 16px', borderRadius: 12,
                    background: 'white', border: '1px solid #F3F4F6',
                    textDecoration: 'none', color: 'inherit',
                    transition: 'border-color 0.15s, box-shadow 0.15s',
                    boxShadow: '0 1px 4px rgba(17,24,39,0.04)',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = nc
                    e.currentTarget.style.boxShadow = `0 2px 12px rgba(17,24,39,0.08)`
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = '#F3F4F6'
                    e.currentTarget.style.boxShadow = '0 1px 4px rgba(17,24,39,0.04)'
                  }}
                >
                  <span style={{
                    fontSize: 12, fontWeight: 700, color: '#D1D5DB',
                    width: 18, flexShrink: 0, textAlign: 'center',
                  }}>{i + 1}</span>
                  <span style={{
                    width: 10, height: 10, borderRadius: '50%',
                    background: nc, flexShrink: 0,
                  }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 14, fontWeight: 600, margin: '0 0 2px', color: '#1F2937' }}>
                      {n.lab!.name}
                    </p>
                    <p style={{ fontSize: 12, color: '#6B7280', margin: 0 }}>{n.lab!.faculty_name}</p>
                  </div>
                  <span style={{
                    fontSize: 11, color: nc, fontWeight: 600,
                    background: nChipBg, padding: '2px 8px', borderRadius: 999,
                    flexShrink: 0,
                  }}>
                    {Math.round(n.similarity * 100)}%
                  </span>
                </Link>
              )
            })}
          </div>
        </div>
      )}

      <p style={{ fontSize: 11, color: '#D1D5DB', marginTop: 32 }}>
        取得元: {lab.summary_source_url ?? '未設定'} ／ 最終取得: {lab.fetched_at?.slice(0, 10) ?? '未取得'}
      </p>
    </main>
  )
}