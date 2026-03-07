import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import PinButton from '@/components/PinButton'
import { getClusterStyle } from '@/lib/clusters'

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

  const { color: clusterColor, name: clusterName, chipBg, stroke: strokeColor } = getClusterStyle(lab.cluster_id)

  // 教員名を分割
  const memberNames: string[] = lab.faculty_name
    ? lab.faculty_name.split('・').map((n: string) => n.trim()).filter(Boolean)
    : []

  // summary_bullets をパース
  const bullets: string[] = (() => {
    if (!lab.summary_bullets) return []
    if (Array.isArray(lab.summary_bullets)) return lab.summary_bullets
    try { return JSON.parse(lab.summary_bullets) } catch { return [] }
  })()

  // 情報修正依頼リンク（研究室IDをクエリに付ける）
  const contactUrl = `/contact?type=correction&lab_id=${id}&lab_name=${encodeURIComponent(lab.name)}`

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
          <PinButton labId={id} />
        </div>

        <h1 style={{ fontSize: 24, fontWeight: 800, margin: '0 0 16px', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
          {lab.name}
        </h1>

        {/* 教員チップ一覧 */}
        {memberNames.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: '#9CA3AF', marginBottom: 8, letterSpacing: '0.05em' }}>
              STAFF
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {memberNames.map((name, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '8px 12px', borderRadius: 10,
                  background: '#F9FAFB', border: '1px solid #F3F4F6',
                }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: '#1F2937' }}>{name}</span>
                  <span style={{
                    fontSize: 11, color: '#9CA3AF',
                    display: 'inline-flex', alignItems: 'center', gap: 4,
                  }}>
                    <span style={{
                      width: 6, height: 6, borderRadius: '50%',
                      background: '#D1D5DB', display: 'inline-block',
                    }} />
                    ResearchMap: 近日公開予定
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* リンク行：研究室HP ＋ SNSアイコン */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 8 }}>
          {/* 研究室HP */}
          {lab.lab_url && (
            <a href={lab.lab_url} target="_blank" rel="noopener noreferrer" style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              fontSize: 13, color: '#3B82F6', textDecoration: 'none',
            }}>
              研究室HP →
            </a>
          )}

          {/* SNSアイコン */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {/* X (Twitter) */}
            <div style={{ position: 'relative', display: 'inline-flex' }} title="近日公開予定">
              <div style={{
                width: 32, height: 32, borderRadius: 8,
                background: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center',
                opacity: 0.45, cursor: 'default',
              }}>
                {/* X アイコン */}
                <svg width={15} height={15} viewBox="0 0 24 24" fill="#1F2937">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.737-8.835L1.254 2.25H8.08l4.253 5.622 5.911-5.622Zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </div>
            </div>

            {/* Instagram */}
            <div style={{ position: 'relative', display: 'inline-flex' }} title="近日公開予定">
              <div style={{
                width: 32, height: 32, borderRadius: 8,
                background: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center',
                opacity: 0.45, cursor: 'default',
              }}>
                {/* Instagram アイコン */}
                <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="#1F2937" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                  <circle cx="12" cy="12" r="4"/>
                  <circle cx="17.5" cy="6.5" r="0.5" fill="#1F2937" stroke="none"/>
                </svg>
              </div>
            </div>

            {/* その他（リンクアイコン） */}
            <div style={{ position: 'relative', display: 'inline-flex' }} title="近日公開予定">
              <div style={{
                width: 32, height: 32, borderRadius: 8,
                background: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center',
                opacity: 0.45, cursor: 'default',
              }}>
                {/* リンクアイコン */}
                <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="#1F2937" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/>
                  <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/>
                </svg>
              </div>
            </div>

            {/* 近日公開予定テキスト */}
            <span style={{ fontSize: 11, color: '#9CA3AF', marginLeft: 2 }}>近日公開予定</span>
          </div>
        </div>

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
        <div style={{ borderTop: '1px solid #F3F4F6', paddingTop: 20 }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: '#9CA3AF', marginBottom: 10, letterSpacing: '0.05em' }}>
            研究概要
          </p>

          {/* 箇条書き3点 */}
          {bullets.length > 0 && (
            <div style={{
              background: chipBg, borderRadius: 12, padding: '14px 16px',
              marginBottom: 16, border: `1px solid ${strokeColor}`,
            }}>
              {bullets.map((b, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'flex-start', gap: 8,
                  marginBottom: i < bullets.length - 1 ? 8 : 0,
                }}>
                  <span style={{
                    width: 6, height: 6, borderRadius: '50%',
                    background: clusterColor, flexShrink: 0, marginTop: 6,
                  }} />
                  <p style={{ fontSize: 13, lineHeight: 1.7, color: '#374151', margin: 0 }}>{b}</p>
                </div>
              ))}
            </div>
          )}

          {/* 概要文 */}
          <p style={{ fontSize: 14, lineHeight: 1.85, color: '#374151', whiteSpace: 'pre-wrap', margin: 0 }}>
            {lab.summary_long ?? lab.summary_text ?? '（未取得）'}
          </p>

          {lab.summary_source_url && (
            <a href={lab.summary_source_url_override ?? lab.summary_source_url} target="_blank" rel="noopener noreferrer" style={{
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
              const { color: nc, chipBg: nChipBg } = getClusterStyle(n.lab!.cluster_id)
              return (
                <Link
                  key={n.id}
                  href={`/lab/${n.id}`}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '12px 16px', borderRadius: 12,
                    background: 'white', border: '1px solid #F3F4F6',
                    textDecoration: 'none', color: 'inherit',
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

      {/* フッター：情報修正依頼 */}
      <div style={{
        marginTop: 32, padding: '14px 18px', borderRadius: 12,
        background: '#F9FAFB', border: '1px solid #F3F4F6',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: 8,
      }}>
        <p style={{ fontSize: 12, color: '#6B7280', margin: 0, lineHeight: 1.5 }}>
          情報に誤りや変更がありますか？
        </p>
        <Link href={contactUrl} style={{
          fontSize: 12, color: '#3B82F6', textDecoration: 'none', fontWeight: 600,
          display: 'inline-flex', alignItems: 'center', gap: 4,
          padding: '6px 12px', borderRadius: 8,
          border: '1.5px solid rgba(59,130,246,0.3)',
          background: 'rgba(59,130,246,0.05)',
        }}>
          ✏️ 情報修正を依頼する
        </Link>
      </div>

      <p style={{ fontSize: 11, color: '#D1D5DB', marginTop: 16 }}>
        取得元: {lab.summary_source_url ?? '未設定'} ／ 最終取得: {lab.fetched_at?.slice(0, 10) ?? '未取得'}
      </p>
    </main>
  )
}