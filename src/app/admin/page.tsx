'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

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

type PendingLog = {
  id: string
  target_type: string
  field: string
  new_value: string
  old_value: string | null
  contributor: string | null
  guest_name: string | null
  guest_email: string | null
  created_at: string
  lab_name: string | null
  faculty_name: string | null
  lab_id: string
  target_id: string
  status: string
  review_note: string | null
}

const TYPE_LABELS: Record<string, string> = {
  correction: '📝 情報修正依頼',
  feature:    '💡 新機能要望',
  bug:        '🐛 不具合報告',
  other:      '💬 その他',
}

const REPORT_STATUS: Record<string, { bg: string; color: string; label: string }> = {
  new:         { bg: 'rgba(239,68,68,0.10)',   color: '#EF4444', label: '未対応' },
  in_progress: { bg: 'rgba(245,158,11,0.10)',  color: '#D97706', label: '対応中' },
  done:        { bg: 'rgba(34,197,94,0.10)',   color: '#16A34A', label: '対応済' },
  rejected:    { bg: 'rgba(156,163,175,0.15)', color: '#6B7280', label: '対応しない' },
}

const FIELD_LABELS: Record<string, string> = {
  summary_text: '📝 研究概要テキスト', lab_url: '🔗 公式HP URL',
  intro_url: '🔗 紹介ページURL', faculty_name: '👤 教員名',
  student_count: '👥 学生数', instagram_url: '📷 公式Instagram',
  twitter_url: '🐦 公式X', youtube_channel_url: '▶️ 公式YouTube',
  youtube_video_urls: '▶️ 紹介YouTube', instagram_url_other: '📷 紹介Instagram',
  twitter_url_other: '🐦 紹介X', researchmap: '🔬 researchmap',
  researchmap_id: '🔬 researchmap',
  instagram_username: '📷 Instagramアカウント名', x_username: '🐦 Xアカウント名',
  publication: '📄 論文・著書',
}

const MULTI_FIELDS = ['youtube_video_urls', 'instagram_url_other', 'twitter_url_other']
const LAB_FIELD_MAP: Record<string, string> = {
  summary_text: 'summary_text', lab_url: 'lab_url', intro_url: 'intro_url',
  faculty_name: 'faculty_name', student_count: 'student_count',
  instagram_url: 'instagram_url', twitter_url: 'twitter_url',
  youtube_channel_url: 'youtube_channel_url',
  youtube_video_urls: 'youtube_video_urls',
  instagram_url_other: 'instagram_url_other',
  twitter_url_other: 'twitter_url_other',
}
const FAC_FIELD_MAP: Record<string, string> = {
  researchmap_id: 'researchmap_id', researchmap: 'researchmap_id',
  instagram_url: 'instagram_url', twitter_url: 'twitter_url',
  x_username: 'x_username', instagram_username: 'instagram_url',
}

const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD ?? 'admin1234'
const font = "'Hiragino Kaku Gothic ProN','Hiragino Sans','Noto Sans JP',sans-serif"

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', margin: '0 0 3px' }}>{label}</p>
      <p style={{ fontSize: 13, color: '#374151', margin: 0, wordBreak: 'break-all' }}>{value}</p>
    </div>
  )
}

export default function AdminPage() {
  const [authed,       setAuthed]       = useState(false)
  const [pw,           setPw]           = useState('')
  const [pwError,      setPwError]      = useState(false)
  const [tab,          setTab]          = useState<'reports' | 'pending'>('pending')

  // お問い合わせ
  const [reports,      setReports]      = useState<Report[]>([])
  const [loadingR,     setLoadingR]     = useState(false)
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterType,   setFilterType]   = useState('all')
  const [selected,     setSelected]     = useState<Report | null>(null)
  const [updatingR,    setUpdatingR]    = useState(false)

  // 情報提供レビュー
  const [pending,      setPending]      = useState<PendingLog[]>([])
  const [loadingP,     setLoadingP]     = useState(false)
  const [filterPS,     setFilterPS]     = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending')
  const [selectedP,    setSelectedP]    = useState<PendingLog | null>(null)
  const [checkedIds,   setCheckedIds]   = useState<Set<string>>(new Set())
  const [bulkLoading,  setBulkLoading]  = useState(false)
  const [reviewNote,   setReviewNote]   = useState('')
  const [updatingP,    setUpdatingP]    = useState(false)

  const handleLogin = () => {
    if (pw === ADMIN_PASSWORD) { setAuthed(true); setPwError(false) }
    else setPwError(true)
  }

  const fetchReports = async () => {
    setLoadingR(true)
    let q = supabase.from('reports').select('*').order('created_at', { ascending: false })
    if (filterStatus !== 'all') q = q.eq('status', filterStatus)
    if (filterType   !== 'all') q = q.eq('type',   filterType)
    const { data } = await q
    setReports(data ?? [])
    setLoadingR(false)
  }

  const fetchPending = async () => {
    setLoadingP(true)
    const { data } = await supabase.rpc('get_pending_logs_all', { p_status: filterPS === 'all' ? null : filterPS })
    setPending((data ?? []) as PendingLog[])
    setLoadingP(false)
  }

  useEffect(() => { if (authed) { fetchReports(); fetchPending() } }, [authed])
  useEffect(() => { if (authed) fetchReports() }, [filterStatus, filterType])
  useEffect(() => { if (authed) fetchPending() }, [filterPS])

  const updateReportStatus = async (id: string, status: string) => {
    setUpdatingR(true)
    await supabase.from('reports').update({ status }).eq('id', id)
    setReports(prev => prev.map(r => r.id === id ? { ...r, status } : r))
    if (selected?.id === id) setSelected(prev => prev ? { ...prev, status } : null)
    setUpdatingR(false)
  }

  // 承認処理（単体）
  const handleApprove = async (log: PendingLog) => {
    const now = new Date().toISOString()
    if (log.target_type === 'lab') {
      if (MULTI_FIELDS.includes(log.field)) {
        const { data: current } = await supabase.from('labs').select(log.field).eq('id', log.lab_id).single()
        const currentData = current as unknown as Record<string, unknown> | null
        const existing    = Array.isArray(currentData?.[log.field]) ? (currentData?.[log.field] as string[]) : []
        const newUrls     = log.new_value.split('\n').map(u => u.trim()).filter(u => u)
        await supabase.from('labs').update({ [log.field]: [...existing, ...newUrls], updated_at: now }).eq('id', log.lab_id)
      } else if (LAB_FIELD_MAP[log.field]) {
        await supabase.from('labs').update({ [LAB_FIELD_MAP[log.field]]: log.new_value, updated_at: now }).eq('id', log.lab_id)
      }
    } else if (log.target_type === 'faculty') {
      if (FAC_FIELD_MAP[log.field]) {
        await supabase.from('faculties').update({ [FAC_FIELD_MAP[log.field]]: log.new_value, updated_at: now }).eq('id', log.target_id)
      }
    }
    await supabase.from('admin_logs').update({
      status: 'approved', reviewed_by: 'admin', reviewed_at: now,
    }).eq('id', log.id)
    await fetch('/api/admin/notify', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        targetType: log.target_type,
        labName: `${log.lab_name ?? ''} ${log.faculty_name ? `/ ${log.faculty_name}` : ''}`,
        fieldLabel: FIELD_LABELS[log.field] ?? log.field,
        newValue: log.new_value,
        contributor: log.contributor ?? log.guest_name ?? 'ゲスト',
        isPending: false, isApprovalNotice: true,
      }),
    })
  }

  // 一括承認処理
  const handleBulkApprove = async () => {
    if (checkedIds.size === 0) return
    setBulkLoading(true)
    const targets = pending.filter(p => checkedIds.has(p.id) && p.status === 'pending')
    for (const log of targets) {
      await handleApprove(log)
    }
    setCheckedIds(new Set())
    await fetchPending()
    setSelectedP(null)
    setBulkLoading(false)
  }

  // 単体承認ボタン用（updatingP管理付き）
  const handleApproveSingle = async (log: PendingLog) => {
    setUpdatingP(true)
    await handleApprove(log)
    await fetchPending()
    setSelectedP(null)
    setUpdatingP(false)
  }

  // 差し戻し処理
  const handleReject = async (log: PendingLog) => {
    setUpdatingP(true)
    const now = new Date().toISOString()
    await supabase.from('admin_logs').update({
      status: 'rejected', reviewed_by: 'admin',
      reviewed_at: now, review_note: reviewNote,
    }).eq('id', log.id)
    await fetchPending()
    setSelectedP(null)
    setReviewNote('')
    setUpdatingP(false)
  }

  const pendingCount = pending.filter(p => p.status === 'pending').length

  // チェックボックス：全選択 / 全解除
  const allPendingIds = pending.filter(p => p.status === 'pending').map(p => p.id)
  const isAllChecked  = allPendingIds.length > 0 && allPendingIds.every(id => checkedIds.has(id))
  const toggleAll = () => {
    if (isAllChecked) setCheckedIds(new Set())
    else setCheckedIds(new Set(allPendingIds))
  }

  if (!authed) return (
    <main style={{ minHeight: '100vh', background: '#F9FAFB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: font }}>
      <div style={{ background: 'white', borderRadius: 16, border: '1.5px solid #E5E7EB', padding: '36px 32px', width: 320 }}>
        <h1 style={{ fontSize: 18, fontWeight: 800, margin: '0 0 4px', color: '#1F2937' }}>🔐 管理者ページ</h1>
        <p style={{ fontSize: 12, color: '#9CA3AF', margin: '0 0 24px' }}>パスワードを入力してください</p>
        <input type="password" value={pw} onChange={e => setPw(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleLogin()} placeholder="パスワード"
          style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: `1.5px solid ${pwError ? '#EF4444' : '#E5E7EB'}`, fontSize: 14, fontFamily: font, outline: 'none', boxSizing: 'border-box', marginBottom: 8 }} />
        {pwError && <p style={{ fontSize: 12, color: '#EF4444', margin: '0 0 8px' }}>パスワードが違います</p>}
        <button onClick={handleLogin}
          style={{ width: '100%', padding: '10px', borderRadius: 10, border: 'none', background: '#3B82F6', color: 'white', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: font }}>
          ログイン
        </button>
      </div>
    </main>
  )

  return (
    <main style={{ minHeight: '100vh', background: '#F9FAFB', fontFamily: font, color: '#1F2937' }}>
      <header style={{ background: 'white', borderBottom: '1px solid #E5E7EB', padding: '14px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: 17, fontWeight: 800, margin: 0 }}>🛠 管理者ダッシュボード</h1>
          <p style={{ fontSize: 12, color: '#9CA3AF', margin: '2px 0 0' }}>お問い合わせ・情報提供の管理</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <a href="/admin/data" style={{ fontSize: 12, color: '#6B7280', textDecoration: 'none', padding: '6px 12px', borderRadius: 8, border: '1px solid #E5E7EB', background: 'white' }}>データ投入</a>
          <a href="/" style={{ fontSize: 12, color: '#6B7280', textDecoration: 'none', padding: '6px 12px', borderRadius: 8, border: '1px solid #E5E7EB', background: 'white' }}>← マップへ</a>
          <button onClick={() => setAuthed(false)}
            style={{ fontSize: 12, color: '#EF4444', padding: '6px 12px', borderRadius: 8, border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.05)', cursor: 'pointer', fontFamily: font }}>
            ログアウト
          </button>
        </div>
      </header>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 20px' }}>

        {/* タブ */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 24, background: 'white', border: '1px solid #E5E7EB', borderRadius: 12, padding: 4, width: 'fit-content' }}>
          <button onClick={() => setTab('pending')}
            style={{ padding: '8px 20px', borderRadius: 9, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: tab === 'pending' ? 700 : 400, fontFamily: font, background: tab === 'pending' ? '#1D4ED8' : 'transparent', color: tab === 'pending' ? 'white' : '#6B7280', display: 'flex', alignItems: 'center', gap: 6 }}>
            📬 情報提供レビュー
            {pendingCount > 0 && (
              <span style={{ background: '#EF4444', color: 'white', fontSize: 11, fontWeight: 700, borderRadius: 20, padding: '1px 7px' }}>{pendingCount}</span>
            )}
          </button>
          <button onClick={() => setTab('reports')}
            style={{ padding: '8px 20px', borderRadius: 9, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: tab === 'reports' ? 700 : 400, fontFamily: font, background: tab === 'reports' ? '#1D4ED8' : 'transparent', color: tab === 'reports' ? 'white' : '#6B7280' }}>
            💬 お問い合わせ
          </button>
        </div>

        {/* ══════════ 情報提供レビュータブ ══════════ */}
        {tab === 'pending' && (
          <div>
            {/* フィルター＋一括承認 */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 16, alignItems: 'center', flexWrap: 'wrap' }}>
              {([['pending','承認待ち'], ['approved','承認済み'], ['rejected','差し戻し済み'], ['all','すべて']] as const).map(([val, label]) => (
                <button key={val} onClick={() => { setFilterPS(val); setCheckedIds(new Set()) }}
                  style={{ padding: '5px 14px', borderRadius: 8, border: '1.5px solid',
                    borderColor: filterPS === val ? '#1D4ED8' : '#E5E7EB',
                    background: filterPS === val ? 'rgba(29,78,216,0.07)' : 'white',
                    color: filterPS === val ? '#1D4ED8' : '#374151',
                    fontSize: 12, fontWeight: filterPS === val ? 700 : 400, cursor: 'pointer', fontFamily: font }}>
                  {label}
                </button>
              ))}
              {/* 一括承認ボタン */}
              {checkedIds.size > 0 && (
                <button onClick={handleBulkApprove} disabled={bulkLoading}
                  style={{ padding: '5px 16px', borderRadius: 8, border: 'none', background: bulkLoading ? '#9CA3AF' : '#16A34A', color: 'white', fontSize: 12, fontWeight: 700, cursor: bulkLoading ? 'wait' : 'pointer', fontFamily: font }}>
                  {bulkLoading ? '処理中...' : `✅ ${checkedIds.size}件を一括承認`}
                </button>
              )}
              <button onClick={fetchPending}
                style={{ marginLeft: 'auto', padding: '5px 12px', borderRadius: 8, border: '1px solid #E5E7EB', background: 'white', fontSize: 12, color: '#6B7280', cursor: 'pointer', fontFamily: font }}>
                🔄 更新
              </button>
            </div>

            {/* 2カラムレイアウト */}
            <div style={{ display: 'grid', gridTemplateColumns: selectedP ? '1fr 400px' : '1fr', gap: 16, alignItems: 'start' }}>

              {/* 一覧テーブル */}
              <div style={{ background: 'white', borderRadius: 14, border: '1px solid #E5E7EB', overflow: 'hidden' }}>
                {loadingP ? (
                  <p style={{ textAlign: 'center', padding: '40px 0', color: '#9CA3AF', fontSize: 13 }}>読み込み中...</p>
                ) : pending.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '48px 0' }}>
                    <p style={{ fontSize: 28, margin: '0 0 8px' }}>✅</p>
                    <p style={{ color: '#9CA3AF', fontSize: 13, margin: 0 }}>
                      {filterPS === 'pending' ? '承認待ちの情報提供はありません' : '該当するデータはありません'}
                    </p>
                  </div>
                ) : (
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid #F3F4F6', background: '#F9FAFB' }}>
                        {/* 全選択チェックボックス */}
                        <th style={{ padding: '10px 12px', width: 36 }}>
                          {filterPS === 'pending' && allPendingIds.length > 0 && (
                            <input type="checkbox" checked={isAllChecked} onChange={toggleAll}
                              style={{ cursor: 'pointer', width: 14, height: 14 }} />
                          )}
                        </th>
                        {['ステータス', '研究室 / 教員', '更新項目', '提案内容（抜粋）', '提案者', '日時', ''].map((h, i) => (
                          <th key={i} style={{ padding: '10px 12px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#9CA3AF', whiteSpace: 'nowrap' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {pending.map(p => {
                        const isSelected = selectedP?.id === p.id
                        const isChecked  = checkedIds.has(p.id)
                        const statusStyle = p.status === 'approved'
                          ? { bg: 'rgba(34,197,94,0.10)', color: '#16A34A', label: '承認済み' }
                          : p.status === 'rejected'
                          ? { bg: 'rgba(156,163,175,0.15)', color: '#6B7280', label: '差し戻し済み' }
                          : { bg: 'rgba(245,158,11,0.10)', color: '#D97706', label: '承認待ち' }
                        return (
                          <tr key={p.id}
                            style={{ borderBottom: '1px solid #F9FAFB', background: isChecked ? 'rgba(22,163,74,0.05)' : isSelected ? '#EFF6FF' : 'white', cursor: 'pointer' }}
                            onClick={() => { setSelectedP(isSelected ? null : p); setReviewNote('') }}>
                            {/* チェックボックス */}
                            <td style={{ padding: '10px 12px' }} onClick={e => e.stopPropagation()}>
                              {p.status === 'pending' && (
                                <input type="checkbox" checked={isChecked}
                                  onChange={e => {
                                    const next = new Set(checkedIds)
                                    e.target.checked ? next.add(p.id) : next.delete(p.id)
                                    setCheckedIds(next)
                                  }}
                                  style={{ cursor: 'pointer', width: 14, height: 14 }} />
                              )}
                            </td>
                            <td style={{ padding: '10px 12px', whiteSpace: 'nowrap' }}>
                              <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 20, background: statusStyle.bg, color: statusStyle.color, fontWeight: 700 }}>
                                {statusStyle.label}
                              </span>
                            </td>
                            <td style={{ padding: '10px 12px', maxWidth: 180 }}>
                              <p style={{ margin: 0, fontWeight: 600, fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.lab_name ?? '—'}</p>
                              {p.faculty_name && <p style={{ margin: 0, fontSize: 11, color: '#6B7280' }}>{p.faculty_name}</p>}
                            </td>
                            <td style={{ padding: '10px 12px', whiteSpace: 'nowrap', fontSize: 12 }}>
                              {FIELD_LABELS[p.field] ?? p.field}
                            </td>
                            <td style={{ padding: '10px 12px', maxWidth: 200 }}>
                              <p style={{ margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 12, color: '#374151' }}>
                                {p.new_value.length > 50 ? p.new_value.slice(0, 50) + '…' : p.new_value}
                              </p>
                            </td>
                            <td style={{ padding: '10px 12px', whiteSpace: 'nowrap', fontSize: 12, color: '#6B7280' }}>
                              {p.contributor ?? p.guest_name ?? 'ゲスト'}
                            </td>
                            <td style={{ padding: '10px 12px', whiteSpace: 'nowrap', fontSize: 11, color: '#9CA3AF' }}>
                              {p.created_at.slice(0, 16).replace('T', ' ')}
                            </td>
                            <td style={{ padding: '10px 12px' }}>
                              <span style={{ fontSize: 11, color: isSelected ? '#1D4ED8' : '#9CA3AF' }}>
                                {isSelected ? '閉じる' : '詳細 →'}
                              </span>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                )}
              </div>

              {/* 詳細パネル */}
              {selectedP && (
                <div style={{ background: 'white', borderRadius: 14, border: '1.5px solid #3B82F6', padding: '20px', position: 'sticky', top: 20 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#3B82F6' }}>詳細</span>
                    <button onClick={() => { setSelectedP(null); setReviewNote('') }}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: '#9CA3AF', padding: 0 }}>✕</button>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <Row label="研究室" value={selectedP.lab_name ?? '—'} />
                    {selectedP.faculty_name && <Row label="教員" value={selectedP.faculty_name} />}
                    <Row label="更新項目" value={FIELD_LABELS[selectedP.field] ?? selectedP.field} />
                    <Row label="提案者" value={selectedP.contributor ?? selectedP.guest_name ?? 'ゲスト（匿名）'} />
                    {selectedP.guest_email && <Row label="メール" value={selectedP.guest_email} />}
                    <Row label="日時" value={selectedP.created_at.slice(0, 16).replace('T', ' ')} />
                    {selectedP.old_value && (
                      <div>
                        <p style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', margin: '0 0 4px' }}>現在の値（上書きされます）</p>
                        <p style={{ fontSize: 12, color: '#374151', margin: 0, background: '#FEF2F2', padding: '8px 10px', borderRadius: 8, wordBreak: 'break-all', lineHeight: 1.6 }}>
                          {selectedP.old_value.length > 200 ? selectedP.old_value.slice(0, 200) + '…' : selectedP.old_value}
                        </p>
                      </div>
                    )}
                    <div>
                      <p style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', margin: '0 0 4px' }}>提案内容</p>
                      <p style={{ fontSize: 13, color: '#1F2937', margin: 0, background: '#F0FDF4', padding: '10px 12px', borderRadius: 8, wordBreak: 'break-all', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
                        {selectedP.new_value}
                      </p>
                    </div>
                    {selectedP.status === 'pending' ? (
                      <div>
                        <p style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', margin: '0 0 4px' }}>差し戻し理由（任意）</p>
                        <textarea value={reviewNote} onChange={e => setReviewNote(e.target.value)} rows={2}
                          placeholder="差し戻す場合のみ理由を入力..."
                          style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 12, boxSizing: 'border-box', outline: 'none', fontFamily: font, resize: 'vertical' }} />
                      </div>
                    ) : selectedP.review_note ? (
                      <Row label="差し戻し理由" value={selectedP.review_note} />
                    ) : null}
                    {selectedP.status === 'pending' && (
                      <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                        <button onClick={() => handleApproveSingle(selectedP)} disabled={updatingP}
                          style={{ flex: 1, padding: '10px', borderRadius: 9, border: 'none', background: '#16A34A', color: 'white', fontSize: 13, fontWeight: 700, cursor: updatingP ? 'wait' : 'pointer', fontFamily: font }}>
                          {updatingP ? '処理中...' : '✅ 承認してDBに反映'}
                        </button>
                        <button onClick={() => handleReject(selectedP)} disabled={updatingP}
                          style={{ flex: 1, padding: '10px', borderRadius: 9, border: '1px solid #FCA5A5', background: '#FEF2F2', color: '#EF4444', fontSize: 13, fontWeight: 700, cursor: updatingP ? 'wait' : 'pointer', fontFamily: font }}>
                          {updatingP ? '処理中...' : '↩️ 差し戻し'}
                        </button>
                      </div>
                    )}
                    {selectedP.status !== 'pending' && (
                      <div style={{ padding: '10px 12px', borderRadius: 9, background: selectedP.status === 'approved' ? 'rgba(34,197,94,0.08)' : 'rgba(156,163,175,0.12)', textAlign: 'center' }}>
                        <p style={{ fontSize: 13, fontWeight: 700, color: selectedP.status === 'approved' ? '#16A34A' : '#6B7280', margin: 0 }}>
                          {selectedP.status === 'approved' ? '✅ 承認済み・DB反映済み' : '↩️ 差し戻し済み'}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ══════════ お問い合わせタブ ══════════ */}
        {tab === 'reports' && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 24 }}>
              {Object.entries(REPORT_STATUS).map(([key, { bg, color, label }]) => {
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
            <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
              <span style={{ fontSize: 12, color: '#6B7280', fontWeight: 600 }}>種別：</span>
              {[['all','すべて'], ['correction','情報修正'], ['feature','機能要望'], ['bug','不具合'], ['other','その他']].map(([val, label]) => (
                <button key={val} onClick={() => setFilterType(val)}
                  style={{ padding: '5px 12px', borderRadius: 8, border: '1.5px solid', borderColor: filterType === val ? '#3B82F6' : '#E5E7EB', background: filterType === val ? 'rgba(59,130,246,0.08)' : 'white', color: filterType === val ? '#3B82F6' : '#374151', fontSize: 12, fontWeight: filterType === val ? 700 : 400, cursor: 'pointer', fontFamily: font }}>
                  {label}
                </button>
              ))}
              <button onClick={fetchReports}
                style={{ marginLeft: 'auto', padding: '5px 12px', borderRadius: 8, border: '1px solid #E5E7EB', background: 'white', fontSize: 12, color: '#6B7280', cursor: 'pointer', fontFamily: font }}>
                🔄 再読み込み
              </button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 360px' : '1fr', gap: 16, alignItems: 'start' }}>
              <div style={{ background: 'white', borderRadius: 14, border: '1px solid #E5E7EB', overflow: 'hidden' }}>
                {loadingR ? (
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
                        const s = REPORT_STATUS[r.status] ?? { bg: 'white', color: '#6B7280', label: r.status }
                        const isSelected = selected?.id === r.id
                        return (
                          <tr key={r.id} style={{ borderBottom: '1px solid #F9FAFB', background: isSelected ? '#EFF6FF' : 'white', cursor: 'pointer' }}
                            onClick={() => setSelected(isSelected ? null : r)}>
                            <td style={{ padding: '10px 14px', whiteSpace: 'nowrap' }}>
                              <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 20, background: 'rgba(59,130,246,0.08)', color: '#3B82F6', fontWeight: 600 }}>
                                {TYPE_LABELS[r.type ?? ''] ?? r.type ?? '—'}
                              </span>
                            </td>
                            <td style={{ padding: '10px 14px', fontSize: 12, maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.lab_name ?? '—'}</td>
                            <td style={{ padding: '10px 14px', maxWidth: 200 }}>
                              <p style={{ margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 12 }}>
                                {(r.body ?? r.message ?? '').slice(0, 50)}
                              </p>
                            </td>
                            <td style={{ padding: '10px 14px', whiteSpace: 'nowrap' }}>
                              <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 20, background: s.bg, color: s.color, fontWeight: 700 }}>{s.label}</span>
                            </td>
                            <td style={{ padding: '10px 14px', fontSize: 11, color: '#9CA3AF', whiteSpace: 'nowrap' }}>{r.created_at.slice(0, 16).replace('T', ' ')}</td>
                            <td style={{ padding: '10px 14px' }}>
                              <span style={{ fontSize: 11, color: isSelected ? '#3B82F6' : '#9CA3AF' }}>{isSelected ? '閉じる' : '詳細 →'}</span>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                )}
              </div>
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
                    <div>
                      <p style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', margin: '0 0 6px' }}>ステータス変更</p>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                        {Object.entries(REPORT_STATUS).map(([key, { bg, color, label }]) => (
                          <button key={key} onClick={() => updateReportStatus(selected.id, key)}
                            disabled={updatingR || selected.status === key}
                            style={{ padding: '7px', borderRadius: 8, border: '1.5px solid', borderColor: selected.status === key ? color : '#E5E7EB', background: selected.status === key ? bg : 'white', color: selected.status === key ? color : '#6B7280', fontSize: 12, fontWeight: selected.status === key ? 700 : 400, cursor: selected.status === key ? 'default' : 'pointer', fontFamily: font, opacity: updatingR ? 0.6 : 1 }}>
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
        )}
      </div>
    </main>
  )
}