'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

type PendingLog = {
  id: string
  target_type: string
  field: string
  new_value: string
  old_value: string | null
  contributor: string
  created_at: string
  lab_name: string | null
  faculty_name: string | null
  lab_id: string
  target_id: string
}

const font = "system-ui,'Noto Sans JP',sans-serif"

const MULTI_FIELDS = ['youtube_video_urls', 'instagram_url_other', 'twitter_url_other']
const LAB_FIELD_MAP: Record<string, string> = {
  summary_text: 'summary_text', lab_url: 'lab_url', intro_url: 'intro_url',
  faculty_name: 'faculty_name', student_count: 'student_count',
  student_count_doc: 'student_count_doc',
  student_count_master: 'student_count_master',
  student_count_under: 'student_count_under',
  instagram_url: 'instagram_url', twitter_url: 'twitter_url',
  youtube_channel_url: 'youtube_channel_url',
  youtube_video_urls: 'youtube_video_urls',
  instagram_url_other: 'instagram_url_other',
  twitter_url_other: 'twitter_url_other',
}
const FAC_FIELD_MAP: Record<string, string> = {
  researchmap: 'researchmap_id', researchmap_id: 'researchmap_id',
  instagram_url: 'instagram_url', twitter_url: 'twitter_url',
  x_username: 'x_username', instagram_username: 'instagram_url',
}
const FIELD_LABELS: Record<string, string> = {
  summary_text: '📝 研究概要', lab_url: '🔗 公式HP',
  intro_url: '🔗 紹介ページ', faculty_name: '👤 教員名',
  student_count: '👥 学生数', student_count_doc: '👥 学生数（博士）',
  student_count_master: '👥 学生数（修士）', student_count_under: '👥 学生数（学部）',
  instagram_url: '📷 Instagram', twitter_url: '🐦 X',
  youtube_channel_url: '▶️ YouTube', youtube_video_urls: '▶️ 紹介YouTube',
  instagram_url_other: '📷 紹介Instagram', twitter_url_other: '🐦 紹介X',
  researchmap: '🔬 researchmap', researchmap_id: '🔬 researchmap',
  instagram_username: '📷 IGアカウント名', x_username: '🐦 Xアカウント名',
  publication: '📄 論文・著書',
}

export default function ReviewPage() {
  const [authed,      setAuthed]      = useState(false)
  const [pw,          setPw]          = useState('')
  const [pwError,     setPwError]     = useState(false)
  const [logs,        setLogs]        = useState<PendingLog[]>([])
  const [checkedIds,  setCheckedIds]  = useState<Set<string>>(new Set())
  const [expandedId,  setExpandedId]  = useState<string | null>(null)
  const [rejectNote,  setRejectNote]  = useState('')
  const [updatingId,  setUpdatingId]  = useState<string | null>(null)
  const [bulkLoading, setBulkLoading] = useState(false)

  useEffect(() => { if (authed) fetchPending() }, [authed])

  async function handleLogin() {
    const res = await fetch('/api/admin/auth', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Taichi', password: pw }),
    })
    if (res.ok) { setAuthed(true) }
    else { setPwError(true); setTimeout(() => setPwError(false), 2000) }
  }

  async function fetchPending() {
    const { data } = await sb.rpc('get_pending_logs')
    if (data) setLogs(data as PendingLog[])
  }

  // 承認処理（共通）
  async function approve(log: PendingLog) {
    const now = new Date().toISOString()
    if (log.target_type === 'lab') {
      if (MULTI_FIELDS.includes(log.field)) {
        const { data: current } = await sb.from('labs').select(log.field).eq('id', log.lab_id).single()
        const currentData = current as unknown as Record<string, unknown> | null
        const existing = Array.isArray(currentData?.[log.field]) ? (currentData?.[log.field] as string[]) : []
        const newUrls = log.new_value.split('\n').map(u => u.trim()).filter(u => u)
        await sb.from('labs').update({ [log.field]: [...existing, ...newUrls], updated_at: now }).eq('id', log.lab_id)
      } else if (LAB_FIELD_MAP[log.field]) {
        await sb.from('labs').update({ [LAB_FIELD_MAP[log.field]]: log.new_value, updated_at: now }).eq('id', log.lab_id)
      }
    } else if (log.target_type === 'faculty') {
      if (FAC_FIELD_MAP[log.field]) {
        await sb.from('faculties').update({ [FAC_FIELD_MAP[log.field]]: log.new_value, updated_at: now }).eq('id', log.target_id)
      }
    }
    await sb.from('admin_logs').update({ status: 'approved', reviewed_by: 'Taichi', reviewed_at: now }).eq('id', log.id)
    await fetch('/api/admin/notify', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        targetType: log.target_type, labName: log.lab_name ?? '',
        fieldLabel: FIELD_LABELS[log.field] ?? log.field,
        newValue: log.new_value, contributor: log.contributor,
        isPending: false, isApprovalNotice: true,
      }),
    })
  }

  // 単体承認
  async function handleApproveSingle(log: PendingLog) {
    setUpdatingId(log.id)
    await approve(log)
    await fetchPending()
    setExpandedId(null)
    setUpdatingId(null)
  }

  // 差し戻し
  async function handleReject(log: PendingLog) {
    setUpdatingId(log.id)
    const now = new Date().toISOString()
    await sb.from('admin_logs').update({
      status: 'rejected', reviewed_by: 'Taichi',
      reviewed_at: now, review_note: rejectNote,
    }).eq('id', log.id)
    await fetchPending()
    setExpandedId(null)
    setRejectNote('')
    setUpdatingId(null)
  }

  // 一括承認
  async function handleBulkApprove() {
    if (checkedIds.size === 0) return
    setBulkLoading(true)
    const targets = logs.filter(l => checkedIds.has(l.id))
    for (const log of targets) await approve(log)
    setCheckedIds(new Set())
    await fetchPending()
    setBulkLoading(false)
  }

  const allIds      = logs.map(l => l.id)
  const isAllChecked = allIds.length > 0 && allIds.every(id => checkedIds.has(id))
  const toggleAll   = () => {
    if (isAllChecked) setCheckedIds(new Set())
    else setCheckedIds(new Set(allIds))
  }

  const inp: React.CSSProperties = {
    width: '100%', padding: '8px 10px', borderRadius: 7,
    border: '1px solid #E5E7EB', fontSize: 12,
    boxSizing: 'border-box', outline: 'none', fontFamily: font,
  }

  if (!authed) return (
    <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F9FAFB', fontFamily: font }}>
      <div style={{ background: 'white', borderRadius: 16, padding: '32px 28px', width: 320, border: '1px solid #E5E7EB' }}>
        <h1 style={{ fontSize: 17, fontWeight: 800, margin: '0 0 4px' }}>承認画面</h1>
        <p style={{ fontSize: 12, color: '#9CA3AF', margin: '0 0 20px' }}>管理者のみアクセス可</p>
        <input type="password" placeholder="Taichiのパスワード" value={pw}
          onChange={e => setPw(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleLogin()}
          style={{ ...inp, marginBottom: 8, fontSize: 13, borderColor: pwError ? '#EF4444' : '#E5E7EB' }} />
        {pwError && <p style={{ fontSize: 12, color: '#EF4444', margin: '0 0 8px' }}>パスワードが違います</p>}
        <button onClick={handleLogin}
          style={{ width: '100%', padding: '10px', borderRadius: 8, border: 'none', background: '#1D4ED8', color: 'white', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
          ログイン
        </button>
      </div>
    </main>
  )

  return (
    <main style={{ minHeight: '100vh', background: '#F9FAFB', fontFamily: font }}>
      <header style={{ background: 'white', borderBottom: '1px solid #E5E7EB', padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 10 }}>
        <div>
          <span style={{ fontSize: 15, fontWeight: 800 }}>📋 承認待ち一覧</span>
          <span style={{ fontSize: 11, color: '#9CA3AF', marginLeft: 8 }}>contributorからの提案</span>
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          {checkedIds.size > 0 && (
            <button onClick={handleBulkApprove} disabled={bulkLoading}
              style={{ padding: '6px 14px', borderRadius: 7, border: 'none', background: bulkLoading ? '#9CA3AF' : '#16A34A', color: 'white', fontSize: 12, fontWeight: 700, cursor: bulkLoading ? 'wait' : 'pointer', fontFamily: font }}>
              {bulkLoading ? '処理中...' : `✅ ${checkedIds.size}件を一括承認`}
            </button>
          )}
          <a href="/admin/data" style={{ fontSize: 12, color: '#6B7280', textDecoration: 'none', padding: '5px 10px', borderRadius: 7, border: '1px solid #E5E7EB' }}>← データ投入</a>
          <button onClick={fetchPending} style={{ fontSize: 12, color: '#6B7280', padding: '5px 10px', borderRadius: 7, border: '1px solid #E5E7EB', background: 'white', cursor: 'pointer' }}>🔄 更新</button>
        </div>
      </header>

      <div style={{ padding: '20px', maxWidth: 1400, margin: '0 auto' }}>
        {logs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <p style={{ fontSize: 32, margin: '0 0 12px' }}>✅</p>
            <p style={{ fontSize: 15, color: '#6B7280', margin: 0 }}>承認待ちの提案はありません</p>
          </div>
        ) : (
          <div style={{ background: 'white', borderRadius: 14, border: '1px solid #E5E7EB', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#F9FAFB', borderBottom: '1px solid #F3F4F6' }}>
                  {/* 全選択チェックボックス */}
                  <th style={{ padding: '10px 12px', width: 36 }}>
                    <input type="checkbox" checked={isAllChecked} onChange={toggleAll}
                      style={{ cursor: 'pointer', width: 14, height: 14 }} />
                  </th>
                  {['研究室 / 教員', '更新項目', '提案内容', '提案者', '日時', '操作'].map((h, i) => (
                    <th key={i} style={{ padding: '10px 12px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#9CA3AF', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {logs.map(log => {
                  const isChecked  = checkedIds.has(log.id)
                  const isExpanded = expandedId === log.id
                  const isUpdating = updatingId === log.id
                  return (
                    <>
                      <tr key={log.id}
                        style={{ borderBottom: isExpanded ? 'none' : '1px solid #F9FAFB', background: isChecked ? 'rgba(22,163,74,0.04)' : isExpanded ? '#F8FAFF' : 'white' }}>
                        {/* チェックボックス */}
                        <td style={{ padding: '10px 12px' }}>
                          <input type="checkbox" checked={isChecked}
                            onChange={e => {
                              const next = new Set(checkedIds)
                              e.target.checked ? next.add(log.id) : next.delete(log.id)
                              setCheckedIds(next)
                            }}
                            style={{ cursor: 'pointer', width: 14, height: 14 }} />
                        </td>
                        {/* 研究室/教員 */}
                        <td style={{ padding: '10px 12px', maxWidth: 200 }}>
                          <p style={{ margin: 0, fontWeight: 600, fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {log.lab_name ?? '—'}
                          </p>
                          {log.faculty_name && (
                            <p style={{ margin: 0, fontSize: 11, color: '#6B7280' }}>{log.faculty_name}</p>
                          )}
                        </td>
                        {/* 更新項目 */}
                        <td style={{ padding: '10px 12px', whiteSpace: 'nowrap', fontSize: 12 }}>
                          {FIELD_LABELS[log.field] ?? log.field}
                        </td>
                        {/* 提案内容（抜粋） */}
                        <td style={{ padding: '10px 12px', maxWidth: 300 }}>
                          <p style={{ margin: 0, fontSize: 12, color: '#374151', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {log.new_value.length > 60 ? log.new_value.slice(0, 60) + '…' : log.new_value}
                          </p>
                        </td>
                        {/* 提案者 */}
                        <td style={{ padding: '10px 12px', whiteSpace: 'nowrap', fontSize: 12, color: '#6B7280' }}>
                          {log.contributor}
                        </td>
                        {/* 日時 */}
                        <td style={{ padding: '10px 12px', whiteSpace: 'nowrap', fontSize: 11, color: '#9CA3AF' }}>
                          {log.created_at.slice(0, 16).replace('T', ' ')}
                        </td>
                        {/* 操作ボタン */}
                        <td style={{ padding: '10px 12px', whiteSpace: 'nowrap' }}>
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button onClick={() => handleApproveSingle(log)} disabled={isUpdating}
                              style={{ padding: '5px 12px', borderRadius: 7, border: 'none', background: '#16A34A', color: 'white', fontSize: 11, fontWeight: 700, cursor: isUpdating ? 'wait' : 'pointer', fontFamily: font }}>
                              {isUpdating ? '…' : '✅ 承認'}
                            </button>
                            <button
                              onClick={() => { setExpandedId(isExpanded ? null : log.id); setRejectNote('') }}
                              disabled={isUpdating}
                              style={{ padding: '5px 12px', borderRadius: 7, border: '1px solid #FCA5A5', background: isExpanded ? '#FEF2F2' : 'white', color: '#EF4444', fontSize: 11, fontWeight: 700, cursor: isUpdating ? 'wait' : 'pointer', fontFamily: font }}>
                              ↩️ 差し戻し
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* 展開行：提案内容全文＋差し戻し入力 */}
                      {isExpanded && (
                        <tr style={{ borderBottom: '1px solid #F3F4F6' }}>
                          <td colSpan={7} style={{ padding: '0 12px 14px 48px', background: '#F8FAFF' }}>
                            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                              {/* 提案内容全文 */}
                              <div style={{ flex: 2, minWidth: 240 }}>
                                <p style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', margin: '0 0 4px' }}>提案内容（全文）</p>
                                <p style={{ fontSize: 12, color: '#1F2937', margin: 0, background: '#F0FDF4', padding: '8px 10px', borderRadius: 8, wordBreak: 'break-all', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
                                  {log.new_value}
                                </p>
                                {log.old_value && (
                                  <div style={{ marginTop: 8 }}>
                                    <p style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', margin: '0 0 4px' }}>現在の値（上書きされます）</p>
                                    <p style={{ fontSize: 12, color: '#374151', margin: 0, background: '#FEF2F2', padding: '8px 10px', borderRadius: 8, wordBreak: 'break-all', lineHeight: 1.6 }}>
                                      {log.old_value.length > 200 ? log.old_value.slice(0, 200) + '…' : log.old_value}
                                    </p>
                                  </div>
                                )}
                              </div>
                              {/* 差し戻し入力 */}
                              <div style={{ flex: 1, minWidth: 200 }}>
                                <p style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', margin: '0 0 4px' }}>差し戻し理由（任意）</p>
                                <textarea value={rejectNote} onChange={e => setRejectNote(e.target.value)} rows={3}
                                  placeholder="差し戻す場合のみ理由を入力..."
                                  style={{ ...inp, resize: 'vertical', marginBottom: 8 }} />
                                <button onClick={() => handleReject(log)} disabled={isUpdating}
                                  style={{ width: '100%', padding: '7px', borderRadius: 8, border: '1px solid #FCA5A5', background: '#FEF2F2', color: '#EF4444', fontSize: 12, fontWeight: 700, cursor: isUpdating ? 'wait' : 'pointer', fontFamily: font }}>
                                  {isUpdating ? '処理中...' : '↩️ 差し戻しを確定する'}
                                </button>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  )
}