'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import { useUser, SignInButton } from '@clerk/nextjs'

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

type Lab        = { id: string; name: string; faculty_name: string | null; dept: string | null }
type Faculty    = { id: string; name: string; role: string | null; researchmap_id: string | null }
type Target     = 'lab' | 'faculty'
type InputMode  = 'url' | 'screenshot' | 'manual'
type PubType    = 'paper' | 'book' | 'other'
type UserRole   = 'superadmin' | 'admin' | 'contributor'

type LabFieldDef = {
  label: string; col: string; group: 'basic' | 'sns'
  hasSource?: boolean; hasYear?: boolean; isUrl?: boolean; isImage?: boolean
}
const LAB_FIELDS: Record<string, LabFieldDef> = {
  summary_text:        { label:'📝 研究概要テキスト（HPから）',         col:'summary_text',        group:'basic', hasSource:true },
  summary_text_image:  { label:'📷 研究概要テキスト（スクショから）',   col:'summary_text',        group:'basic', hasSource:true, isImage:true },
  lab_url:             { label:'🔗 公式HPのURL',                       col:'lab_url',             group:'basic', isUrl:true },
  intro_url:           { label:'🔗 紹介ページのURL（研究科HP等）',      col:'intro_url',           group:'basic', isUrl:true },
  faculty_name:        { label:'👤 教員名',                            col:'faculty_name',        group:'basic', hasSource:true },
  student_count:       { label:'👥 学生数（年度・出典つき）',           col:'student_count',       group:'basic', hasSource:true, hasYear:true },
  instagram_url:       { label:'📷 公式 Instagram URL',               col:'instagram_url',       group:'sns', isUrl:true },
  twitter_url:         { label:'🐦 公式 X（Twitter）URL',             col:'twitter_url',         group:'sns', isUrl:true },
  youtube_channel_url: { label:'▶️  公式 YouTube チャンネル URL',      col:'youtube_channel_url', group:'sns', isUrl:true },
  youtube_video_urls:  { label:'▶️  紹介 YouTube 動画 URL（非公式）',  col:'youtube_video_urls',  group:'sns', isUrl:true },
  instagram_url_other: { label:'📷 紹介 Instagram URL（非公式）',      col:'instagram_url_other', group:'sns', isUrl:true },
  twitter_url_other:   { label:'🐦 紹介 X URL（非公式）',             col:'twitter_url_other',   group:'sns', isUrl:true },
}
const MULTI_FIELDS = ['youtube_video_urls', 'instagram_url_other', 'twitter_url_other']

type FacultyFieldDef = { label: string; col: string; group: 'sns' | 'research'; isUrl?: boolean; hint?: string }
const FACULTY_FIELDS: Record<string, FacultyFieldDef> = {
  instagram_username: { label:'📷 Instagram アカウント名（@以下）', col:'instagram_url',  group:'sns',      hint:'例: tohoku_lab_abc' },
  x_username:         { label:'🐦 X アカウント名（@以下）',         col:'x_username',     group:'sns',      hint:'例: tohoku_lab_abc' },
  instagram_url:      { label:'📷 Instagram の URL',               col:'instagram_url',  group:'sns',      isUrl:true },
  twitter_url:        { label:'🐦 X（Twitter）の URL',             col:'twitter_url',    group:'sns',      isUrl:true },
  researchmap:        { label:'🔬 researchmap の URL',             col:'researchmap_id', group:'research', isUrl:true, hint:'URLを貼るとIDを自動抽出します' },
  publication:        { label:'📄 論文・著書を追加',                col:'__pub__',        group:'research' },
}

const font = "system-ui,'Noto Sans JP',sans-serif"
const card: React.CSSProperties = { background:'white', border:'1px solid #E5E7EB', borderRadius:12, padding:'16px 18px', marginBottom:12 }
const inp:  React.CSSProperties = { width:'100%', padding:'9px 12px', borderRadius:8, border:'1px solid #E5E7EB', fontSize:13, boxSizing:'border-box', outline:'none', fontFamily:font }
const sel:  React.CSSProperties = { ...inp, background:'white', cursor:'pointer' }

function Label({ text, hint }: { text: string; hint?: string }) {
  return (
    <p style={{ fontSize:11, fontWeight:700, color:'#6B7280', margin:'0 0 8px', letterSpacing:'0.04em' }}>
      {text}{hint && <span style={{ fontWeight:400, marginLeft:6, color:'#9CA3AF' }}>（{hint}）</span>}
    </p>
  )
}
function ModeBtn({ active, onClick, icon, title, desc }: { active:boolean; onClick:()=>void; icon:string; title:string; desc:string }) {
  return (
    <button onClick={onClick} style={{ padding:'10px 12px', borderRadius:8, cursor:'pointer', textAlign:'left', width:'100%', border:`1.5px solid ${active ? '#3B82F6' : '#E5E7EB'}`, background: active ? '#EFF6FF' : 'white' }}>
      <p style={{ fontSize:13, fontWeight:active?700:500, color:active?'#1D4ED8':'#374151', margin:'0 0 2px' }}>{icon} {title}</p>
      <p style={{ fontSize:11, color:active?'#3B82F6':'#9CA3AF', margin:0, lineHeight:1.4 }}>{desc}</p>
    </button>
  )
}

export default function AdminDataPage() {
  const { user, isLoaded } = useUser()

  const [authed,       setAuthed]       = useState(false)
  const [userRole,     setUserRole]     = useState<UserRole>('contributor')
  const [userName,     setUserName]     = useState('')
  const [nameInput,    setNameInput]    = useState('')
  const [adminNames,   setAdminNames]   = useState<string[]>([])
  const [adminSelect,  setAdminSelect]  = useState('')
  const [showNewAdmin, setShowNewAdmin] = useState(false)
  const [newAdminName, setNewAdminName] = useState('')
  const [pw,           setPw]           = useState('')
  const [loginMode,    setLoginMode]    = useState<'contributor' | 'admin'>('contributor')
  const [loginError,   setLoginError]   = useState('')
  const [labs,         setLabs]         = useState<Lab[]>([])
  const [query,        setQuery]        = useState('')
  const [labId,        setLabId]        = useState('')
  const [target,       setTarget]       = useState<Target>('lab')
  const [faculties,    setFaculties]    = useState<Faculty[]>([])
  const [facId,        setFacId]        = useState('')
  const [labFieldKey,  setLabFieldKey]  = useState('summary_text')
  const [facFieldKey,  setFacFieldKey]  = useState('researchmap')
  const [inputMode,    setInputMode]    = useState<InputMode>('url')
  const [urlInput,     setUrlInput]     = useState('')
  const [multiUrls,    setMultiUrls]    = useState<string[]>([''])
  const [manualText,   setManualText]   = useState('')
  const [aiResult,     setAiResult]     = useState('')
  const [imgFile,      setImgFile]      = useState<File | null>(null)
  const [sourceUrl,    setSourceUrl]    = useState('')
  const [yearVal,      setYearVal]      = useState('')
  const [currentVal,   setCurrentVal]   = useState('')
  const [loading,      setLoading]      = useState(false)
  const [saved,        setSaved]        = useState(false)
  const [saveCount,    setSaveCount]    = useState(0)
  const [saveBlocked,  setSaveBlocked]  = useState(false)
  const [pubType,      setPubType]      = useState<PubType>('paper')
  const [pubTitle,     setPubTitle]     = useState('')
  const [pubDoi,       setPubDoi]       = useState('')
  const [pubIsbn,      setPubIsbn]      = useState('')
  const [pubPublisher, setPubPublisher] = useState('')
  const [pubYear,      setPubYear]      = useState('')
  const [pubAuthors,   setPubAuthors]   = useState('')
  const [pubUrl,       setPubUrl]       = useState('')

  useEffect(() => { fetchAdminNames() }, [])
  useEffect(() => { if (authed) fetchLabs() }, [authed])
  useEffect(() => {
    setFacId(''); setFaculties([]); resetInput()
    if (labId && target === 'faculty') fetchFaculties(labId)
    if (labId && target === 'lab')     fetchCurrentLabVal(labId, labFieldKey)
  }, [labId, target])
  useEffect(() => { if (labId && target === 'lab') fetchCurrentLabVal(labId, labFieldKey); resetInput() }, [labFieldKey])
  useEffect(() => { if (facId) fetchCurrentFacVal(facId, facFieldKey); resetInput() }, [facId, facFieldKey])

  // Clerkログイン済みなら自動でrole取得
  useEffect(() => {
    if (isLoaded && user && !authed) handleClerkLogin()
  }, [isLoaded, user])

  function resetInput() {
    setUrlInput(''); setManualText(''); setAiResult('')
    setImgFile(null); setSourceUrl(''); setYearVal(''); setMultiUrls([''])
  }

  async function fetchAdminNames() {
    const { data } = await sb.from('contributors').select('name').eq('role', 'admin').order('name')
    if (data) setAdminNames(data.map((d: { name: string }) => d.name))
  }

  async function handleClerkLogin() {
    if (!user) return
    const res = await fetch('/api/admin/auth', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clerk_user_id: user.id,
        name:  user.fullName ?? user.username ?? user.emailAddresses[0]?.emailAddress ?? 'unknown',
        email: user.emailAddresses[0]?.emailAddress ?? null,
      }),
    })
    if (res.ok) {
      const d = await res.json()
      setAuthed(true)
      setUserRole(d.role as UserRole)
      setUserName(d.name)
    }
  }

  async function handleLogin() {
    let loginName = ''
    if (loginMode === 'contributor') {
      loginName = nameInput.trim()
      if (!loginName) { setLoginError('名前を入力してください'); return }
    } else {
      loginName = showNewAdmin ? newAdminName.trim() : adminSelect
      if (!loginName) { setLoginError(showNewAdmin ? '名前を入力してください' : '名前を選択してください'); return }
    }
    const res = await fetch('/api/admin/auth', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: loginName, password: pw }),
    })
    if (res.ok) {
      const d = await res.json()
      setAuthed(true)
      setUserRole(d.role as UserRole)
      setUserName(d.name)
    } else {
      setLoginError('名前またはパスワードが違います')
      setTimeout(() => setLoginError(''), 2000)
    }
  }

  async function fetchLabs() {
    const { data } = await sb.from('labs').select('id,name,faculty_name,dept').order('dept').order('name')
    if (data) setLabs(data)
  }
  async function fetchFaculties(lId: string) {
    const { data } = await sb.from('faculties').select('id,name,role,researchmap_id').eq('lab_id', lId).order('name')
    if (data) setFaculties(data)
  }
  async function fetchCurrentLabVal(lId: string, key: string) {
    const def = LAB_FIELDS[key]; if (!def) return
    const { data } = await sb.from('labs').select(def.col).eq('id', lId).single()
    setCurrentVal((data as Record<string, string> | null)?.[def.col] ?? '')
  }
  async function fetchCurrentFacVal(fId: string, key: string) {
    const def = FACULTY_FIELDS[key]; if (!def || def.col === '__pub__') return
    const { data } = await sb.from('faculties').select(def.col).eq('id', fId).single()
    setCurrentVal((data as Record<string, string> | null)?.[def.col] ?? '')
  }

  const filtered = labs.filter(l =>
    l.name.includes(query) || (l.faculty_name ?? '').includes(query) || (l.dept ?? '').includes(query)
  )

  async function handleFetchUrl() {
    if (!urlInput.trim()) return
    setLoading(true); setAiResult('')
    try {
      const res = await fetch('/api/admin/fetch-url', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: urlInput, mode: target, field: target === 'lab' ? labFieldKey : facFieldKey }),
      })
      const d = await res.json()
      setAiResult(d.text ?? 'テキストを取得できませんでした')
    } catch { setAiResult('エラーが発生しました') }
    setLoading(false)
  }

  async function handleOcr() {
    if (!imgFile) return
    setLoading(true); setAiResult('')
    const reader = new FileReader()
    reader.onload = async (e) => {
      const b64 = (e.target?.result as string).split(',')[1]
      const res = await fetch('/api/admin/ocr', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: b64, mimeType: imgFile.type }),
      })
      const d = await res.json()
      setAiResult(d.text ?? 'OCR失敗')
      setLoading(false)
    }
    reader.readAsDataURL(imgFile)
  }

  async function handleSave() {
    if (saveBlocked) return alert('短時間に保存が多すぎます。少し待ってから試してください。')
    const newCount = saveCount + 1; setSaveCount(newCount)
    if (newCount >= 10) { setSaveBlocked(true); setTimeout(() => { setSaveBlocked(false); setSaveCount(0) }, 60_000) }

    if (!labId) return alert('研究室を選択してください')
    if (target === 'faculty' && !facId) return alert('教員を選択してください')

    const now = new Date().toISOString()
    setLoading(true)

    try {
      // superadmin も admin 権限で動作する
      const isAdmin = userRole === 'admin' || userRole === 'superadmin'

      if (target === 'faculty' && facFieldKey === 'publication') {
        if (!pubTitle.trim() && !pubDoi.trim()) { setLoading(false); return alert('タイトルまたはDOIを入力してください') }
        if (isAdmin) {
          const { data: pub } = await sb.from('publications').insert({
            type: pubType, title: pubTitle, doi: pubDoi || null, isbn: pubIsbn || null,
            publisher: pubPublisher || null, year: pubYear ? parseInt(pubYear) : null,
            authors: pubAuthors || null, url: pubUrl || null,
          }).select('id').single()
          if (pub) {
            await sb.from('lab_publications').insert({
              lab_id: labId, publication_id: (pub as { id: string }).id,
              faculty_id: facId, added_by: userName, added_at: now,
            })
          }
        } else {
          await sb.from('admin_logs').insert({
            target_type: 'faculty', target_id: facId, lab_id: labId,
            field: 'publication', new_value: `[出版物] ${pubTitle} / DOI:${pubDoi}`,
            contributor: userName, status: 'pending',
          })
        }

      } else if (target === 'lab') {
        const def = LAB_FIELDS[labFieldKey]
        if (MULTI_FIELDS.includes(labFieldKey)) {
          const validUrls = multiUrls.map(u => u.trim()).filter(u => u.length > 0)
          if (validUrls.length === 0) { setLoading(false); return alert('URLを1つ以上入力してください') }
          if (isAdmin) {
            const { data: current } = await sb.from('labs').select(def.col).eq('id', labId).single()
            const oldVal   = (current as Record<string, unknown> | null)?.[def.col]
            const existing = Array.isArray(oldVal) ? (oldVal as string[]) : []
            const dupes    = validUrls.filter(u => existing.includes(u))
            if (dupes.length > 0) { setLoading(false); return alert(`すでに登録済みのURLが含まれています:\n${dupes.join('\n')}`) }
            await sb.from('labs').update({ [def.col]: [...existing, ...validUrls], updated_at: now }).eq('id', labId)
          }
          const logLab = labs.find(l => l.id === labId)
          await sb.from('admin_logs').insert({
            target_type: 'lab', target_id: labId, lab_id: labId,
            field: labFieldKey, old_value: null, new_value: validUrls.join('\n'),
            contributor: userName, status: isAdmin ? 'approved' : 'pending',
          })
          await fetch('/api/admin/notify', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              targetType: 'lab', labName: logLab?.name ?? '',
              fieldLabel: LAB_FIELDS[labFieldKey]?.label ?? '',
              newValue: validUrls.join('\n'), oldValue: null,
              contributor: userName, isPending: !isAdmin,
            }),
          })
        } else {
          const saveValue = def.isUrl
            ? urlInput.trim()
            : (inputMode === 'manual' ? manualText.trim() : (aiResult.trim() || urlInput.trim()))
          if (!saveValue) { setLoading(false); return alert('内容を入力してください') }
          let oldValStr = ''
          if (isAdmin) {
            const { data: current } = await sb.from('labs').select(def.col).eq('id', labId).single()
            const oldVal = (current as Record<string, unknown> | null)?.[def.col]
            oldValStr = typeof oldVal === 'string' && oldVal.length > 1000 ? oldVal.slice(0, 1000) + '…' : String(oldVal ?? '')
            const update: Record<string, unknown> = { [def.col]: saveValue, updated_at: now }
            if (def.hasSource && sourceUrl) update['summary_source_url'] = sourceUrl
            if (def.hasYear && yearVal) { update['student_count_year'] = yearVal; update['student_count_source'] = sourceUrl }
            await sb.from('labs').update(update).eq('id', labId)
          }
          const logLab = labs.find(l => l.id === labId)
          await sb.from('admin_logs').insert({
            target_type: 'lab', target_id: labId, lab_id: labId,
            field: labFieldKey, old_value: isAdmin ? oldValStr : null,
            new_value: saveValue, contributor: userName, status: isAdmin ? 'approved' : 'pending',
          })
          await fetch('/api/admin/notify', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              targetType: 'lab', labName: logLab?.name ?? '',
              fieldLabel: LAB_FIELDS[labFieldKey]?.label ?? '',
              newValue: saveValue, oldValue: isAdmin ? oldValStr : null,
              contributor: userName, isPending: !isAdmin,
            }),
          })
        }

      } else {
        const def = FACULTY_FIELDS[facFieldKey]
        const saveValue = def.isUrl
          ? urlInput.trim()
          : (inputMode === 'manual' ? manualText.trim() : (aiResult.trim() || urlInput.trim()))
        let value = saveValue
        if (def.col === 'researchmap_id' && value.includes('researchmap.jp/'))
          value = value.split('researchmap.jp/').pop()?.split('/')[0] ?? value
        if (['x_username', 'instagram_username'].includes(facFieldKey))
          value = value.replace(/^@/, '')
        if (!value) { setLoading(false); return alert('内容を入力してください') }
        let oldValStr = ''
        if (isAdmin) {
          const { data: current } = await sb.from('faculties').select(def.col).eq('id', facId).single()
          const oldVal = (current as Record<string, unknown> | null)?.[def.col]
          oldValStr = typeof oldVal === 'string' ? oldVal : String(oldVal ?? '')
          await sb.from('faculties').update({ [def.col]: value, updated_at: now }).eq('id', facId)
        }
        const logLab = labs.find(l => l.id === labId)
        const logFac = faculties.find(f => f.id === facId)
        await sb.from('admin_logs').insert({
          target_type: 'faculty', target_id: facId, lab_id: labId,
          field: facFieldKey, old_value: isAdmin ? oldValStr : null,
          new_value: value, contributor: userName, status: isAdmin ? 'approved' : 'pending',
        })
        await fetch('/api/admin/notify', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            targetType: 'faculty',
            labName: `${logLab?.name ?? ''} / ${logFac?.name ?? ''}`,
            fieldLabel: FACULTY_FIELDS[facFieldKey]?.label ?? '',
            newValue: value, oldValue: isAdmin ? oldValStr : null,
            contributor: userName, isPending: !isAdmin,
          }),
        })
      }

      setSaved(true)
      setTimeout(() => {
        setSaved(false); resetInput()
        setPubTitle(''); setPubDoi(''); setPubIsbn(''); setPubPublisher('')
        setPubYear(''); setPubAuthors(''); setPubUrl('')
      }, 2000)

    } finally { setLoading(false) }
  }

  const labDef     = LAB_FIELDS[labFieldKey]
  const facDef     = FACULTY_FIELDS[facFieldKey]
  const isPub      = target === 'faculty' && facFieldKey === 'publication'
  const isMulti    = target === 'lab' && MULTI_FIELDS.includes(labFieldKey)
  const isUrl      = target === 'lab' ? !!labDef?.isUrl : !!facDef?.isUrl
  const isImage    = target === 'lab' ? !!labDef?.isImage : false
  // superadmin も admin 権限で動作
  const isAdmin    = userRole === 'admin' || userRole === 'superadmin'
  const isSuperAdmin = userRole === 'superadmin'

  // ロールバッジの表示設定
  const roleBadge = {
    superadmin: { icon:'👑', label:'superadmin', bg:'#EFF6FF', color:'#1D4ED8', border:'#BFDBFE' },
    admin:      { icon:'🔑', label:'admin',      bg:'#F0FDF4', color:'#16A34A', border:'#BBF7D0' },
    contributor:{ icon:'✏️', label:'contributor', bg:'#F9FAFB', color:'#6B7280', border:'#E5E7EB' },
  }[userRole]

  // ── ログイン画面
  if (!authed) return (
    <main style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#F9FAFB', fontFamily:font }}>
      <div style={{ background:'white', borderRadius:16, padding:'32px 28px', width:380, border:'1px solid #E5E7EB' }}>
        <h1 style={{ fontSize:17, fontWeight:800, margin:'0 0 4px' }}>データ投入</h1>
        <p style={{ fontSize:12, color:'#9CA3AF', margin:'0 0 24px' }}>ログインして情報を提供・更新できます</p>

        {/* Clerkログイン（メイン） */}
        <div style={{ marginBottom:20 }}>
          <p style={{ fontSize:11, fontWeight:700, color:'#6B7280', margin:'0 0 8px' }}>Clerkアカウントをお持ちの方</p>
          {!isLoaded ? (
            <p style={{ fontSize:12, color:'#9CA3AF' }}>読み込み中...</p>
          ) : user ? (
            <div style={{ background:'#F0FDF4', border:'1px solid #BBF7D0', borderRadius:10, padding:'12px 14px', display:'flex', alignItems:'center', gap:10 }}>
              <div style={{ width:36, height:36, borderRadius:'50%', background:'#16A34A', display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontSize:14, fontWeight:700, flexShrink:0 }}>
                {(user.fullName ?? user.username ?? '?').slice(0,1).toUpperCase()}
              </div>
              <div style={{ flex:1 }}>
                <p style={{ fontSize:13, fontWeight:700, color:'#15803D', margin:'0 0 2px' }}>{user.fullName ?? user.username}</p>
                <p style={{ fontSize:11, color:'#16A34A', margin:0 }}>{user.emailAddresses[0]?.emailAddress}</p>
              </div>
              <button onClick={handleClerkLogin}
                style={{ padding:'7px 14px', borderRadius:8, border:'none', background:'#16A34A', color:'white', fontSize:12, fontWeight:700, cursor:'pointer' }}>
                このアカウントで入る
              </button>
            </div>
          ) : (
            <SignInButton mode="modal">
              <button style={{ width:'100%', padding:'11px', borderRadius:8, border:'1.5px solid #E5E7EB', background:'white', fontSize:13, fontWeight:600, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
                <span style={{ fontSize:16 }}>🔐</span> Clerkでログイン
              </button>
            </SignInButton>
          )}
        </div>

        {/* 区切り */}
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:20 }}>
          <div style={{ flex:1, height:1, background:'#E5E7EB' }} />
          <span style={{ fontSize:11, color:'#9CA3AF' }}>または</span>
          <div style={{ flex:1, height:1, background:'#E5E7EB' }} />
        </div>

        {/* パスワードログイン（外部協力者向け） */}
        <div>
          <p style={{ fontSize:11, fontWeight:700, color:'#6B7280', margin:'0 0 8px' }}>Clerkアカウントをお持ちでない方（外部協力者）</p>
          <div style={{ display:'flex', gap:6, marginBottom:12 }}>
            {(['contributor','admin'] as const).map(m => (
              <button key={m} onClick={() => { setLoginMode(m); setLoginError('') }}
                style={{ flex:1, padding:'7px', borderRadius:7, cursor:'pointer', fontSize:11,
                  border:`1.5px solid ${loginMode===m ? '#3B82F6' : '#E5E7EB'}`,
                  background: loginMode===m ? '#EFF6FF' : 'white',
                  color: loginMode===m ? '#1D4ED8' : '#6B7280', fontWeight: loginMode===m ? 700 : 400 }}>
                {m === 'admin' ? '👑 管理者' : '✏️ 情報提供者'}
              </button>
            ))}
          </div>

          {loginMode === 'contributor' && (
            <div style={{ marginBottom:10 }}>
              <input placeholder="名前を入力（例: 山田太郎）" value={nameInput}
                onChange={e => setNameInput(e.target.value)} style={inp} />
            </div>
          )}
          {loginMode === 'admin' && (
            <div style={{ marginBottom:10 }}>
              {!showNewAdmin ? (
                <div style={{ display:'flex', gap:8 }}>
                  <select value={adminSelect} onChange={e => setAdminSelect(e.target.value)} style={{ ...sel, flex:1 }}>
                    <option value="">── 選択してください ──</option>
                    {adminNames.map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                  <button onClick={() => { setShowNewAdmin(true); setAdminSelect('') }}
                    style={{ padding:'9px 12px', borderRadius:8, border:'1px solid #E5E7EB', background:'white', fontSize:12, cursor:'pointer', whiteSpace:'nowrap' }}>
                    ＋ 新規
                  </button>
                </div>
              ) : (
                <div style={{ display:'flex', gap:8 }}>
                  <input placeholder="新しい管理者名" value={newAdminName}
                    onChange={e => setNewAdminName(e.target.value)} style={{ ...inp, flex:1 }} />
                  <button onClick={() => { setShowNewAdmin(false); setNewAdminName('') }}
                    style={{ padding:'9px 12px', borderRadius:8, border:'1px solid #E5E7EB', background:'white', fontSize:12, cursor:'pointer', whiteSpace:'nowrap' }}>
                    戻る
                  </button>
                </div>
              )}
            </div>
          )}

          <input type="password" placeholder="パスワード" value={pw}
            onChange={e => setPw(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
            style={{ ...inp, marginBottom:8, borderColor: loginError ? '#EF4444' : '#E5E7EB' }} />
          {loginError && <p style={{ fontSize:12, color:'#EF4444', margin:'0 0 8px' }}>{loginError}</p>}
          <button onClick={handleLogin}
            style={{ width:'100%', padding:'10px', borderRadius:8, border:'none', background:'#6B7280', color:'white', fontSize:13, fontWeight:700, cursor:'pointer' }}>
            パスワードでログイン
          </button>
        </div>
      </div>
    </main>
  )

  // ── メイン画面
  return (
    <main style={{ minHeight:'100vh', background:'#F9FAFB', fontFamily:font }}>
      <header style={{ background:'white', borderBottom:'1px solid #E5E7EB', padding:'12px 16px', display:'flex', alignItems:'center', justifyContent:'space-between', position:'sticky', top:0, zIndex:10 }}>
        <div>
          <span style={{ fontSize:15, fontWeight:800 }}>📥 データ投入</span>
          <span style={{ fontSize:11, color:'#9CA3AF', marginLeft:8 }}>研究室DBの更新</span>
        </div>
        <div style={{ display:'flex', gap:6, alignItems:'center', flexWrap:'wrap' }}>
          {/* ロールバッジ */}
          <span style={{ fontSize:12, padding:'4px 10px', borderRadius:20,
            background: roleBadge.bg, color: roleBadge.color,
            border: `1px solid ${roleBadge.border}`, fontWeight:700 }}>
            {roleBadge.icon} {userName}
          </span>
          {/* superadmin: メンバー管理 */}
          {isSuperAdmin && (
            <a href="/admin/data/members" style={{ fontSize:12, color:'#7C3AED', textDecoration:'none', padding:'5px 10px', borderRadius:7, border:'1px solid #DDD6FE', background:'#F5F3FF', fontWeight:600 }}>
              👥 メンバー管理
            </a>
          )}
          {/* admin以上: 承認待ち確認 */}
          {isAdmin && (
            <a href="/admin/data/review" style={{ fontSize:12, color:'#D97706', textDecoration:'none', padding:'5px 10px', borderRadius:7, border:'1px solid #FDE68A', background:'#FFFBEB', fontWeight:600 }}>
              📋 承認待ち確認
            </a>
          )}
          <a href="/admin" style={{ fontSize:12, color:'#6B7280', textDecoration:'none', padding:'5px 10px', borderRadius:7, border:'1px solid #E5E7EB' }}>管理画面</a>
          <a href="/"      style={{ fontSize:12, color:'#6B7280', textDecoration:'none', padding:'5px 10px', borderRadius:7, border:'1px solid #E5E7EB' }}>マップ</a>
        </div>
      </header>

      {/* contributorへの案内バナー */}
      {!isAdmin && (
        <div style={{ background:'#FFFBEB', borderBottom:'1px solid #FDE68A', padding:'10px 16px', textAlign:'center' }}>
          <p style={{ fontSize:12, color:'#92400E', margin:0 }}>
            ✏️ あなたが送った情報は <strong>管理者の承認後</strong> にDBに反映されます
          </p>
        </div>
      )}

      <div style={{ maxWidth:600, margin:'0 auto', padding:'16px 14px 60px' }}>

        {/* ① 研究室選択 */}
        <div style={card}>
          <Label text="① 研究室を選択" />
          <input placeholder="研究室名・教員名・専攻で絞り込み" value={query}
            onChange={e => setQuery(e.target.value)} style={{ ...inp, marginBottom:8 }} />
          <select value={labId} onChange={e => { setLabId(e.target.value); resetInput() }} style={sel}>
            <option value="">── 研究室を選んでください（{filtered.length}件） ──</option>
            {filtered.map(l => (
              <option key={l.id} value={l.id}>
                {l.name}　{l.faculty_name ? `/ ${l.faculty_name}` : ''}　{l.dept ? `【${l.dept}】` : ''}
              </option>
            ))}
          </select>
        </div>

        {labId && (<>

          {/* ② 対象 */}
          <div style={card}>
            <Label text="② 何の情報を更新しますか？" />
            <div style={{ display:'flex', gap:8 }}>
              {(['lab','faculty'] as Target[]).map(t => (
                <button key={t} onClick={() => { setTarget(t); resetInput() }}
                  style={{ flex:1, padding:'11px', borderRadius:8, cursor:'pointer', fontSize:13,
                    border:`1.5px solid ${target===t ? '#3B82F6' : '#E5E7EB'}`,
                    background: target===t ? '#EFF6FF' : 'white',
                    color: target===t ? '#1D4ED8' : '#374151', fontWeight: target===t ? 700 : 400 }}>
                  {t === 'lab' ? '🏫 研究室の情報' : '👤 特定の教員の情報'}
                </button>
              ))}
            </div>
          </div>

          {/* 教員選択 */}
          {target === 'faculty' && (
            <div style={card}>
              <Label text="③-a どの教員の情報ですか？" />
              {faculties.length === 0
                ? <p style={{ fontSize:12, color:'#9CA3AF', margin:0 }}>読み込み中...</p>
                : <select value={facId} onChange={e => { setFacId(e.target.value); resetInput() }} style={sel}>
                    <option value="">── 教員を選んでください（{faculties.length}名） ──</option>
                    {faculties.map(fc => (
                      <option key={fc.id} value={fc.id}>
                        {fc.name}　{fc.role ? `（${fc.role}）` : ''}　{fc.researchmap_id ? '✓RM登録済' : ''}
                      </option>
                    ))}
                  </select>
              }
            </div>
          )}

          {/* ③ フィールド選択 */}
          {(target === 'lab' || (target === 'faculty' && facId)) && (
            <div style={card}>
              <Label text={target === 'lab' ? '③ どの情報を追加・更新しますか？' : '③-b どの情報を追加・更新しますか？'} />
              {target === 'lab' ? (
                <select value={labFieldKey} onChange={e => { setLabFieldKey(e.target.value); resetInput() }} style={sel}>
                  <optgroup label="── 基本情報 ──">
                    {Object.entries(LAB_FIELDS).filter(([,v]) => v.group==='basic').map(([k,v]) => <option key={k} value={k}>{v.label}</option>)}
                  </optgroup>
                  <optgroup label="── SNS・動画 ──">
                    {Object.entries(LAB_FIELDS).filter(([,v]) => v.group==='sns').map(([k,v]) => <option key={k} value={k}>{v.label}</option>)}
                  </optgroup>
                </select>
              ) : (
                <select value={facFieldKey} onChange={e => { setFacFieldKey(e.target.value); resetInput() }} style={sel}>
                  <optgroup label="── SNS ──">
                    {Object.entries(FACULTY_FIELDS).filter(([,v]) => v.group==='sns').map(([k,v]) => <option key={k} value={k}>{v.label}</option>)}
                  </optgroup>
                  <optgroup label="── 研究情報 ──">
                    {Object.entries(FACULTY_FIELDS).filter(([,v]) => v.group==='research').map(([k,v]) => <option key={k} value={k}>{v.label}</option>)}
                  </optgroup>
                </select>
              )}
              {target === 'faculty' && facDef?.hint && (
                <p style={{ fontSize:11, color:'#9CA3AF', margin:'6px 0 0' }}>💡 {facDef.hint}</p>
              )}
              {currentVal && !isPub && (
                <div style={{ marginTop:10, background:'#F9FAFB', borderRadius:8, padding:'8px 10px', border:'1px solid #E5E7EB' }}>
                  <p style={{ fontSize:10, color:'#9CA3AF', margin:'0 0 3px', fontWeight:700 }}>現在保存されている値</p>
                  <p style={{ fontSize:12, color:'#374151', margin:0, wordBreak:'break-all', lineHeight:1.6 }}>
                    {currentVal.length > 200 ? currentVal.slice(0,200)+'…' : currentVal}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* ④ 入力エリア */}
          {(target === 'lab' || (target === 'faculty' && facId)) && (
            <div style={card}>
              <Label text="④ 情報をどうやって入力しますか？" />

              {isPub ? (
                <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                  <div style={{ display:'flex', gap:8 }}>
                    {(['paper','book','other'] as PubType[]).map(pt => (
                      <button key={pt} onClick={() => setPubType(pt)}
                        style={{ flex:1, padding:'9px', borderRadius:8, cursor:'pointer', fontSize:12,
                          border:`1.5px solid ${pubType===pt ? '#3B82F6' : '#E5E7EB'}`,
                          background: pubType===pt ? '#EFF6FF' : 'white',
                          color: pubType===pt ? '#1D4ED8' : '#374151', fontWeight: pubType===pt ? 700 : 400 }}>
                        {pt==='paper' ? '📄 論文' : pt==='book' ? '📚 著書' : '🔗 その他'}
                      </button>
                    ))}
                  </div>
                  <input placeholder="タイトル *" value={pubTitle} onChange={e => setPubTitle(e.target.value)} style={inp} />
                  <input placeholder="著者（例: 山田太郎, 鈴木花子）" value={pubAuthors} onChange={e => setPubAuthors(e.target.value)} style={inp} />
                  <input placeholder="発行年（例: 2023）" value={pubYear} onChange={e => setPubYear(e.target.value)} style={inp} type="number" />
                  {pubType === 'paper' && <input placeholder="DOI（例: 10.1234/abcd.efgh）" value={pubDoi} onChange={e => setPubDoi(e.target.value)} style={inp} />}
                  {pubType === 'book' && (<>
                    <input placeholder="ISBN（例: 978-4-XXXXXXXXXX）" value={pubIsbn} onChange={e => setPubIsbn(e.target.value)} style={inp} />
                    <input placeholder="出版社名" value={pubPublisher} onChange={e => setPubPublisher(e.target.value)} style={inp} />
                  </>)}
                  <input placeholder="URL（任意）" value={pubUrl} onChange={e => setPubUrl(e.target.value)} style={inp} type="url" />
                </div>

              ) : isMulti ? (
                <div>
                  <p style={{ fontSize:12, color:'#6B7280', margin:'0 0 10px', lineHeight:1.6 }}>
                    URLを入力してください。<span style={{ color:'#3B82F6', fontWeight:600 }}>「＋ URLを追加」で複数まとめて保存できます。</span>
                  </p>
                  <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                    {multiUrls.map((u, i) => (
                      <div key={i} style={{ display:'flex', gap:8, alignItems:'center' }}>
                        <input type="url" placeholder={`URL ${i + 1}`} value={u}
                          onChange={e => { const next = [...multiUrls]; next[i] = e.target.value; setMultiUrls(next) }}
                          style={{ ...inp, flex:1 }} />
                        {multiUrls.length > 1 && (
                          <button onClick={() => setMultiUrls(multiUrls.filter((_, j) => j !== i))}
                            style={{ padding:'8px 12px', borderRadius:8, border:'1px solid #FCA5A5', background:'#FEF2F2', color:'#EF4444', fontSize:13, cursor:'pointer', flexShrink:0 }}>✕</button>
                        )}
                      </div>
                    ))}
                  </div>
                  <button onClick={() => setMultiUrls([...multiUrls, ''])}
                    style={{ marginTop:10, width:'100%', padding:'9px', borderRadius:8, border:'1.5px dashed #93C5FD', background:'#EFF6FF', color:'#1D4ED8', fontSize:13, fontWeight:600, cursor:'pointer' }}>
                    ＋ URLを追加
                  </button>
                </div>

              ) : isUrl ? (
                <div>
                  <p style={{ fontSize:12, color:'#6B7280', margin:'0 0 8px', lineHeight:1.6 }}>URLをそのまま貼り付けてください。</p>
                  <input type="url" placeholder="https://..." value={urlInput} onChange={e => setUrlInput(e.target.value)} style={inp} />
                </div>

              ) : (<>
                <div style={{ display:'grid', gridTemplateColumns: isImage ? '1fr 1fr 1fr' : '1fr 1fr', gap:8, marginBottom:14 }}>
                  <ModeBtn active={inputMode==='url'} onClick={() => setInputMode('url')} icon="🔗" title="URLから取得" desc="HPのURLを貼ると、AIが内容を読んでテキストを自動で取り出します" />
                  {isImage && <ModeBtn active={inputMode==='screenshot'} onClick={() => setInputMode('screenshot')} icon="📸" title="画像から取得" desc="スクショをアップすると、AIが画像の文字を読み取ります" />}
                  <ModeBtn active={inputMode==='manual'} onClick={() => setInputMode('manual')} icon="✏️" title="直接入力" desc="テキストをそのままここに入力します" />
                </div>
                {inputMode === 'url' && (
                  <div>
                    <input type="url" placeholder="https://..." value={urlInput} onChange={e => setUrlInput(e.target.value)} style={{ ...inp, marginBottom:8 }} />
                    <button onClick={handleFetchUrl} disabled={loading || !urlInput.trim()}
                      style={{ width:'100%', padding:'10px', borderRadius:8, border:'none',
                        background: urlInput.trim() ? '#1D4ED8' : '#E5E7EB', color: urlInput.trim() ? 'white' : '#9CA3AF',
                        fontSize:13, fontWeight:600, cursor: (!urlInput.trim() || loading) ? 'not-allowed' : 'pointer' }}>
                      {loading ? '⏳ AIが読み取り中...' : '🤖 AIでテキストを取り出す'}
                    </button>
                    {aiResult && (
                      <div style={{ marginTop:10 }}>
                        <p style={{ fontSize:11, color:'#1D4ED8', fontWeight:700, margin:'0 0 4px' }}>✅ 取り出し結果（編集できます）</p>
                        <textarea value={aiResult} onChange={e => setAiResult(e.target.value)} rows={6} style={{ ...inp, resize:'vertical', lineHeight:1.7 }} />
                      </div>
                    )}
                  </div>
                )}
                {inputMode === 'screenshot' && (
                  <div>
                    <input type="file" accept="image/*" onChange={e => setImgFile(e.target.files?.[0] ?? null)} style={{ fontSize:13, marginBottom:8 }} />
                    <button onClick={handleOcr} disabled={loading || !imgFile}
                      style={{ width:'100%', padding:'10px', borderRadius:8, border:'none',
                        background: imgFile ? '#1D4ED8' : '#E5E7EB', color: imgFile ? 'white' : '#9CA3AF',
                        fontSize:13, fontWeight:600, cursor: (!imgFile || loading) ? 'not-allowed' : 'pointer' }}>
                      {loading ? '⏳ 読み取り中...' : '🤖 画像のテキストを読み取る'}
                    </button>
                    {aiResult && (
                      <div style={{ marginTop:10 }}>
                        <p style={{ fontSize:11, color:'#1D4ED8', fontWeight:700, margin:'0 0 4px' }}>✅ 読み取り結果（編集できます）</p>
                        <textarea value={aiResult} onChange={e => setAiResult(e.target.value)} rows={6} style={{ ...inp, resize:'vertical', lineHeight:1.7 }} />
                      </div>
                    )}
                  </div>
                )}
                {inputMode === 'manual' && (
                  <textarea value={manualText} onChange={e => setManualText(e.target.value)} rows={6}
                    placeholder="ここにテキストを入力してください..." style={{ ...inp, resize:'vertical', lineHeight:1.7 }} />
                )}
              </>)}

              {!isPub && !isUrl && !isMulti && labDef?.hasSource && (
                <div style={{ marginTop:12, paddingTop:12, borderTop:'1px solid #F3F4F6' }}>
                  <Label text="出典URL（どこから取得した情報か）" hint="任意" />
                  <input type="url" placeholder="https://..." value={sourceUrl} onChange={e => setSourceUrl(e.target.value)} style={inp} />
                </div>
              )}
              {!isPub && !isMulti && labDef?.hasYear && (
                <div style={{ marginTop:10 }}>
                  <Label text="何年度の情報ですか？" hint="例: 2024年度" />
                  <input placeholder="2024年度" value={yearVal} onChange={e => setYearVal(e.target.value)} style={inp} />
                </div>
              )}
            </div>
          )}

          {/* 保存ボタン */}
          {(target === 'lab' || (target === 'faculty' && facId)) && (
            <button onClick={handleSave} disabled={loading || saveBlocked}
              style={{ width:'100%', padding:'14px', borderRadius:10, border:'none',
                background: saveBlocked ? '#9CA3AF' : saved ? '#16A34A' : (isAdmin ? '#1D4ED8' : '#059669'),
                color:'white', fontSize:15, fontWeight:700,
                cursor: (loading || saveBlocked) ? 'not-allowed' : 'pointer', transition:'background 0.3s' }}>
              {saveBlocked ? '🚫 しばらく待ってください'
                : saved ? (isAdmin ? '✅ 保存しました！' : '📬 提案を送りました！')
                : loading ? '⏳ 処理中...'
                : (isAdmin ? '💾 DBに保存する' : '📬 管理者に提案する')}
            </button>
          )}

        </>)}
      </div>
    </main>
  )
}