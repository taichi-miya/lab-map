'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import { useUser, SignInButton, SignOutButton } from '@clerk/nextjs'

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

type Lab     = { id: string; name: string; faculty_name: string | null; dept: string | null }
type Faculty = { id: string; name: string; role: string | null }

// 提供できる情報の定義
type FieldDef = {
  label:   string
  group:   'lab_basic' | 'lab_sns' | 'faculty'
  hint?:   string
  isUrl?:  boolean
  isMulti?: boolean
}
const FIELD_DEFS: Record<string, FieldDef> = {
  // 研究室
  summary_text:        { label:'📝 研究概要テキスト',           group:'lab_basic' },
  lab_url:             { label:'🔗 公式HP URL',                 group:'lab_basic', isUrl:true },
  intro_url:           { label:'🔗 紹介ページ URL（研究科等）', group:'lab_basic', isUrl:true },
  student_count:       { label:'👥 学生数',                     group:'lab_basic', hint:'数字のみ（例: 12）' },
  instagram_url:       { label:'📷 公式 Instagram URL',        group:'lab_sns',   isUrl:true },
  twitter_url:         { label:'🐦 公式 X URL',                group:'lab_sns',   isUrl:true },
  youtube_channel_url: { label:'▶️ 公式 YouTube チャンネル',   group:'lab_sns',   isUrl:true },
  youtube_video_urls:  { label:'▶️ 紹介 YouTube 動画',         group:'lab_sns',   isUrl:true, isMulti:true },
  instagram_url_other: { label:'📷 紹介 Instagram（非公式）',  group:'lab_sns',   isUrl:true, isMulti:true },
  twitter_url_other:   { label:'🐦 紹介 X（非公式）',          group:'lab_sns',   isUrl:true, isMulti:true },
  // 教員
  fac_researchmap:     { label:'🔬 researchmap URL',           group:'faculty',   isUrl:true, hint:'URLを貼るとIDを自動抽出します' },
  fac_instagram_url:   { label:'📷 Instagram URL',            group:'faculty',   isUrl:true },
  fac_twitter_url:     { label:'🐦 X URL',                    group:'faculty',   isUrl:true },
  fac_x_username:      { label:'🐦 X アカウント名（@以下）',  group:'faculty',   hint:'例: tohoku_lab_abc' },
}

const font = "system-ui,'Noto Sans JP',sans-serif"
const inp: React.CSSProperties  = { width:'100%', padding:'10px 12px', borderRadius:8, border:'1px solid #E5E7EB', fontSize:14, boxSizing:'border-box', outline:'none', fontFamily:font }
const sel: React.CSSProperties  = { ...inp, background:'white', cursor:'pointer' }
const card: React.CSSProperties = { background:'white', border:'1px solid #E5E7EB', borderRadius:14, padding:'18px 20px', marginBottom:14 }

function Label({ text, hint }: { text: string; hint?: string }) {
  return (
    <p style={{ fontSize:12, fontWeight:700, color:'#6B7280', margin:'0 0 8px' }}>
      {text}{hint && <span style={{ fontWeight:400, marginLeft:6, color:'#9CA3AF' }}>（{hint}）</span>}
    </p>
  )
}

export default function ContributePage() {
  const { user, isLoaded } = useUser()

  // ステップ管理
  const [step,        setStep]        = useState<1 | 2 | 3 | 4>(1)
  const [submitted,   setSubmitted]   = useState(false)

  // 研究室・教員
  const [labs,        setLabs]        = useState<Lab[]>([])
  const [query,       setQuery]       = useState('')
  const [labId,       setLabId]       = useState('')
  const [targetType,  setTargetType]  = useState<'lab' | 'faculty'>('lab')
  const [faculties,   setFaculties]   = useState<Faculty[]>([])
  const [facId,       setFacId]       = useState('')

  // フィールド・入力
  const [fieldKey,    setFieldKey]    = useState('summary_text')
  const [textVal,     setTextVal]     = useState('')
  const [multiUrls,   setMultiUrls]   = useState<string[]>([''])

  // ゲスト情報
  const [guestName,   setGuestName]   = useState('')
  const [guestEmail,  setGuestEmail]  = useState('')

  const [loading,     setLoading]     = useState(false)
  const [error,       setError]       = useState('')

  useEffect(() => { fetchLabs() }, [])
  useEffect(() => {
    if (labId && targetType === 'faculty') fetchFaculties(labId)
    else setFaculties([])
  }, [labId, targetType])

  async function fetchLabs() {
    const { data } = await sb.from('labs').select('id,name,faculty_name,dept').order('dept').order('name')
    if (data) setLabs(data)
  }
  async function fetchFaculties(lId: string) {
    const { data } = await sb.from('faculties').select('id,name,role').eq('lab_id', lId).order('name')
    if (data) setFaculties(data)
  }

  const filtered = labs.filter(l =>
    l.name.includes(query) || (l.faculty_name ?? '').includes(query) || (l.dept ?? '').includes(query)
  )

  const fieldDef     = FIELD_DEFS[fieldKey]
  const isFacField   = fieldDef?.group === 'faculty'
  const isMulti      = !!fieldDef?.isMulti
  const selectedLab  = labs.find(l => l.id === labId)
  const selectedFac  = faculties.find(f => f.id === facId)

  // 投稿する値を確定
  function getFinalValue(): string {
    if (isMulti) return multiUrls.filter(u => u.trim()).join('\n')
    return textVal.trim()
  }

  async function handleSubmit() {
    const value = getFinalValue()
    if (!value) { setError('内容を入力してください'); return }
    if (!labId)  { setError('研究室を選択してください'); return }
    if (isFacField && !facId) { setError('教員を選択してください'); return }

    setLoading(true); setError('')

    // researchmap URL → IDだけ抽出
    let saveValue = value
    if (fieldKey === 'fac_researchmap' && value.includes('researchmap.jp/')) {
      saveValue = value.split('researchmap.jp/').pop()?.split('/')[0] ?? value
    }

    // フィールドキーをDBカラム名に変換
    const dbField = fieldKey.startsWith('fac_')
      ? fieldKey.replace('fac_researchmap', 'researchmap').replace('fac_', '')
      : fieldKey

    const contributor = user
      ? (user.fullName ?? user.username ?? user.emailAddresses[0]?.emailAddress ?? 'Labo Naviユーザー')
      : null

    const res = await fetch('/api/contribute', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        lab_id:      labId,
        target_type: isFacField ? 'faculty' : 'lab',
        target_id:   isFacField ? facId : labId,
        field:       dbField,
        new_value:   saveValue,
        contributor,
        guest_name:  !user ? (guestName || null) : null,
        guest_email: !user ? (guestEmail || null) : null,
      }),
    })

    if (res.ok) {
      setSubmitted(true)
    } else {
      setError('送信に失敗しました。もう一度お試しください。')
    }
    setLoading(false)
  }

  // 完了画面
  if (submitted) return (
    <main style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#F9FAFB', fontFamily:font }}>
      <div style={{ textAlign:'center', padding:'0 20px' }}>
        <p style={{ fontSize:48, margin:'0 0 16px' }}>🎉</p>
        <h1 style={{ fontSize:20, fontWeight:800, color:'#1F2937', margin:'0 0 8px' }}>ありがとうございます！</h1>
        <p style={{ fontSize:14, color:'#6B7280', margin:'0 0 24px', lineHeight:1.7 }}>
          いただいた情報は管理者が確認後、<br />マップに反映されます。
        </p>
        <div style={{ display:'flex', gap:10, justifyContent:'center' }}>
          <button onClick={() => { setSubmitted(false); setStep(1); setLabId(''); setTextVal(''); setMultiUrls(['']); setQuery('') }}
            style={{ padding:'10px 20px', borderRadius:8, border:'1.5px solid #E5E7EB', background:'white', fontSize:13, fontWeight:600, cursor:'pointer' }}>
            続けて投稿する
          </button>
          <a href="/map" style={{ padding:'10px 20px', borderRadius:8, border:'none', background:'#1D4ED8', color:'white', fontSize:13, fontWeight:600, textDecoration:'none', display:'inline-block' }}>
            マップに戻る
          </a>
        </div>
      </div>
    </main>
  )

  return (
    <main style={{ minHeight:'100vh', background:'#F9FAFB', fontFamily:font }}>
      {/* ヘッダー */}
      <header style={{ background:'white', borderBottom:'1px solid #E5E7EB', padding:'13px 16px', display:'flex', alignItems:'center', justifyContent:'space-between', position:'sticky', top:0, zIndex:10 }}>
        <div>
          <span style={{ fontSize:15, fontWeight:800 }}>📬 情報を提供する</span>
          <span style={{ fontSize:11, color:'#9CA3AF', marginLeft:8 }}>Labo Navi</span>
        </div>
        <div style={{ display:'flex', gap:8, alignItems:'center' }}>
          {isLoaded && (
            user ? (
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                <span style={{ fontSize:12, color:'#6B7280' }}>
                  {user.fullName ?? user.username}
                </span>
                <SignOutButton>
                  <button style={{ fontSize:11, color:'#9CA3AF', padding:'4px 8px', borderRadius:6, border:'1px solid #E5E7EB', background:'white', cursor:'pointer' }}>ログアウト</button>
                </SignOutButton>
              </div>
            ) : (
              <SignInButton mode="modal">
                <button style={{ fontSize:12, color:'#1D4ED8', padding:'5px 12px', borderRadius:7, border:'1.5px solid #BFDBFE', background:'#EFF6FF', fontWeight:600, cursor:'pointer' }}>
                  🔑 ログイン
                </button>
              </SignInButton>
            )
          )}
          <a href="/map" style={{ fontSize:12, color:'#6B7280', textDecoration:'none', padding:'5px 10px', borderRadius:7, border:'1px solid #E5E7EB' }}>← マップ</a>
        </div>
      </header>

      {/* ログイン誘導バナー（ゲストの場合） */}
      {isLoaded && !user && (
        <div style={{ background:'#EFF6FF', borderBottom:'1px solid #BFDBFE', padding:'10px 16px' }}>
          <p style={{ fontSize:12, color:'#1D4ED8', margin:0, textAlign:'center' }}>
            💡 <strong>Labo Naviアカウント</strong>でログインすると、あなたの投稿として記録されます。
            <SignInButton mode="modal">
              <button style={{ marginLeft:8, fontSize:12, color:'#1D4ED8', fontWeight:700, background:'none', border:'none', cursor:'pointer', textDecoration:'underline' }}>ログイン・新規登録</button>
            </SignInButton>
          </p>
        </div>
      )}

      <div style={{ maxWidth:560, margin:'0 auto', padding:'20px 16px 60px' }}>

        {/* ステッププログレス */}
        <div style={{ display:'flex', alignItems:'center', marginBottom:24, gap:0 }}>
          {[
            { n:1, label:'研究室' },
            { n:2, label:'情報の種類' },
            { n:3, label:'内容入力' },
            { n:4, label:'送信' },
          ].map(({ n, label }, i) => (
            <div key={n} style={{ display:'flex', alignItems:'center', flex: i < 3 ? 1 : 0 }}>
              <div style={{ display:'flex', flexDirection:'column', alignItems:'center' }}>
                <div style={{ width:28, height:28, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:700,
                  background: step >= n ? '#1D4ED8' : '#E5E7EB',
                  color: step >= n ? 'white' : '#9CA3AF' }}>
                  {step > n ? '✓' : n}
                </div>
                <span style={{ fontSize:10, color: step >= n ? '#1D4ED8' : '#9CA3AF', marginTop:3, fontWeight: step === n ? 700 : 400, whiteSpace:'nowrap' }}>{label}</span>
              </div>
              {i < 3 && <div style={{ flex:1, height:2, background: step > n ? '#1D4ED8' : '#E5E7EB', margin:'0 4px', marginBottom:14 }} />}
            </div>
          ))}
        </div>

        {/* Step 1: 研究室選択 */}
        {step === 1 && (
          <div style={card}>
            <Label text="どの研究室の情報ですか？" />
            <input placeholder="研究室名・教員名・専攻で絞り込み" value={query}
              onChange={e => setQuery(e.target.value)} style={{ ...inp, marginBottom:10 }} />
            <select value={labId} onChange={e => setLabId(e.target.value)} style={{ ...sel, marginBottom:16 }}>
              <option value="">── 研究室を選んでください（{filtered.length}件） ──</option>
              {filtered.map(l => (
                <option key={l.id} value={l.id}>
                  {l.name}　{l.faculty_name ? `/ ${l.faculty_name}` : ''}　{l.dept ? `【${l.dept}】` : ''}
                </option>
              ))}
            </select>
            <button onClick={() => { if (!labId) { setError('研究室を選択してください'); return }; setError(''); setStep(2) }}
              disabled={!labId}
              style={{ width:'100%', padding:'12px', borderRadius:9, border:'none', background: labId ? '#1D4ED8' : '#E5E7EB', color: labId ? 'white' : '#9CA3AF', fontSize:14, fontWeight:700, cursor: labId ? 'pointer' : 'not-allowed' }}>
              次へ →
            </button>
            {error && <p style={{ fontSize:12, color:'#EF4444', margin:'8px 0 0', textAlign:'center' }}>{error}</p>}
          </div>
        )}

        {/* Step 2: 情報の種類 */}
        {step === 2 && (
          <div style={card}>
            <Label text={`「${selectedLab?.name ?? ''}」の何の情報ですか？`} />

            {/* 研究室 or 教員 */}
            <div style={{ display:'flex', gap:8, marginBottom:14 }}>
              {(['lab','faculty'] as const).map(t => (
                <button key={t} onClick={() => { setTargetType(t); setFacId('') }}
                  style={{ flex:1, padding:'10px', borderRadius:8, cursor:'pointer', fontSize:13,
                    border:`1.5px solid ${targetType===t ? '#3B82F6' : '#E5E7EB'}`,
                    background: targetType===t ? '#EFF6FF' : 'white',
                    color: targetType===t ? '#1D4ED8' : '#374151', fontWeight: targetType===t ? 700 : 400 }}>
                  {t === 'lab' ? '🏫 研究室の情報' : '👤 特定の教員の情報'}
                </button>
              ))}
            </div>

            {/* 教員選択 */}
            {targetType === 'faculty' && (
              <div style={{ marginBottom:14 }}>
                <Label text="どの教員ですか？" />
                {faculties.length === 0
                  ? <p style={{ fontSize:12, color:'#9CA3AF' }}>読み込み中...</p>
                  : <select value={facId} onChange={e => setFacId(e.target.value)} style={sel}>
                      <option value="">── 教員を選んでください ──</option>
                      {faculties.map(f => <option key={f.id} value={f.id}>{f.name}　{f.role ? `（${f.role}）` : ''}</option>)}
                    </select>
                }
              </div>
            )}

            {/* フィールド選択 */}
            <Label text="どの情報を提供しますか？" />
            <select value={fieldKey} onChange={e => setFieldKey(e.target.value)} style={{ ...sel, marginBottom:16 }}>
              {targetType === 'lab' ? (<>
                <optgroup label="── 基本情報 ──">
                  {Object.entries(FIELD_DEFS).filter(([,v]) => v.group==='lab_basic').map(([k,v]) => <option key={k} value={k}>{v.label}</option>)}
                </optgroup>
                <optgroup label="── SNS・動画 ──">
                  {Object.entries(FIELD_DEFS).filter(([,v]) => v.group==='lab_sns').map(([k,v]) => <option key={k} value={k}>{v.label}</option>)}
                </optgroup>
              </>) : (
                <optgroup label="── 教員情報 ──">
                  {Object.entries(FIELD_DEFS).filter(([,v]) => v.group==='faculty').map(([k,v]) => <option key={k} value={k}>{v.label}</option>)}
                </optgroup>
              )}
            </select>

            <div style={{ display:'flex', gap:8 }}>
              <button onClick={() => setStep(1)}
                style={{ flex:1, padding:'11px', borderRadius:9, border:'1px solid #E5E7EB', background:'white', fontSize:13, cursor:'pointer' }}>← 戻る</button>
              <button onClick={() => {
                if (targetType === 'faculty' && !facId) { setError('教員を選択してください'); return }
                setError(''); setTextVal(''); setMultiUrls(['']); setStep(3)
              }}
                style={{ flex:2, padding:'11px', borderRadius:9, border:'none', background:'#1D4ED8', color:'white', fontSize:14, fontWeight:700, cursor:'pointer' }}>
                次へ →
              </button>
            </div>
            {error && <p style={{ fontSize:12, color:'#EF4444', margin:'8px 0 0', textAlign:'center' }}>{error}</p>}
          </div>
        )}

        {/* Step 3: 内容入力 */}
        {step === 3 && (
          <div style={card}>
            <Label text={`${fieldDef?.label ?? ''}を入力してください`} hint={fieldDef?.hint} />

            {isMulti ? (
              <div>
                <div style={{ display:'flex', flexDirection:'column', gap:8, marginBottom:10 }}>
                  {multiUrls.map((u, i) => (
                    <div key={i} style={{ display:'flex', gap:8 }}>
                      <input type="url" placeholder={`URL ${i+1}`} value={u}
                        onChange={e => { const n = [...multiUrls]; n[i] = e.target.value; setMultiUrls(n) }}
                        style={{ ...inp, flex:1 }} />
                      {multiUrls.length > 1 && (
                        <button onClick={() => setMultiUrls(multiUrls.filter((_,j) => j !== i))}
                          style={{ padding:'8px 12px', borderRadius:8, border:'1px solid #FCA5A5', background:'#FEF2F2', color:'#EF4444', fontSize:13, cursor:'pointer' }}>✕</button>
                      )}
                    </div>
                  ))}
                </div>
                <button onClick={() => setMultiUrls([...multiUrls, ''])}
                  style={{ width:'100%', padding:'9px', borderRadius:8, border:'1.5px dashed #93C5FD', background:'#EFF6FF', color:'#1D4ED8', fontSize:13, fontWeight:600, cursor:'pointer', marginBottom:16 }}>
                  ＋ URLを追加
                </button>
              </div>
            ) : fieldDef?.isUrl ? (
              <input type="url" placeholder="https://..." value={textVal}
                onChange={e => setTextVal(e.target.value)} style={{ ...inp, marginBottom:16 }} />
            ) : (
              <textarea value={textVal} onChange={e => setTextVal(e.target.value)} rows={5}
                placeholder="テキストを入力してください..."
                style={{ ...inp, resize:'vertical', lineHeight:1.7, marginBottom:16 }} />
            )}

            <div style={{ display:'flex', gap:8 }}>
              <button onClick={() => setStep(2)}
                style={{ flex:1, padding:'11px', borderRadius:9, border:'1px solid #E5E7EB', background:'white', fontSize:13, cursor:'pointer' }}>← 戻る</button>
              <button onClick={() => {
                const v = getFinalValue()
                if (!v) { setError('内容を入力してください'); return }
                setError(''); setStep(4)
              }}
                style={{ flex:2, padding:'11px', borderRadius:9, border:'none', background:'#1D4ED8', color:'white', fontSize:14, fontWeight:700, cursor:'pointer' }}>
                確認する →
              </button>
            </div>
            {error && <p style={{ fontSize:12, color:'#EF4444', margin:'8px 0 0', textAlign:'center' }}>{error}</p>}
          </div>
        )}

        {/* Step 4: 確認・送信 */}
        {step === 4 && (
          <div>
            {/* 確認カード */}
            <div style={{ ...card, border:'1.5px solid #BFDBFE' }}>
              <p style={{ fontSize:12, fontWeight:700, color:'#1D4ED8', margin:'0 0 12px' }}>📋 送信内容の確認</p>
              <table style={{ width:'100%', fontSize:13, borderCollapse:'collapse' }}>
                <tbody>
                  {[
                    ['研究室', selectedLab?.name ?? ''],
                    ...(targetType === 'faculty' ? [['教員', selectedFac?.name ?? '']] : []),
                    ['情報の種類', fieldDef?.label ?? ''],
                    ['内容', getFinalValue()],
                  ].map(([k, v]) => (
                    <tr key={k} style={{ borderBottom:'1px solid #F3F4F6' }}>
                      <td style={{ padding:'7px 0', color:'#6B7280', fontWeight:600, width:90, verticalAlign:'top' }}>{k}</td>
                      <td style={{ padding:'7px 0', color:'#1F2937', wordBreak:'break-all', lineHeight:1.6 }}>{v}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* ゲストの場合は名前・メール入力 */}
            {isLoaded && !user && (
              <div style={card}>
                <p style={{ fontSize:12, fontWeight:700, color:'#6B7280', margin:'0 0 10px' }}>
                  あなたのお名前・メールアドレス
                  <span style={{ fontWeight:400, marginLeft:6, color:'#9CA3AF' }}>（任意・返信が必要な場合のみ）</span>
                </p>
                <input placeholder="お名前（例: 山田太郎）" value={guestName}
                  onChange={e => setGuestName(e.target.value)} style={{ ...inp, marginBottom:8 }} />
                <input type="email" placeholder="メールアドレス（任意）" value={guestEmail}
                  onChange={e => setGuestEmail(e.target.value)} style={inp} />
              </div>
            )}

            {/* ログインユーザーの場合は名前表示 */}
            {isLoaded && user && (
              <div style={{ background:'#F0FDF4', border:'1px solid #BBF7D0', borderRadius:10, padding:'10px 14px', marginBottom:14 }}>
                <p style={{ fontSize:12, color:'#16A34A', margin:0 }}>
                  ✅ <strong>{user.fullName ?? user.username}</strong> として投稿されます
                </p>
              </div>
            )}

            {error && <p style={{ fontSize:12, color:'#EF4444', margin:'0 0 10px', textAlign:'center' }}>{error}</p>}

            <div style={{ display:'flex', gap:8 }}>
              <button onClick={() => setStep(3)}
                style={{ flex:1, padding:'12px', borderRadius:9, border:'1px solid #E5E7EB', background:'white', fontSize:13, cursor:'pointer' }}>← 戻る</button>
              <button onClick={handleSubmit} disabled={loading}
                style={{ flex:2, padding:'12px', borderRadius:9, border:'none', background: loading ? '#9CA3AF' : '#059669', color:'white', fontSize:14, fontWeight:700, cursor: loading ? 'wait' : 'pointer' }}>
                {loading ? '⏳ 送信中...' : '📬 送信する'}
              </button>
            </div>
          </div>
        )}

      </div>
    </main>
  )
}