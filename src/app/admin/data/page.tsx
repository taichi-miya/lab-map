'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// ── 型 ──────────────────────────────────────────────────────────
type Lab = { id: string; name: string; faculty_name: string | null; dept: string | null }
type Faculty = { id: string; name: string; role: string | null; researchmap_id: string | null }
type Target = 'lab' | 'faculty'
type PubType = 'paper' | 'book' | 'other'

// 研究室フィールド定義（label, sourceフィールド名, 年度フィールド名）
type LabFieldDef = {
  label: string
  col: string
  hasSource?: boolean   // 出典URLを持つか
  hasYear?: boolean     // 年度を持つか
  isUrl?: boolean       // URL系（AI読み取り不要）
  isImage?: boolean     // 画像アップロード対応
  isMulti?: boolean     // 複数登録（jsonb配列）
}

const LAB_FIELDS: Record<string, LabFieldDef> = {
  summary_text:          { label: '研究概要テキスト',              col: 'summary_text',          hasSource: true, isImage: true },
  lab_url:               { label: '研究室公式HP URL',              col: 'lab_url',               isUrl: true },
  intro_url:             { label: '研究室紹介HP URL（研究科等）',   col: 'intro_url',             isUrl: true },
  faculty_name:          { label: '研究室 教員名',                 col: 'faculty_name',          hasSource: true },
  student_count:         { label: '研究室 学生数',                 col: 'student_count',         hasSource: true, hasYear: true },
  instagram_url:         { label: '研究室公式 Instagram URL',      col: 'instagram_url',         isUrl: true },
  twitter_url:           { label: '研究室公式 X URL',              col: 'twitter_url',           isUrl: true },
  youtube_channel_url:   { label: '研究室公式 YouTube チャンネル', col: 'youtube_channel_url',   isUrl: true },
  youtube_video_urls:    { label: '研究室紹介 YouTube 動画 URL',   col: 'youtube_video_urls',    isUrl: true, isMulti: true },
  instagram_url_other:   { label: '研究室紹介 Instagram URL（非公式）', col: 'instagram_url_other', isUrl: true },
  twitter_url_other:     { label: '研究室紹介 X URL（非公式）',    col: 'twitter_url_other',     isUrl: true },
}

// 教員フィールド定義
type FacultyFieldDef = { label: string; col: string; isUrl?: boolean; hint?: string }
const FACULTY_FIELDS: Record<string, FacultyFieldDef> = {
  instagram_username: { label: 'Instagram アカウント名（@以下）', col: 'instagram_url',  hint: '@を除いたユーザー名' },
  x_username:         { label: 'X アカウント名（@以下）',         col: 'x_username',     hint: '@を除いたユーザー名' },
  instagram_url:      { label: 'Instagram アカウント URL',        col: 'instagram_url',  isUrl: true },
  twitter_url:        { label: 'X アカウント URL',                col: 'twitter_url',    isUrl: true },
  researchmap:        { label: 'researchmap URL',                 col: 'researchmap_id', isUrl: true, hint: 'URLを貼るとIDを自動抽出' },
  publication:        { label: '出版物（論文・著書）',             col: '__publication__' },
}

const PW = process.env.NEXT_PUBLIC_ADMIN_PASSWORD ?? 'admin2024'
const f = "system-ui,'Noto Sans JP',sans-serif"
const card: React.CSSProperties = { background:'white', border:'1px solid #E5E7EB', borderRadius:12, padding:'16px 18px', marginBottom:12 }
const inp: React.CSSProperties  = { width:'100%', padding:'9px 12px', borderRadius:8, border:'1px solid #E5E7EB', fontSize:13, boxSizing:'border-box', outline:'none', fontFamily:f }
const sel: React.CSSProperties  = { ...inp, background:'white', cursor:'pointer' }
const lbl = (t: string, hint?: string) => (
  <p style={{ fontSize:11, fontWeight:700, color:'#6B7280', margin:'0 0 6px', letterSpacing:'0.04em' }}>
    {t}{hint && <span style={{ fontWeight:400, marginLeft:6, color:'#9CA3AF' }}>({hint})</span>}
  </p>
)

// ── メインコンポーネント ─────────────────────────────────────────
export default function AdminDataPage() {
  const [authed,       setAuthed]       = useState(false)
  const [pw,           setPw]           = useState('')
  const [labs,         setLabs]         = useState<Lab[]>([])
  const [query,        setQuery]        = useState('')
  const [labId,        setLabId]        = useState('')
  const [target,       setTarget]       = useState<Target>('lab')
  const [faculties,    setFaculties]    = useState<Faculty[]>([])
  const [facId,        setFacId]        = useState('')
  const [labFieldKey,  setLabFieldKey]  = useState('summary_text')
  const [facFieldKey,  setFacFieldKey]  = useState('researchmap')
  const [inputVal,     setInputVal]     = useState('')
  const [sourceUrl,    setSourceUrl]    = useState('')
  const [yearVal,      setYearVal]      = useState('')
  const [imgFile,      setImgFile]      = useState<File | null>(null)
  const [preview,      setPreview]      = useState('')
  const [currentVal,   setCurrentVal]   = useState('')
  const [loading,      setLoading]      = useState(false)
  const [saved,        setSaved]        = useState(false)
  // 出版物用
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
  const [newContrib,   setNewContrib]   = useState('')
  const [showNewC,     setShowNewC]     = useState(false)

  useEffect(() => { if (authed) { fetchLabs(); fetchContributors() } }, [authed])
  useEffect(() => {
    setFacId(''); setFaculties([]); setPreview(''); setCurrentVal('')
    if (labId && target === 'faculty') fetchFaculties(labId)
    if (labId && target === 'lab') fetchCurrentLabVal(labId, labFieldKey)
  }, [labId, target])
  useEffect(() => { if (labId && target === 'lab') fetchCurrentLabVal(labId, labFieldKey) }, [labFieldKey])
  useEffect(() => { if (facId) fetchCurrentFacVal(facId, facFieldKey) }, [facId, facFieldKey])

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
    if (!def || def.col === '__publication__') return
    const { data } = await sb.from('labs').select(def.col).eq('id', lId).single()
    setCurrentVal((data as Record<string,string>|null)?.[def.col] ?? '')
  }
  async function fetchCurrentFacVal(fId: string, key: string) {
    const def = FACULTY_FIELDS[key]
    if (!def || def.col === '__publication__') return
    const { data } = await sb.from('faculties').select(def.col).eq('id', fId).single()
    setCurrentVal((data as Record<string,string>|null)?.[def.col] ?? '')
  }
  async function fetchContributors() {
    const { data } = await sb.from('contributors').select('name').order('name')
    if (data) setContributors(data.map(d => d.name))
  }

  // ─ フィルタ（研究室名・教員名・専攻）
  const filtered = labs.filter(l =>
    l.name.includes(query) ||
    (l.faculty_name ?? '').includes(query) ||
    (l.dept ?? '').includes(query)
  )

  // ─ URL → AI読み取り
  async function handleFetchUrl() {
    const url = inputVal.trim()
    if (!url) return
    setLoading(true); setPreview('')
    try {
      const res = await fetch('/api/admin/fetch-url', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, mode: target, field: target === 'lab' ? labFieldKey : facFieldKey })
      })
      const d = await res.json()
      setPreview(d.text ?? 'テキストを取得できませんでした')
    } catch { setPreview('エラーが発生しました') }
    setLoading(false)
  }

  // ─ スクショ OCR
  async function handleOcr() {
    if (!imgFile) return
    setLoading(true); setPreview('')
    const reader = new FileReader()
    reader.onload = async (e) => {
      const b64 = (e.target?.result as string).split(',')[1]
      const res = await fetch('/api/admin/ocr', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: b64, mimeType: imgFile.type })
      })
      const d = await res.json()
      setPreview(d.text ?? 'OCR失敗')
      setLoading(false)
    }
    reader.readAsDataURL(imgFile)
  }

  // ─ 更新者の確定
  async function resolveContributor(): Promise<string> {
    if (showNewC && newContrib.trim()) {
      await sb.from('contributors').upsert({ name: newContrib.trim() }, { onConflict: 'name' })
      await fetchContributors()
      return newContrib.trim()
    }
    return contributor
  }

  // ─ 保存
  async function handleSave() {
    if (!labId) return alert('研究室を選択してください')
    if (target === 'faculty' && !facId) return alert('教員を選択してください')
    const by = await resolveContributor()
    const now = new Date().toISOString()
    setLoading(true)

    if (target === 'faculty' && facFieldKey === 'publication') {
      // 出版物保存
      if (!pubTitle.trim() && !pubDoi.trim()) { setLoading(false); return alert('タイトルまたはDOIを入力してください') }
      const { data: pub } = await sb.from('publications').insert({
        type: pubType, title: pubTitle, doi: pubDoi || null,
        isbn: pubIsbn || null, publisher: pubPublisher || null,
        year: pubYear ? parseInt(pubYear) : null,
        authors: pubAuthors || null, url: pubUrl || null,
      }).select('id').single()
      if (pub) {
        await sb.from('lab_publications').insert({
          lab_id: labId, publication_id: pub.id,
          faculty_id: facId, added_by: by, added_at: now,
        })
      }
    } else if (target === 'lab') {
      const def = LAB_FIELDS[labFieldKey]
      const value = preview || inputVal
      if (!value.trim()) { setLoading(false); return alert('内容を入力してください') }
      const update: Record<string, unknown> = { [def.col]: value, updated_at: now }
      if (def.hasSource && sourceUrl) update['summary_source_url'] = sourceUrl
      if (def.hasYear && yearVal) {
        update['student_count_year']   = yearVal
        update['student_count_source'] = sourceUrl
      }
      await sb.from('labs').update(update).eq('id', labId)
    } else {
      const def = FACULTY_FIELDS[facFieldKey]
      let value = preview || inputVal
      // researchmap URL → IDだけ抽出
      if (def.col === 'researchmap_id' && value.includes('researchmap.jp/')) {
        value = value.split('researchmap.jp/').pop()?.split('/')[0] ?? value
      }
      // @username は @を除去
      if (['x_username', 'instagram_username'].includes(facFieldKey)) {
        value = value.replace(/^@/, '')
      }
      if (!value.trim()) { setLoading(false); return alert('内容を入力してください') }
      await sb.from('faculties').update({ [def.col]: value, updated_at: now }).eq('id', facId)
    }

    setLoading(false); setSaved(true)
    setTimeout(() => {
      setSaved(false); setPreview(''); setInputVal(''); setSourceUrl('')
      setYearVal(''); setImgFile(null)
      setPubTitle(''); setPubDoi(''); setPubIsbn(''); setPubPublisher('')
      setPubYear(''); setPubAuthors(''); setPubUrl('')
    }, 2000)
  }

  const labDef = LAB_FIELDS[labFieldKey]
  const facDef = FACULTY_FIELDS[facFieldKey]
  const isPub  = target === 'faculty' && facFieldKey === 'publication'
  const isUrlField = target === 'lab' ? labDef?.isUrl : facDef?.isUrl
  const showAI = !isUrlField && !isPub

  // ─ ログイン画面 ───────────────────────────────
  if (!authed) return (
    <main style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#F9FAFB', fontFamily:f }}>
      <div style={{ background:'white', borderRadius:16, padding:'32px 28px', width:320, border:'1px solid #E5E7EB' }}>
        <h1 style={{ fontSize:17, fontWeight:800, margin:'0 0 4px' }}>データ投入</h1>
        <p style={{ fontSize:12, color:'#9CA3AF', margin:'0 0 20px' }}>管理者パスワードでログイン</p>
        <input type="password" placeholder="パスワード" value={pw}
          onChange={e => setPw(e.target.value)}
          onKeyDown={e => e.key==='Enter' && (pw===PW ? setAuthed(true) : alert('パスワードが違います'))}
          style={{ ...inp, marginBottom:10 }} />
        <button onClick={() => pw===PW ? setAuthed(true) : alert('パスワードが違います')}
          style={{ width:'100%', padding:'10px', borderRadius:8, border:'none', background:'#1D4ED8', color:'white', fontSize:14, fontWeight:700, cursor:'pointer' }}>
          ログイン
        </button>
      </div>
    </main>
  )

  // ─ メイン画面 ─────────────────────────────────
  return (
    <main style={{ minHeight:'100vh', background:'#F9FAFB', fontFamily:f }}>
      <header style={{ background:'white', borderBottom:'1px solid #E5E7EB', padding:'12px 16px', display:'flex', alignItems:'center', justifyContent:'space-between', position:'sticky', top:0, zIndex:10 }}>
        <div>
          <span style={{ fontSize:15, fontWeight:800 }}>📥 データ投入</span>
          <span style={{ fontSize:11, color:'#9CA3AF', marginLeft:8 }}>研究室DBの更新</span>
        </div>
        <div style={{ display:'flex', gap:6 }}>
          <a href="/admin" style={{ fontSize:12, color:'#6B7280', textDecoration:'none', padding:'5px 10px', borderRadius:7, border:'1px solid #E5E7EB' }}>管理画面</a>
          <a href="/" style={{ fontSize:12, color:'#6B7280', textDecoration:'none', padding:'5px 10px', borderRadius:7, border:'1px solid #E5E7EB' }}>マップ</a>
        </div>
      </header>

      <div style={{ maxWidth:600, margin:'0 auto', padding:'16px 14px 60px' }}>

        {/* ① 研究室選択 */}
        <div style={card}>
          {lbl('① 研究室を選択')}
          <input placeholder="研究室名 / 教員名 / 専攻で絞り込み" value={query}
            onChange={e => setQuery(e.target.value)} style={{ ...inp, marginBottom:8 }} />
          <select value={labId} onChange={e => { setLabId(e.target.value); setPreview(''); setInputVal('') }} style={sel}>
            <option value="">-- 研究室を選んでください（{filtered.length}件） --</option>
            {filtered.map(l => (
              <option key={l.id} value={l.id}>
                {l.name}　{l.faculty_name ? `／ ${l.faculty_name}` : ''}　{l.dept ? `【${l.dept}】` : ''}
              </option>
            ))}
          </select>
        </div>

        {labId && (<>

          {/* ② 対象選択 */}
          <div style={card}>
            {lbl('② 更新する対象')}
            <div style={{ display:'flex', gap:8 }}>
              {(['lab','faculty'] as Target[]).map(t => (
                <button key={t} onClick={() => { setTarget(t); setPreview(''); setInputVal('') }}
                  style={{ flex:1, padding:'10px', borderRadius:8, cursor:'pointer', fontSize:13,
                    border:`1.5px solid ${target===t ? '#3B82F6' : '#E5E7EB'}`,
                    background: target===t ? '#EFF6FF' : 'white',
                    color: target===t ? '#1D4ED8' : '#374151', fontWeight: target===t ? 700 : 400 }}>
                  {t==='lab' ? '🏫 研究室の情報' : '👤 教員の情報'}
                </button>
              ))}
            </div>
          </div>

          {/* 教員選択 */}
          {target === 'faculty' && (
            <div style={card}>
              {lbl('③-a 教員を選択')}
              {faculties.length === 0
                ? <p style={{ fontSize:12, color:'#9CA3AF', margin:0 }}>読み込み中...</p>
                : <select value={facId} onChange={e => { setFacId(e.target.value); setPreview(''); setInputVal('') }} style={sel}>
                    <option value="">-- 教員を選んでください（{faculties.length}名） --</option>
                    {faculties.map(fc => (
                      <option key={fc.id} value={fc.id}>
                        {fc.name}　{fc.role ? `（${fc.role}）` : ''}　{fc.researchmap_id ? '✓RM' : ''}
                      </option>
                    ))}
                  </select>
              }
            </div>
          )}

          {/* フィールド選択 */}
          {(target === 'lab' || (target === 'faculty' && facId)) && (
            <div style={card}>
              {lbl(target==='lab' ? '③ 更新するフィールド' : '③-b 更新するフィールド')}
              <select
                value={target==='lab' ? labFieldKey : facFieldKey}
                onChange={e => { target==='lab' ? setLabFieldKey(e.target.value) : setFacFieldKey(e.target.value); setPreview(''); setInputVal('') }}
                style={sel}>
                {Object.entries(target==='lab' ? LAB_FIELDS : FACULTY_FIELDS).map(([k,v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </select>

              {/* ヒント表示 */}
              {target==='faculty' && facDef?.hint && (
                <p style={{ fontSize:11, color:'#9CA3AF', margin:'6px 0 0' }}>💡 {facDef.hint}</p>
              )}

              {/* 現在値 */}
              {currentVal && !isPub && (
                <div style={{ marginTop:10, background:'#F9FAFB', borderRadius:8, padding:'8px 10px', border:'1px solid #E5E7EB' }}>
                  <p style={{ fontSize:10, color:'#9CA3AF', margin:'0 0 3px', fontWeight:700 }}>現在の値</p>
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
              {lbl('④ 内容を入力')}

              {/* 出版物フォーム */}
              {isPub ? (
                <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                  {/* 種別 */}
                  <div style={{ display:'flex', gap:8 }}>
                    {(['paper','book','other'] as PubType[]).map(pt => (
                      <button key={pt} onClick={() => setPubType(pt)}
                        style={{ flex:1, padding:'8px', borderRadius:8, cursor:'pointer', fontSize:12,
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
                    <input placeholder="DOI（例: 10.1234/abcd）" value={pubDoi} onChange={e => setPubDoi(e.target.value)} style={inp} />
                  )}
                  {pubType === 'book' && (<>
                    <input placeholder="ISBN（例: 978-4-XXXXXXXX）" value={pubIsbn} onChange={e => setPubIsbn(e.target.value)} style={inp} />
                    <input placeholder="出版社" value={pubPublisher} onChange={e => setPubPublisher(e.target.value)} style={inp} />
                  </>)}
                  <input placeholder="URL（任意）" value={pubUrl} onChange={e => setPubUrl(e.target.value)} style={inp} type="url" />
                </div>

              ) : isUrlField ? (
                /* URLそのまま入力 */
                <input type="url" placeholder="https://..." value={inputVal}
                  onChange={e => setInputVal(e.target.value)} style={inp} />

              ) : (<>
                {/* テキスト入力 + AI/OCR */}
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:12 }}>
                  {[
                    { id:'url',        icon:'🔗', label:'URL → AI' },
                    { id:'screenshot', icon:'📸', label:'スクショ' },
                    { id:'manual',     icon:'✏️', label:'直接入力' },
                  ].map(({ id, icon, label: ml }) => {
                    const active = inputVal===id || (id==='manual' && !inputVal.startsWith('http') && inputVal)
                    return (
                      <button key={id} style={{ padding:'9px', borderRadius:8, cursor:'pointer', fontSize:12,
                        border:`1.5px solid ${active ? '#3B82F6' : '#E5E7EB'}`,
                        background: active ? '#EFF6FF' : 'white', color: active ? '#1D4ED8' : '#374151' }}>
                        {icon} {ml}
                      </button>
                    )
                  })}
                </div>

                {/* URL入力 + AIボタン */}
                <div style={{ display:'flex', gap:8, marginBottom:10 }}>
                  <input type="url" placeholder="URL貼り付け → AIで読み取り" value={inputVal}
                    onChange={e => setInputVal(e.target.value)} style={{ ...inp, flex:1 }} />
                  <button onClick={handleFetchUrl} disabled={loading || !inputVal}
                    style={{ padding:'9px 14px', borderRadius:8, border:'1px solid #D1D5DB', background:'#F3F4F6', fontSize:12, fontWeight:600, cursor: loading ? 'wait' : 'pointer', whiteSpace:'nowrap', opacity: !inputVal ? 0.5 : 1 }}>
                    {loading ? '⏳' : 'AI読取'}
                  </button>
                </div>

                {/* 画像アップ */}
                {labDef?.isImage && (
                  <div style={{ display:'flex', gap:8, marginBottom:10, alignItems:'center' }}>
                    <input type="file" accept="image/*" onChange={e => setImgFile(e.target.files?.[0] ?? null)}
                      style={{ fontSize:12, flex:1 }} />
                    <button onClick={handleOcr} disabled={loading || !imgFile}
                      style={{ padding:'9px 14px', borderRadius:8, border:'1px solid #D1D5DB', background:'#F3F4F6', fontSize:12, fontWeight:600, cursor: loading ? 'wait' : 'pointer', whiteSpace:'nowrap', opacity: !imgFile ? 0.5 : 1 }}>
                      {loading ? '⏳' : 'OCR'}
                    </button>
                  </div>
                )}

                {/* 直接入力テキストエリア */}
                <textarea value={preview || ''} onChange={e => setPreview(e.target.value)}
                  rows={5} placeholder="または直接テキストを入力..."
                  style={{ ...inp, resize:'vertical', lineHeight:1.7 }} />
              </>)}

              {/* 出典URL（hasSourceな場合） */}
              {!isPub && (target==='lab' ? labDef?.hasSource : false) && (
                <div style={{ marginTop:10 }}>
                  <p style={{ fontSize:11, color:'#9CA3AF', margin:'0 0 5px' }}>出典URL（任意）</p>
                  <input type="url" placeholder="https://..." value={sourceUrl}
                    onChange={e => setSourceUrl(e.target.value)} style={inp} />
                </div>
              )}

              {/* 年度（hasYearな場合） */}
              {!isPub && labDef?.hasYear && (
                <div style={{ marginTop:10 }}>
                  <p style={{ fontSize:11, color:'#9CA3AF', margin:'0 0 5px' }}>年度（例: 2024年度）</p>
                  <input placeholder="2024年度" value={yearVal} onChange={e => setYearVal(e.target.value)} style={inp} />
                </div>
              )}
            </div>
          )}

          {/* ⑤ 更新者 */}
          {(target === 'lab' || (target === 'faculty' && facId)) && (
            <div style={card}>
              {lbl('⑤ 更新者')}
              {!showNewC ? (
                <div style={{ display:'flex', gap:8 }}>
                  <select value={contributor} onChange={e => setContributor(e.target.value)} style={{ ...sel, flex:1 }}>
                    <option value="">-- 選択してください --</option>
                    {contributors.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <button onClick={() => setShowNewC(true)}
                    style={{ padding:'9px 14px', borderRadius:8, border:'1px solid #E5E7EB', background:'white', fontSize:12, cursor:'pointer', whiteSpace:'nowrap' }}>
                    ＋ 新規
                  </button>
                </div>
              ) : (
                <div style={{ display:'flex', gap:8 }}>
                  <input placeholder="名前を入力" value={newContrib} onChange={e => setNewContrib(e.target.value)} style={{ ...inp, flex:1 }} />
                  <button onClick={() => { setShowNewC(false); setNewContrib('') }}
                    style={{ padding:'9px 12px', borderRadius:8, border:'1px solid #E5E7EB', background:'white', fontSize:12, cursor:'pointer' }}>
                    キャンセル
                  </button>
                </div>
              )}
            </div>
          )}

          {/* 保存ボタン */}
          {(target === 'lab' || (target === 'faculty' && facId)) && (
            <button onClick={handleSave} disabled={loading}
              style={{ width:'100%', padding:'14px', borderRadius:10, border:'none',
                background: saved ? '#16A34A' : '#1D4ED8', color:'white', fontSize:15, fontWeight:700,
                cursor: loading ? 'wait' : 'pointer', transition:'background 0.3s' }}>
              {saved ? '✅ 保存しました！' : loading ? '⏳ 処理中...' : '💾 DBに保存する'}
            </button>
          )}

        </>)}
      </div>
    </main>
  )
}