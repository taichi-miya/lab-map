'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

type Report = {
  id: string
  type: string | null
  lab_id: string | null
  lab_name: string | null
  correction_field: string | null
  body: string | null
  message: string | null
  email: string | null
  status: string
  created_at: string
}

const TYPE_LABELS: Record<string, string> = {
  correction: '📝 情報修正依頼',
  feature:    '💡 新機能要望',
  bug:        '🐛 不具合報告',
  other:      '💬 その他',
}

const STATUS_COLORS: Record<string, { bg: string; color: string; label: string }> = {
  new:      { bg: 'rgba(239,68,68,0.10)',   color: '#EF4444', label: '未対応' },
  in_progress: { bg: 'rgba(245,158,11,0.10)', color: '#D97706', label: '対応中' },
  done:     { bg: 'rgba(34,197,94,0.10)',   color: '#16A34A', label: '対応済' },
  rejected: { bg: 'rgba(156,163,175,0.15)', color: '#6B7280', label: '対応しない' },
}

const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD ?? 'admin1234'

export default function AdminPage() {
  const [authed, setAuthed] = useState(false)
  const [pw, setPw] = useState('')
  const [pwError, setPwError] = useState(false)

  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(false)
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterType, setFilterType] = useState<string>('all')
  const [selected, setSelected] = useState<Report | null>(null)
  const [updating, setUpdating] = useState(false)

  const handleLogin = () => {
    if (pw === ADMIN_PASSWORD) {
      setAuthed(true)
      setPwError(false)
    } else {
      setPwError(true)
    }
  }

  const fetchReports = async () => {
    setLoading(true)
    let q = supabase.from('reports').select('*').order('created_at', { ascending: false })
    if (filterStatus !== 'all') q = q.eq('status', filterStatus)
    if (filterType !== 'all') q = q.eq('type', filterType)
    const { data } = await q
    setReports(data ?? [])
    setLoading(false)
  }

  useEffect(() => {
    if (authed) fetchReports()
  }, [authed, filterStatus, filterType])

  const updateStatus = async (id: string, status: string) => {
    setUpdating(true)
    await supabase.from('reports').update({ status }).eq('id', id)
    setReports(prev => prev.map(r => r.id === id ? { ...r, status } : r))
    if (selected?.id === id) setSelected(prev => prev ? { ...prev, status } : null)
    setUpdating(false)
  }

  const counts = {
    all: reports.length,
    new: reports.filter(r => r.status === 'new').length,
  }

  const font = "'Hiragino Kaku Gothic ProN','Hiragino Sans','Noto Sans JP',sans-serif"

  // ── ログイン画面 ──
  if (!authed) {
    return (
      <main style={{ minHeight: '100vh', background: '#F9FAFB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: font }}>
        <div style={{ background: 'white', borderRadius: 16, border: '1.5px solid #E5E7EB', boxShadow: '0 4px 24px rgba(17,24,39,0.08)', padding: '36px 32px', width: 320 }}>
          <h1 style={{ fontSize: 18, fontWeight: 800, margin: '0 0 4px', color: '#1F2937' }}>🔐 管理者ページ</h1>
          <p style={{ fontSize: 12, color: '#9CA3AF', margin: '0 0 24px' }}>パスワードを入力してください</p>
          <input
            type="password"
            value={pw}
            onChange={e => setPw(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
            placeholder="パスワード"
            style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: `1.5px solid ${pwError ? '#EF4444' : '#E5E7EB'}`, fontSize: 14, fontFamily: font, outline: 'none', boxSizing: 'border-box', marginBottom: 8 }}
          />
          {pwError && <p style={{ fontSize: 12, color: '#EF4444', margin: '0 0 8px' }}>パスワードが違います</p>}
          <button onClick={handleLogin} style={{ width: '100%', padding: '10px', borderRadius: 10, border: 'none', background: '#3B82F6', color: 'white', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: font }}>
            ログイン
          </button>
        </div>
      </main>
    )
  }

  // ── 管理画面 ──
  return (
    <main style={{ minHeight: '100vh', background: '#F9FAFB', fontFamily: font, color: '#1F2937' }}>
      {/* ヘッダー */}
      <header style={{ background: 'white', borderBottom: '1px solid #E5E7EB', padding: '14px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: 17, fontWeight: 800, margin: 0 }}>🛠 管理者ダッシュボード</h1>
          <p style={{ fontSize: 12, color: '#9CA3AF', margin: '2px 0 0' }}>お問い合わせ・修正依頼の管理</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <a href="/" style={{ fontSize: 12, color: '#6B7280', textDecoration: 'none', padding: '6px 12px', borderRadius: 8, border: '1px solid #E5E7EB', background: 'white' }}>← マップへ</a>
          <button onClick={() => setAuthed(false)} style={{ fontSize: 12, color: '#EF4444', padding: '6px 12px', borderRadius: 8, border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.05)', cursor: 'pointer', fontFamily: font }}>ログアウト</button>
        </div>
      </header>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 20px' }}>
        {/* サマリーカード */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 24 }}>
          {Object.entries(STATUS_COLORS).map(([key, { bg, color, label }]) => {
            const count = reports.filter(r => r.status === key).length
            return (
              <div key={key} onClick={() => setFilterStatus(filterStatus === key ? 'all' : key)}
                style={{ background: filterStatus === key ? bg : 'white', border: `1.5px solid ${filterStatus === key ? color : '#E5E7EB'}`, borderRadius: 12, padding: '14px 16px', cursor: 'pointer', transition: 'all 0.15s' }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: filterStatus === key ? color : '#9CA3AF', margin: '0 0 4px' }}>{label}</p>
                <p style={{ fontSize: 28, fontWeight: 800, color: filterStatus === key ? color : '#1F2937', margin: 0, lineHeight: 1 }}>{count}</p>
              </div>
            )
          })}
        </div>

        {/* フィルター */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: 12, color: '#6B7280', fontWeight: 600 }}>種別：</span>
          {[['all','すべて'], ['correction','情報修正'], ['feature','機能要望'], ['bug','不具合'], ['other','その他']].map(([val, label]) => (
            <button key={val} onClick={() => setFilterType(val)}
              style={{ padding: '5px 12px', borderRadius: 8, border: '1.5px solid', borderColor: filterType === val ? '#3B82F6' : '#E5E7EB', background: filterType === val ? 'rgba(59,130,246,0.08)' : 'white', color: filterType === val ? '#3B82F6' : '#374151', fontSize: 12, fontWeight: filterType === val ? 700 : 400, cursor: 'pointer', fontFamily: font }}>
              {label}
            </button>
          ))}
          <button onClick={fetchReports} style={{ marginLeft: 'auto', padding: '5px 12px', borderRadius: 8, border: '1px solid #E5E7EB', background: 'white', fontSize: 12, color: '#6B7280', cursor: 'pointer', fontFamily: font }}>
            🔄 再読み込み
          </button>
        </div>

        {/* テーブル＋詳細の2カラム */}
        <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 360px' : '1fr', gap: 16, alignItems: 'start' }}>
          {/* 一覧 */}
          <div style={{ background: 'white', borderRadius: 14, border: '1px solid #E5E7EB', overflow: 'hidden' }}>
            {loading ? (
              <p style={{ textAlign: 'center', padding: '40px 0', color: '#9CA3AF', fontSize: 13 }}>読み込み中...</p>
            ) : reports.length === 0 ? (
              <p style={{ textAlign: 'center', padding: '40px 0', color: '#9CA3AF', fontSize: 13 }}>該当する報告はありません</p>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #F3F4F6', background: '#F9FAFB' }}>
                    {['種別', '研究室', '内容（抜粋）', 'ステータス', '日時', ''].map((h, i) => (
                      <th key={i} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#9CA3AF', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {reports.map(r => {
                    const s = STATUS_COLORS[r.status] ?? STATUS_COLORS.new
                    const isSelected = selected?.id === r.id
                    const content = r.body ?? r.message ?? ''
                    return (
                      <tr key={r.id}
                        onClick={() => setSelected(isSelected ? null : r)}
                        style={{ borderBottom: '1px solid #F3F4F6', cursor: 'pointer', background: isSelected ? '#EFF6FF' : r.status === 'new' ? 'rgba(239,68,68,0.02)' : 'white', transition: 'background 0.1s' }}>
                        <td style={{ padding: '10px 14px', whiteSpace: 'nowrap' }}>
                          <span style={{ fontSize: 11, fontWeight: 600, color: '#374151' }}>
                            {TYPE_LABELS[r.type ?? ''] ?? r.type ?? '—'}
                          </span>
                        </td>
                        <td style={{ padding: '10px 14px', maxWidth: 160 }}>
                          <span style={{ fontSize: 12, color: '#4B5563', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {r.lab_name ?? '—'}
                          </span>
                          {r.correction_field && <span style={{ fontSize: 11, color: '#9CA3AF' }}>{r.correction_field}</span>}
                        </td>
                        <td style={{ padding: '10px 14px', maxWidth: 240 }}>
                          <span style={{ fontSize: 12, color: '#6B7280', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {content.slice(0, 60)}{content.length > 60 ? '…' : ''}
                          </span>
                        </td>
                        <td style={{ padding: '10px 14px', whiteSpace: 'nowrap' }}>
                          <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 999, background: s.bg, color: s.color }}>
                            {s.label}
                          </span>
                        </td>
                        <td style={{ padding: '10px 14px', whiteSpace: 'nowrap', fontSize: 11, color: '#9CA3AF' }}>
                          {r.created_at.slice(0, 10)}
                        </td>
                        <td style={{ padding: '10px 14px' }}>
                          <span style={{ fontSize: 11, color: '#3B82F6' }}>{isSelected ? '閉じる' : '詳細 →'}</span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* 詳細パネル */}
          {selected && (
            <div style={{ background: 'white', borderRadius: 14, border: '1.5px solid #3B82F6', padding: '20px', position: 'sticky', top: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#3B82F6' }}>詳細</span>
                <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: '#9CA3AF', padding: 0, lineHeight: 1 }}>✕</button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <Row label="種別" value={TYPE_LABELS[selected.type ?? ''] ?? selected.type ?? '—'} />
                {selected.lab_name && <Row label="研究室" value={selected.lab_name} />}
                {selected.correction_field && <Row label="修正項目" value={selected.correction_field} />}
                {selected.email && <Row label="メール" value={selected.email} />}
                <Row label="日時" value={selected.created_at.slice(0, 16).replace('T', ' ')} />

                <div>
                  <p style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', margin: '0 0 4px' }}>内容</p>
                  <p style={{ fontSize: 13, color: '#374151', lineHeight: 1.75, margin: 0, whiteSpace: 'pre-wrap', background: '#F9FAFB', padding: '10px 12px', borderRadius: 8 }}>
                    {selected.body ?? selected.message ?? '（内容なし）'}
                  </p>
                </div>

                {/* ステータス変更 */}
                <div>
                  <p style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', margin: '0 0 6px' }}>ステータス変更</p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                    {Object.entries(STATUS_COLORS).map(([key, { bg, color, label }]) => (
                      <button key={key} onClick={() => updateStatus(selected.id, key)} disabled={updating || selected.status === key}
                        style={{ padding: '7px', borderRadius: 8, border: '1.5px solid', borderColor: selected.status === key ? color : '#E5E7EB', background: selected.status === key ? bg : 'white', color: selected.status === key ? color : '#6B7280', fontSize: 12, fontWeight: selected.status === key ? 700 : 400, cursor: selected.status === key ? 'default' : 'pointer', fontFamily: font, opacity: updating ? 0.5 : 1, transition: 'all 0.15s' }}>
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', margin: '0 0 2px' }}>{label}</p>
      <p style={{ fontSize: 13, color: '#374151', margin: 0 }}>{value}</p>
    </div>
  )
}