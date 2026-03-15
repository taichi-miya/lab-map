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
const PW = process.env.NEXT_PUBLIC_ADMIN_PASSWORD ?? ''

// labs/faculties のフィールドラベル逆引き
const ALL_FIELD_LABELS: Record<string, string> = {
  summary_text: '📝 研究概要テキスト', lab_url: '🔗 公式HP URL',
  intro_url: '🔗 紹介ページURL', faculty_name: '👤 教員名',
  student_count: '👥 学生数', instagram_url: '📷 公式Instagram',
  twitter_url: '🐦 公式X', youtube_channel_url: '▶️ 公式YouTube',
  youtube_video_urls: '▶️ 紹介YouTube', instagram_url_other: '📷 紹介Instagram',
  twitter_url_other: '🐦 紹介X', researchmap: '🔬 researchmap',
  instagram_username: '📷 Instagramアカウント名', x_username: '🐦 Xアカウント名',
  publication: '📄 論文・著書',
}

export default function ReviewPage() {
  const [authed,   setAuthed]   = useState(false)
  const [pw,       setPw]       = useState('')
  const [pwError,  setPwError]  = useState(false)
  const [logs,     setLogs]     = useState<PendingLog[]>([])
  const [loading,  setLoading]  = useState(false)
  const [note,     setNote]     = useState<Record<string, string>>({})

  useEffect(() => { if (authed) fetchPending() }, [authed])

  async function handleLogin() {
    const res = await fetch('/api/admin/auth', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Taichi', password: pw }),
    })
    if (res.ok) { setAuthed(true) } else { setPwError(true); setTimeout(() => setPwError(false), 2000) }
  }

  async function fetchPending() {
    const { data } = await sb.rpc('get_pending_logs')
    if (data) setLogs(data as PendingLog[])
  }

  async function handleApprove(log: PendingLog) {
    setLoading(true)
    const now = new Date().toISOString()

    // フィールドに応じてDBを更新
    if (log.target_type === 'lab') {
      const labFields: Record<string, string> = {
        summary_text:'summary_text', lab_url:'lab_url', intro_url:'intro_url',
        faculty_name:'faculty_name', student_count:'student_count',
        instagram_url:'instagram_url', twitter_url:'twitter_url',
        youtube_channel_url:'youtube_channel_url',
      }
      const multiFields = ['youtube_video_urls','instagram_url_other','twitter_url_other']

      if (multiFields.includes(log.field)) {
        const { data: current } = await sb.from('labs').select(log.field).eq('id', log.lab_id).single()
        const existing = Array.isArray((current as Record<string,unknown>)?.[log.field])
          ? (current as Record<string,string[]>)[log.field] : []
        const newUrls = log.new_value.split('\n').map(u => u.trim()).filter(u => u)
        await sb.from('labs').update({ [log.field]: [...existing, ...newUrls], updated_at: now }).eq('id', log.lab_id)
      } else if (labFields[log.field]) {
        await sb.from('labs').update({ [labFields[log.field]]: log.new_value, updated_at: now }).eq('id', log.lab_id)
      }
    } else if (log.target_type === 'faculty') {
      const facFields: Record<string, string> = {
        researchmap:'researchmap_id', instagram_url:'instagram_url',
        twitter_url:'twitter_url', x_username:'x_username',
        instagram_username:'instagram_url',
      }
      if (facFields[log.field]) {
        await sb.from('faculties').update({ [facFields[log.field]]: log.new_value, updated_at: now }).eq('id', log.target_id)
      }
    }

    // ログを approved に更新
    await sb.from('admin_logs').update({
      status: 'approved', reviewed_by: 'Taichi', reviewed_at: now,
    }).eq('id', log.id)

    // Discord通知
    await fetch('/api/admin/notify', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        targetType: log.target_type,
        labName: log.lab_name ?? '',
        fieldLabel: ALL_FIELD_LABELS[log.field] ?? log.field,
        newValue: log.new_value,
        contributor: log.contributor,
        isPending: false,
        isApprovalNotice: true,
      }),
    })

    await fetchPending()
    setLoading(false)
  }

  async function handleReject(log: PendingLog) {
    const now = new Date().toISOString()
    await sb.from('admin_logs').update({
      status: 'rejected', reviewed_by: 'Taichi',
      reviewed_at: now, review_note: note[log.id] ?? '',
    }).eq('id', log.id)
    await fetchPending()
  }

  const inp: React.CSSProperties = { width:'100%', padding:'8px 10px', borderRadius:7, border:'1px solid #E5E7EB', fontSize:12, boxSizing:'border-box', outline:'none', fontFamily:font }

  if (!authed) return (
    <main style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#F9FAFB', fontFamily:font }}>
      <div style={{ background:'white', borderRadius:16, padding:'32px 28px', width:320, border:'1px solid #E5E7EB' }}>
        <h1 style={{ fontSize:17, fontWeight:800, margin:'0 0 4px' }}>承認画面</h1>
        <p style={{ fontSize:12, color:'#9CA3AF', margin:'0 0 20px' }}>管理者のみアクセス可</p>
        <input type="password" placeholder="Taichiのパスワード" value={pw}
          onChange={e => setPw(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleLogin()}
          style={{ ...inp, marginBottom:8, fontSize:13, borderColor: pwError ? '#EF4444' : '#E5E7EB' }} />
        {pwError && <p style={{ fontSize:12, color:'#EF4444', margin:'0 0 8px' }}>パスワードが違います</p>}
        <button onClick={handleLogin}
          style={{ width:'100%', padding:'10px', borderRadius:8, border:'none', background:'#1D4ED8', color:'white', fontSize:14, fontWeight:700, cursor:'pointer' }}>
          ログイン
        </button>
      </div>
    </main>
  )

  return (
    <main style={{ minHeight:'100vh', background:'#F9FAFB', fontFamily:font }}>
      <header style={{ background:'white', borderBottom:'1px solid #E5E7EB', padding:'12px 16px', display:'flex', alignItems:'center', justifyContent:'space-between', position:'sticky', top:0, zIndex:10 }}>
        <div>
          <span style={{ fontSize:15, fontWeight:800 }}>📋 承認待ち一覧</span>
          <span style={{ fontSize:11, color:'#9CA3AF', marginLeft:8 }}>contributorからの提案</span>
        </div>
        <div style={{ display:'flex', gap:6 }}>
          <a href="/admin/data" style={{ fontSize:12, color:'#6B7280', textDecoration:'none', padding:'5px 10px', borderRadius:7, border:'1px solid #E5E7EB' }}>← データ投入</a>
          <button onClick={fetchPending} style={{ fontSize:12, color:'#6B7280', padding:'5px 10px', borderRadius:7, border:'1px solid #E5E7EB', background:'white', cursor:'pointer' }}>🔄 更新</button>
        </div>
      </header>

      <div style={{ maxWidth:700, margin:'0 auto', padding:'20px 14px 60px' }}>
        {logs.length === 0 ? (
          <div style={{ textAlign:'center', padding:'60px 0' }}>
            <p style={{ fontSize:32, margin:'0 0 12px' }}>✅</p>
            <p style={{ fontSize:15, color:'#6B7280', margin:0 }}>承認待ちの提案はありません</p>
          </div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            {logs.map(log => (
              <div key={log.id} style={{ background:'white', border:'1.5px solid #FDE68A', borderRadius:12, padding:'16px 18px' }}>
                {/* ヘッダー */}
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12 }}>
                  <div>
                    <p style={{ fontSize:13, fontWeight:700, color:'#1F2937', margin:'0 0 3px' }}>
                      {log.lab_name ?? '不明な研究室'}
                      {log.faculty_name && <span style={{ color:'#6B7280', fontWeight:400 }}> / {log.faculty_name}</span>}
                    </p>
                    <p style={{ fontSize:11, color:'#6B7280', margin:0 }}>
                      {ALL_FIELD_LABELS[log.field] ?? log.field}　·　提案者: <strong>{log.contributor}</strong>　·　{new Date(log.created_at).toLocaleString('ja-JP', { timeZone:'Asia/Tokyo' })}
                    </p>
                  </div>
                  <span style={{ fontSize:11, padding:'3px 10px', borderRadius:20, background:'#FFFBEB', color:'#D97706', border:'1px solid #FDE68A', fontWeight:700, whiteSpace:'nowrap' }}>承認待ち</span>
                </div>

                {/* 既存値 */}
                {log.old_value && (
                  <div style={{ marginBottom:8, background:'#FEF2F2', borderRadius:8, padding:'8px 10px' }}>
                    <p style={{ fontSize:10, color:'#EF4444', fontWeight:700, margin:'0 0 3px' }}>🗑 現在の値（上書きされます）</p>
                    <p style={{ fontSize:12, color:'#374151', margin:0, wordBreak:'break-all', lineHeight:1.6 }}>
                      {log.old_value.length > 200 ? log.old_value.slice(0,200)+'…' : log.old_value}
                    </p>
                  </div>
                )}

                {/* 提案内容 */}
                <div style={{ marginBottom:12, background:'#F0FDF4', borderRadius:8, padding:'8px 10px' }}>
                  <p style={{ fontSize:10, color:'#16A34A', fontWeight:700, margin:'0 0 3px' }}>✨ 提案内容</p>
                  <p style={{ fontSize:12, color:'#374151', margin:0, wordBreak:'break-all', lineHeight:1.6, whiteSpace:'pre-wrap' }}>
                    {log.new_value.length > 400 ? log.new_value.slice(0,400)+'…' : log.new_value}
                  </p>
                </div>

                {/* 却下メモ */}
                <input placeholder="却下理由（任意）" value={note[log.id] ?? ''}
                  onChange={e => setNote(prev => ({ ...prev, [log.id]: e.target.value }))}
                  style={{ ...inp, marginBottom:10 }} />

                {/* ボタン */}
                <div style={{ display:'flex', gap:8 }}>
                  <button onClick={() => handleApprove(log)} disabled={loading}
                    style={{ flex:1, padding:'10px', borderRadius:8, border:'none', background:'#16A34A', color:'white', fontSize:13, fontWeight:700, cursor:'pointer' }}>
                    ✅ 承認してDBに反映
                  </button>
                  <button onClick={() => handleReject(log)} disabled={loading}
                    style={{ flex:1, padding:'10px', borderRadius:8, border:'1px solid #FCA5A5', background:'#FEF2F2', color:'#EF4444', fontSize:13, fontWeight:700, cursor:'pointer' }}>
                    ❌ 却下
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}