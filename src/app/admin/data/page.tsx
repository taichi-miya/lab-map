'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// ── 型 ──────────────────────────────────────────────────────────
type Lab        = { id: string; name: string; faculty_name: string | null; dept: string | null }
type Faculty    = { id: string; name: string; role: string | null; researchmap_id: string | null }
type Target     = 'lab' | 'faculty'
type InputMode  = 'url' | 'screenshot' | 'manual'
type PubType    = 'paper' | 'book' | 'other'

// ── 研究室フィールド定義 ─────────────────────────────────────────
type LabFieldDef = {
  label:      string
  col:        string
  group:      'basic' | 'sns'
  hasSource?: boolean
  hasYear?:   boolean
  isUrl?:     boolean
  isImage?:   boolean
}
const LAB_FIELDS: Record<string, LabFieldDef> = {
  summary_text:        { label:'📝 研究概要テキスト（HPから）',           col:'summary_text',        group:'basic', hasSource:true },
  summary_text_image:  { label:'📷 研究概要テキスト（スクショから）',     col:'summary_text',        group:'basic', hasSource:true, isImage:true },
  lab_url:             { label:'🔗 公式HPのURL',                         col:'lab_url',             group:'basic', isUrl:true },
  intro_url:           { label:'🔗 紹介ページのURL（研究科HP等）',        col:'intro_url',           group:'basic', isUrl:true },
  faculty_name:        { label:'👤 教員名',                              col:'faculty_name',        group:'basic', hasSource:true },
  student_count:       { label:'👥 学生数（年度・出典つき）',             col:'student_count',       group:'basic', hasSource:true, hasYear:true },
  instagram_url:       { label:'📷 公式 Instagram URL',                 col:'instagram_url',       group:'sns',   isUrl:true },
  twitter_url:         { label:'🐦 公式 X（Twitter）URL',               col:'twitter_url',         group:'sns',   isUrl:true },
  youtube_channel_url: { label:'▶️  公式 YouTube チャンネル URL',        col:'youtube_channel_url', group:'sns',   isUrl:true },
  youtube_video_urls:  { label:'▶️  紹介 YouTube 動画 URL（非公式）',    col:'youtube_video_urls',  group:'sns',   isUrl:true },
  instagram_url_other: { label:'📷 紹介 Instagram URL（非公式）',        col:'instagram_url_other', group:'sns',   isUrl:true },
  twitter_url_other:   { label:'🐦 紹介 X URL（非公式）',               col:'twitter_url_other',   group:'sns',   isUrl:true },
}

// 複数OKなフィールド（jsonb配列に追記するもの）
const MULTI_FIELDS = ['youtube_video_urls', 'instagram_url_other', 'twitter_url_other']

// ── 教員フィールド定義 ─────────────────────────────────────────
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
const card: React.CSSProperties = {
  background:'white', border:'1px solid #E5E7EB', borderRadius:12,
  padding:'16px 18px', marginBottom:12,
}
const inp: React.CSSProperties = {
  width:'100%', padding:'9px 12px', borderRadius:8,
  border:'1px solid #E5E7EB', fontSize:13,
  boxSizing:'border-box', outline:'none', fontFamily:font,
}
const sel: React.CSSProperties = { ...inp, background:'white', cursor:'pointer' }

function Label({ text, hint }: { text: string; hint?: string }) {
  return (
    <p style={{ fontSize:11, fontWeight:700, color:'#6B7280', margin:'0 0 8px', letterSpacing:'0.04em' }}>
      {text}
      {hint && <span style={{ fontWeight:400, marginLeft:6, color:'#9CA3AF' }}>（{hint}）</span>}
    </p>
  )
}

function ModeBtn({ active, onClick, icon, title, desc }: {
  active: boolean; onClick: () => void; icon: string; title: string; desc: string
}) {
  return (
    <button onClick={onClick} style={{
      padding:'10px 12px', borderRadius:8, cursor:'pointer', textAlign:'left', width:'100%',
      border:`1.5px solid ${active ? '#3B82F6' : '#E5E7EB'}`,
      background: active ? '#EFF6FF' : 'white',
    }}>
      <p style={{ fontSize:13, fontWeight:active ? 700 : 500, color:active ? '#1D4ED8' : '#374151', margin:'0 0 2px' }}>
        {icon} {title}
      </p>
      <p style={{ fontSize:11, color:active ? '#3B82F6' : '#9CA3AF', margin:0, lineHeight:1.4 }}>{desc}</p>
    </button>
  )
}

// ════════════════════════════════════════════════════════════════
export default function AdminDataPage() {
  const [authed,       setAuthed]       = useState(false)
  const [pw,           setPw]           = useState('')
  const [loginError,   setLoginError]   = useState(false)
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
  // 出版物
  const [pubType,      setPubType]      = useState<PubType>('paper')
  const [pubTitle,     setPubTitle]     = useState('')
  const [pubDoi,       setPubDoi]       = useState('')
  const [pubIsbn,      setPubIsbn]      = useState('')
  const [pubPublisher, setPubPublisher] = useState('')
  const [pubYear,      setPubYear]      = useState('')
  const [pubAuthors,   setPubAuthors]   = useState('')
  const [pubUrl,       setPubUrl]       = useState('')
  // 更新者
  const [contributors, setContributors] = useState<string[]>([])
  const [contributor,  setContributor]  = useState('')
  const [showNewC,     setShowNewC]     = useState(false)
  const [newContrib,   setNewContrib]   = useState('')

  useEffect(() => { if (authed) { fetchLabs(); fetchContributors() } }, [authed])

  useEffect(() => {
    setFacId(''); setFaculties([]); resetInput()
    if (labId && target === 'faculty') fetchFaculties(labId)
    if (labId && target === 'lab')     fetchCurrentLabVal(labId, labFieldKey)
  }, [labId, target])

  useEffect(() => {
    if (labId && target === 'lab') fetchCurrentLabVal(labId, labFieldKey)
    resetInput()
  }, [labFieldKey])

  useEffect(() => {
    if (facId) fetchCurrentFacVal(facId, facFieldKey)
    resetInput()
  }, [facId, facFieldKey])

  function resetInput() {
    setUrlInput(''); setManualText(''); setAiResult('')
    setImgFile(null); setSourceUrl(''); setYearVal('')
  }

  async function handleLogin() {
    const res = await fetch('/api/admin/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: pw }),
    })
    if (res.ok) {
      setAuthed(true)
    } else {
      setLoginError(true)
      setTimeout(() => setLoginError(false), 2000)
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
    const def = LAB_FIELDS[key]
    if (!def) return
    const { data } = await sb.from('labs').select(def.col).eq('id', lId).single()
    setCurrentVal((data as Record<string, string> | null)?.[def.col] ?? '')
  }
  async function fetchCurrentFacVal(fId: string, key: string) {
    const def = FACULTY_FIELDS[key]
    if (!def || def.col === '__pub__') return
    const { data } = await sb.from('faculties').select(def.col).eq('id', fId).single()
    setCurrentVal((data as Record<string, string> | null)?.[def.col] ?? '')
  }
  async function fetchContributors() {
    const { data } = await sb.from('contributors').select('name').order('name')
    if (data) setContributors(data.map((d: { name: string }) => d.name))
  }

  const filtered = labs.filter(l =>
    l.name.includes(query) ||
    (l.faculty_name ?? '').includes(query) ||
    (l.dept ?? '').includes(query)
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

  async function resolveContributor(): Promise<string> {
    if (showNewC && newContrib.trim()) {
      await sb.from('contributors').upsert({ name: newContrib.trim() }, { onConflict: 'name' })
      await fetchContributors()
      return newContrib.trim()
    }
    return contributor
  }

  // ── 保存
  async function handleSave() {
    if (saveBlocked) return alert('短時間に保存が多すぎます。少し待ってから試してください。')
    const newCount = saveCount + 1
    setSaveCount(newCount)
    if (newCount >= 10) {
      setSaveBlocked(true)
      setTimeout(() => { setSaveBlocked(false); setSaveCount(0) }, 60_000)
    }

    if (!labId) return alert('研究室を選択してください')
    if (target === 'faculty' && !facId) return alert('教員を選択してください')

    const by  = await resolveContributor()
    const now = new Date().toISOString()
    setLoading(true)

    try {
      if (target === 'faculty' && facFieldKey === 'publication') {
        // ── 出版物
        if (!pubTitle.trim() && !pubDoi.trim()) {
          setLoading(false)
          return alert('タイトルまたはDOIを入力してください')
        }
        const { data: pub } = await sb.from('publications').insert({
          type: pubType, title: pubTitle, doi: pubDoi || null,
          isbn: pubIsbn || null, publisher: pubPublisher || null,
          year: pubYear ? parseInt(pubYear) : null,
          authors: pubAuthors || null, url: pubUrl || null,
        }).select('id').single()
        if (pub) {
          await sb.from('lab_publications').insert({
            lab_id: labId, publication_id: (pub as { id: string }).id,
            faculty_id: facId, added_by: by, added_at: now,
          })
        }

      } else if (target === 'lab') {
        // ── 研究室フィールド
        const def = LAB_FIELDS[labFieldKey]
        const saveValue = def.isUrl
          ? urlInput.trim()
          : (inputMode === 'manual' ? manualText.trim() : (aiResult.trim() || urlInput.trim()))
        if (!saveValue) { setLoading(false); return alert('内容を入力してください') }

        // old_value を取得
        const { data: current } = await sb.from('labs').select(def.col).eq('id', labId).single()
        const oldVal = (current as Record<string, unknown> | null)?.[def.col]

        if (MULTI_FIELDS.includes(labFieldKey)) {
          // 複数OKなフィールド → jsonb配列に追記
          const existing: string[] = Array.isArray(oldVal) ? (oldVal as string[]) : []
          if (existing.includes(saveValue)) {
            setLoading(false)
            return alert('同じURLがすでに登録されています')
          }
          const updated = [...existing, saveValue]
          // ※ JSON.stringify不要：Supabaseクライアントが配列をjsonbとして送る
          await sb.from('labs')
            .update({ [def.col]: updated, updated_at: now })
            .eq('id', labId)
        } else {
          // 通常フィールド → 上書き
          const update: Record<string, unknown> = { [def.col]: saveValue, updated_at: now }
          if (def.hasSource && sourceUrl) update['summary_source_url'] = sourceUrl
          if (def.hasYear && yearVal) {
            update['student_count_year']   = yearVal
            update['student_count_source'] = sourceUrl
          }
          await sb.from('labs').update(update).eq('id', labId)
        }

        // ── ログ記録
        const logField  = LAB_FIELDS[labFieldKey]?.label
        const logLab    = labs.find(l => l.id === labId)
        const oldValStr = MULTI_FIELDS.includes(labFieldKey)
          ? null
          : (typeof oldVal === 'string' && oldVal.length > 1000
              ? oldVal.slice(0, 1000) + '…'
              : String(oldVal ?? ''))
        await sb.from('admin_logs').insert({
          target_type: 'lab',
          target_id:   labId,
          lab_id:      labId,
          field:       labFieldKey,
          old_value:   oldValStr,
          new_value:   saveValue,
          contributor: by,
        })

        // ── Discord通知
        await fetch('/api/admin/notify', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            targetType:  'lab',
            labName:     logLab?.name ?? '',
            fieldLabel:  logField ?? '',
            newValue:    saveValue,
            oldValue:    MULTI_FIELDS.includes(labFieldKey) ? null : oldValStr,
            contributor: by,
          }),
        })

      } else {
        // ── 教員フィールド
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

        // old_value を取得
        const { data: current } = await sb.from('faculties').select(def.col).eq('id', facId).single()
        const oldVal    = (current as Record<string, unknown> | null)?.[def.col]
        const oldValStr = typeof oldVal === 'string' ? oldVal : String(oldVal ?? '')

        await sb.from('faculties').update({ [def.col]: value, updated_at: now }).eq('id', facId)

        // ── ログ記録
        const logField = FACULTY_FIELDS[facFieldKey]?.label
        const logLab   = labs.find(l => l.id === labId)
        const logFac   = faculties.find(f => f.id === facId)
        await sb.from('admin_logs').insert({
          target_type: 'faculty',
          target_id:   facId,
          lab_id:      labId,
          field:       facFieldKey,
          old_value:   oldValStr,
          new_value:   value,
          contributor: by,
        })

        // ── Discord通知
        await fetch('/api/admin/notify', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            targetType:  'faculty',
            labName:     `${logLab?.name ?? ''} / ${logFac?.name ?? ''}`,
            fieldLabel:  logField ?? '',
            newValue:    value,
            oldValue:    oldValStr,
            contributor: by,
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

  const labDef  = LAB_FIELDS[labFieldKey]
  const facDef  = FACULTY_FIELDS[facFieldKey]
  const isPub   = target === 'faculty' && facFieldKey === 'publication'
  const isUrl   = target === 'lab' ? !!labDef?.isUrl : !!facDef?.isUrl
  const isImage = target === 'lab' ? !!labDef?.isImage : false

  // ── ログイン画面
  if (!authed) return (
    <main style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#F9FAFB', fontFamily:font }}>
      <div style={{ background:'white', borderRadius:16, padding:'32px 28px', width:320, border:'1px solid #E5E7EB' }}>
        <h1 style={{ fontSize:17, fontWeight:800, margin:'0 0 4px' }}>データ投入</h1>
        <p style={{ fontSize:12, color:'#9CA3AF', margin:'0 0 20px' }}>管理者パスワードでログイン</p>
        <input type="password" placeholder="パスワード" value={pw}
          onChange={e => setPw(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleLogin()}
          style={{ ...inp, marginBottom:8, borderColor: loginError ? '#EF4444' : '#E5E7EB' }} />
        {loginError && (
          <p style={{ fontSize:12, color:'#EF4444', margin:'0 0 8px' }}>パスワードが違います</p>
        )}
        <button onClick={handleLogin}
          style={{ width:'100%', padding:'10px', borderRadius:8, border:'none', background:'#1D4ED8', color:'white', fontSize:14, fontWeight:700, cursor:'pointer' }}>
          ログイン
        </button>
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
        <div style={{ display:'flex', gap:6 }}>
          <a href="/admin" style={{ fontSize:12, color:'#6B7280', textDecoration:'none', padding:'5px 10px', borderRadius:7, border:'1px solid #E5E7EB' }}>管理画面</a>
          <a href="/"      style={{ fontSize:12, color:'#6B7280', textDecoration:'none', padding:'5px 10px', borderRadius:7, border:'1px solid #E5E7EB' }}>マップ</a>
        </div>
      </header>

      <div style={{ maxWidth:600, margin:'0 auto', padding:'16px 14px 60px' }}>

        {/* ① 研究室選択 */}
        <div style={card}>
          <Label text="① 研究室を選択" />
          <input placeholder="研究室名・教員名・専攻で絞り込み" value={query}
            onChange={e => setQuery(e.target.value)} style={{ ...inp, marginBottom:8 }} />
          <select value={labId}
            onChange={e => { setLabId(e.target.value); resetInput() }}
            style={sel}>
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
                : <select value={facId}
                    onChange={e => { setFacId(e.target.value); resetInput() }}
                    style={sel}>
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
                <select value={labFieldKey}
                  onChange={e => { setLabFieldKey(e.target.value); resetInput() }}
                  style={sel}>
                  <optgroup label="── 基本情報 ──">
                    {Object.entries(LAB_FIELDS).filter(([,v]) => v.group==='basic').map(([k,v]) => (
                      <option key={k} value={k}>{v.label}</option>
                    ))}
                  </optgroup>
                  <optgroup label="── SNS・動画 ──">
                    {Object.entries(LAB_FIELDS).filter(([,v]) => v.group==='sns').map(([k,v]) => (
                      <option key={k} value={k}>{v.label}</option>
                    ))}
                  </optgroup>
                </select>
              ) : (
                <select value={facFieldKey}
                  onChange={e => { setFacFieldKey(e.target.value); resetInput() }}
                  style={sel}>
                  <optgroup label="── SNS ──">
                    {Object.entries(FACULTY_FIELDS).filter(([,v]) => v.group==='sns').map(([k,v]) => (
                      <option key={k} value={k}>{v.label}</option>
                    ))}
                  </optgroup>
                  <optgroup label="── 研究情報 ──">
                    {Object.entries(FACULTY_FIELDS).filter(([,v]) => v.group==='research').map(([k,v]) => (
                      <option key={k} value={k}>{v.label}</option>
                    ))}
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

              {/* 出版物 */}
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
                  {pubType === 'paper' && (
                    <input placeholder="DOI（例: 10.1234/abcd.efgh）" value={pubDoi} onChange={e => setPubDoi(e.target.value)} style={inp} />
                  )}
                  {pubType === 'book' && (<>
                    <input placeholder="ISBN（例: 978-4-XXXXXXXXXX）" value={pubIsbn} onChange={e => setPubIsbn(e.target.value)} style={inp} />
                    <input placeholder="出版社名" value={pubPublisher} onChange={e => setPubPublisher(e.target.value)} style={inp} />
                  </>)}
                  <input placeholder="URL（任意）" value={pubUrl} onChange={e => setPubUrl(e.target.value)} style={inp} type="url" />
                </div>

              ) : isUrl ? (
                <div>
                  <p style={{ fontSize:12, color:'#6B7280', margin:'0 0 8px', lineHeight:1.6 }}>
                    URLをそのまま貼り付けてください。
                    {MULTI_FIELDS.includes(labFieldKey) && (
                      <span style={{ color:'#3B82F6', fontWeight:600 }}> （複数登録可・1件ずつ保存）</span>
                    )}
                  </p>
                  <input type="url" placeholder="https://..." value={urlInput}
                    onChange={e => setUrlInput(e.target.value)} style={inp} />
                </div>

              ) : (<>
                <div style={{ display:'grid', gridTemplateColumns: isImage ? '1fr 1fr 1fr' : '1fr 1fr', gap:8, marginBottom:14 }}>
                  <ModeBtn active={inputMode==='url'} onClick={() => setInputMode('url')}
                    icon="🔗" title="URLから取得"
                    desc="HPのURLを貼ると、AIが内容を読んでテキストを自動で取り出します" />
                  {isImage && (
                    <ModeBtn active={inputMode==='screenshot'} onClick={() => setInputMode('screenshot')}
                      icon="📸" title="画像から取得"
                      desc="スクショをアップすると、AIが画像の文字を読み取ります" />
                  )}
                  <ModeBtn active={inputMode==='manual'} onClick={() => setInputMode('manual')}
                    icon="✏️" title="直接入力"
                    desc="テキストをそのままここに入力します" />
                </div>

                {inputMode === 'url' && (
                  <div>
                    <input type="url" placeholder="https://..." value={urlInput}
                      onChange={e => setUrlInput(e.target.value)} style={{ ...inp, marginBottom:8 }} />
                    <button onClick={handleFetchUrl} disabled={loading || !urlInput.trim()}
                      style={{ width:'100%', padding:'10px', borderRadius:8, border:'none',
                        background: urlInput.trim() ? '#1D4ED8' : '#E5E7EB',
                        color: urlInput.trim() ? 'white' : '#9CA3AF',
                        fontSize:13, fontWeight:600, cursor: (!urlInput.trim() || loading) ? 'not-allowed' : 'pointer' }}>
                      {loading ? '⏳ AIが読み取り中...' : '🤖 AIでテキストを取り出す'}
                    </button>
                    {aiResult && (
                      <div style={{ marginTop:10 }}>
                        <p style={{ fontSize:11, color:'#1D4ED8', fontWeight:700, margin:'0 0 4px' }}>✅ 取り出し結果（編集できます）</p>
                        <textarea value={aiResult} onChange={e => setAiResult(e.target.value)} rows={6}
                          style={{ ...inp, resize:'vertical', lineHeight:1.7 }} />
                      </div>
                    )}
                  </div>
                )}

                {inputMode === 'screenshot' && (
                  <div>
                    <input type="file" accept="image/*" onChange={e => setImgFile(e.target.files?.[0] ?? null)}
                      style={{ fontSize:13, marginBottom:8 }} />
                    <button onClick={handleOcr} disabled={loading || !imgFile}
                      style={{ width:'100%', padding:'10px', borderRadius:8, border:'none',
                        background: imgFile ? '#1D4ED8' : '#E5E7EB',
                        color: imgFile ? 'white' : '#9CA3AF',
                        fontSize:13, fontWeight:600, cursor: (!imgFile || loading) ? 'not-allowed' : 'pointer' }}>
                      {loading ? '⏳ 読み取り中...' : '🤖 画像のテキストを読み取る'}
                    </button>
                    {aiResult && (
                      <div style={{ marginTop:10 }}>
                        <p style={{ fontSize:11, color:'#1D4ED8', fontWeight:700, margin:'0 0 4px' }}>✅ 読み取り結果（編集できます）</p>
                        <textarea value={aiResult} onChange={e => setAiResult(e.target.value)} rows={6}
                          style={{ ...inp, resize:'vertical', lineHeight:1.7 }} />
                      </div>
                    )}
                  </div>
                )}

                {inputMode === 'manual' && (
                  <textarea value={manualText} onChange={e => setManualText(e.target.value)}
                    rows={6} placeholder="ここにテキストを入力してください..."
                    style={{ ...inp, resize:'vertical', lineHeight:1.7 }} />
                )}
              </>)}

              {!isPub && !isUrl && labDef?.hasSource && (
                <div style={{ marginTop:12, paddingTop:12, borderTop:'1px solid #F3F4F6' }}>
                  <Label text="出典URL（どこから取得した情報か）" hint="任意" />
                  <input type="url" placeholder="https://..." value={sourceUrl}
                    onChange={e => setSourceUrl(e.target.value)} style={inp} />
                </div>
              )}

              {!isPub && labDef?.hasYear && (
                <div style={{ marginTop:10 }}>
                  <Label text="何年度の情報ですか？" hint="例: 2024年度" />
                  <input placeholder="2024年度" value={yearVal}
                    onChange={e => setYearVal(e.target.value)} style={inp} />
                </div>
              )}
            </div>
          )}

          {/* ⑤ 更新者 */}
          {(target === 'lab' || (target === 'faculty' && facId)) && (
            <div style={card}>
              <Label text="⑤ 情報を追加するのは誰ですか？" />
              {!showNewC ? (
                <div style={{ display:'flex', gap:8 }}>
                  <select value={contributor} onChange={e => setContributor(e.target.value)} style={{ ...sel, flex:1 }}>
                    <option value="">── 選択してください ──</option>
                    {contributors.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <button onClick={() => setShowNewC(true)}
                    style={{ padding:'9px 14px', borderRadius:8, border:'1px solid #E5E7EB', background:'white', fontSize:12, cursor:'pointer', whiteSpace:'nowrap' }}>
                    ＋ 新規追加
                  </button>
                </div>
              ) : (
                <div style={{ display:'flex', gap:8 }}>
                  <input placeholder="名前を入力してください" value={newContrib}
                    onChange={e => setNewContrib(e.target.value)} style={{ ...inp, flex:1 }} />
                  <button onClick={() => { setShowNewC(false); setNewContrib('') }}
                    style={{ padding:'9px 12px', borderRadius:8, border:'1px solid #E5E7EB', background:'white', fontSize:12, cursor:'pointer', whiteSpace:'nowrap' }}>
                    キャンセル
                  </button>
                </div>
              )}
            </div>
          )}

          {/* 保存ボタン */}
          {(target === 'lab' || (target === 'faculty' && facId)) && (
            <button onClick={handleSave} disabled={loading || saveBlocked}
              style={{ width:'100%', padding:'14px', borderRadius:10, border:'none',
                background: saveBlocked ? '#9CA3AF' : saved ? '#16A34A' : '#1D4ED8',
                color:'white', fontSize:15, fontWeight:700,
                cursor: (loading || saveBlocked) ? 'not-allowed' : 'pointer',
                transition:'background 0.3s' }}>
              {saveBlocked ? '🚫 しばらく待ってください' : saved ? '✅ 保存しました！' : loading ? '⏳ 保存中...' : '💾 DBに保存する'}
            </button>
          )}

        </>)}
      </div>
    </main>
  )
}