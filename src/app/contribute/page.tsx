'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import { useUser, SignInButton, SignOutButton } from '@clerk/nextjs'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

type Lab     = { id: string; name: string; faculty_name: string | null; dept: string | null }
type Faculty = { id: string; name: string; role: string | null }

type FieldDef = { label: string; hint?: string; isUrl?: boolean; isMulti?: boolean; isStudent?: boolean }

const LAB_FIELD_DEFS: Record<string, FieldDef> = {
  summary_text:        { label: '📝 研究概要テキスト' },
  lab_url:             { label: '🔗 公式HP URL',                 isUrl: true },
  intro_url:           { label: '🔗 紹介ページ URL（研究科等）', isUrl: true },
  student_count:       { label: '👥 学生数',                     isStudent: true },
  instagram_url:       { label: '📷 公式 Instagram URL',        isUrl: true },
  twitter_url:         { label: '🐦 公式 X URL',                isUrl: true },
  youtube_channel_url: { label: '▶️ 公式 YouTube チャンネル',   isUrl: true },
  youtube_video_urls:  { label: '▶️ 紹介 YouTube 動画',         isUrl: true, isMulti: true },
  instagram_url_other: { label: '📷 紹介 Instagram（非公式）',  isUrl: true, isMulti: true },
  twitter_url_other:   { label: '🐦 紹介 X（非公式）',          isUrl: true, isMulti: true },
}

const FAC_FIELD_DEFS: Record<string, FieldDef> = {
  fac_researchmap: { label: '🔬 researchmap URL', isUrl: true, hint: 'URLを貼るとIDを自動抽出します' },
  fac_twitter_url: { label: '🐦 X URL',           isUrl: true },
  fac_instagram:   { label: '📷 Instagram URL',   isUrl: true },
  fac_x_username:  { label: '🐦 X アカウント名（@以下）', hint: '例: tohoku_lab_abc' },
}

const font = "system-ui,'Noto Sans JP',sans-serif"
const inp: React.CSSProperties  = { width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 14, boxSizing: 'border-box', outline: 'none', fontFamily: font }
const sel: React.CSSProperties  = { ...inp, background: 'white', cursor: 'pointer' }
const card: React.CSSProperties = { background: 'white', border: '1px solid #E5E7EB', borderRadius: 14, padding: '18px 20px', marginBottom: 14 }

function Label({ text, hint }: { text: string; hint?: string }) {
  return (
    <p style={{ fontSize: 12, fontWeight: 700, color: '#6B7280', margin: '0 0 8px' }}>
      {text}{hint && <span style={{ fontWeight: 400, marginLeft: 6, color: '#9CA3AF' }}>（{hint}）</span>}
    </p>
  )
}

function ContributeInner() {
  const { user, isLoaded } = useUser()
  const searchParams = useSearchParams()

  const initialLabId   = searchParams.get('lab_id')   ?? ''
  const initialLabName = decodeURIComponent(searchParams.get('lab_name') ?? '')

  const [step,       setStep]       = useState<1 | 2 | 3 | 4>(initialLabId ? 2 : 1)
  const [submitted,  setSubmitted]  = useState(false)

  const [labs,       setLabs]       = useState<Lab[]>([])
  const [query,      setQuery]      = useState('')
  const [labId,      setLabId]      = useState(initialLabId)
  const [labName,    setLabName]    = useState(initialLabName)
  const [targetType, setTargetType] = useState<'lab' | 'faculty'>('lab')
  const [faculties,  setFaculties]  = useState<Faculty[]>([])
  const [facId,      setFacId]      = useState('')

  const [fieldKey,   setFieldKey]   = useState('')
  const [textVal,    setTextVal]    = useState('')
  const [multiUrls,  setMultiUrls]  = useState<string[]>([''])

  // 学生数内訳
  const [docCount,    setDocCount]    = useState('')
  const [masterCount, setMasterCount] = useState('')
  const [underCount,  setUnderCount]  = useState('')
  const [totalCount,  setTotalCount]  = useState('')

  const [guestName,  setGuestName]  = useState('')
  const [guestEmail, setGuestEmail] = useState('')
  const [loading,    setLoading]    = useState(false)
  const [error,      setError]      = useState('')

  useEffect(() => {
    sb.from('labs').select('id,name,faculty_name,dept').order('dept').order('name')
      .then(({ data }) => { if (data) setLabs(data) })
  }, [])

  // ── 変更点：faculty_labs 経由で教員を取得 ──────────────────────────────
  useEffect(() => {
    if (labId && targetType === 'faculty') {
      sb.from('faculty_labs')
        .select('role, faculties(id, name)')
        .eq('lab_id', labId)
        .order('created_at')
        .then(({ data }) => {
          if (!data) { setFaculties([]); return }
          const mapped: Faculty[] = data
            .map((row: { role: string | null; faculties: { id: string; name: string } | null }) => {
              if (!row.faculties) return null
              return { id: row.faculties.id, name: row.faculties.name, role: row.role ?? null }
            })
            .filter(Boolean) as Faculty[]
          setFaculties(mapped)
        })
    } else {
      setFaculties([])
    }
  }, [labId, targetType])
  // ─────────────────────────────────────────────────────────────────────────

  const filtered = labs.filter(l =>
    l.name.includes(query) || (l.faculty_name ?? '').includes(query) || (l.dept ?? '').includes(query)
  )

  const currentFieldDefs = targetType === 'lab' ? LAB_FIELD_DEFS : FAC_FIELD_DEFS
  const fieldDef    = fieldKey ? currentFieldDefs[fieldKey] : null
  const isMulti     = !!fieldDef?.isMulti
  const isStudent   = !!fieldDef?.isStudent
  const selectedFac = faculties.find(f => f.id === facId)

  // 学生数の自動合計
  const autoTotal = Number(docCount || 0) + Number(masterCount || 0) + Number(underCount || 0)
  const hasBreakdown = Number(docCount) > 0 || Number(masterCount) > 0 || Number(underCount) > 0

  function getFinalValue(): string {
    if (isStudent) return hasBreakdown ? String(autoTotal) : totalCount.trim()
    if (isMulti)   return multiUrls.filter(u => u.trim()).join('\n')
    return textVal.trim()
  }

  // Step3の確認表示用
  function getConfirmRows(): [string, string][] {
    if (isStudent) {
      const rows: [string, string][] = []
      if (Number(docCount)    > 0) rows.push(['博士課程',    `${docCount}名`])
      if (Number(masterCount) > 0) rows.push(['修士課程',    `${masterCount}名`])
      if (Number(underCount)  > 0) rows.push(['学部',        `${underCount}名`])
      if (hasBreakdown)            rows.push(['全体（自動）', `${autoTotal}名`])
      else if (totalCount)         rows.push(['全体',         `${totalCount}名`])
      return rows
    }
    return [['内容', getFinalValue()]]
  }

  function handleLabSelect(id: string, name: string) {
    setLabId(id); setLabName(name); setFieldKey(''); setFacId('')
    setStep(2)
  }

  function handleNext2() {
    if (targetType === 'faculty' && !facId) { setError('教員を選択してください'); return }
    if (!fieldKey) { setError('提供する情報の種類を選択してください'); return }
    setError('')
    setTextVal(''); setMultiUrls([''])
    setDocCount(''); setMasterCount(''); setUnderCount(''); setTotalCount('')
    setStep(3)
  }

  function handleNext3() {
    if (isStudent) {
      if (!hasBreakdown && !totalCount.trim()) { setError('学生数を入力してください'); return }
    } else {
      const v = getFinalValue()
      if (!v) { setError('内容を入力してください'); return }
    }
    setError(''); setStep(4)
  }

  async function handleSubmit() {
    setLoading(true); setError('')

    const contributor = user
      ? (user.fullName ?? user.username ?? user.emailAddresses[0]?.emailAddress ?? 'Labo Naviユーザー')
      : null

    const basePayload = {
      lab_id:      labId,
      target_type: targetType === 'faculty' ? 'faculty' : 'lab',
      target_id:   targetType === 'faculty' ? facId : labId,
      contributor,
      guest_name:  !user ? (guestName || null) : null,
      guest_email: !user ? (guestEmail || null) : null,
    }

    // 学生数は複数フィールドを一括送信
    if (isStudent) {
      const sends: { field: string; new_value: string }[] = []
      if (Number(docCount)    > 0) sends.push({ field: 'student_count_doc',    new_value: docCount })
      if (Number(masterCount) > 0) sends.push({ field: 'student_count_master', new_value: masterCount })
      if (Number(underCount)  > 0) sends.push({ field: 'student_count_under',  new_value: underCount })
      const total = hasBreakdown ? String(autoTotal) : totalCount.trim()
      if (total) sends.push({ field: 'student_count', new_value: total })

      let ok = true
      for (const s of sends) {
        const res = await fetch('/api/contribute', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...basePayload, ...s }),
        })
        if (!res.ok) ok = false
      }
      if (ok) setSubmitted(true)
      else setError('送信に失敗しました。もう一度お試しください。')
      setLoading(false)
      return
    }

    // 通常フィールド
    const value = getFinalValue()
    let saveValue = value
    if (fieldKey === 'fac_researchmap' && value.includes('researchmap.jp/')) {
      saveValue = value.split('researchmap.jp/').pop()?.split('/')[0] ?? value
    }
    const dbField = (() => {
      if (fieldKey === 'fac_researchmap') return 'researchmap_id'
      if (fieldKey === 'fac_twitter_url') return 'twitter_url'
      if (fieldKey === 'fac_instagram')   return 'instagram_url'
      if (fieldKey === 'fac_x_username')  return 'x_username'
      return fieldKey
    })()

    const res = await fetch('/api/contribute', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...basePayload, field: dbField, new_value: saveValue }),
    })

    if (res.ok) setSubmitted(true)
    else setError('送信に失敗しました。もう一度お試しください。')
    setLoading(false)
  }

  if (submitted) return (
    <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F9FAFB', fontFamily: font }}>
      <div style={{ textAlign: 'center', padding: '0 20px' }}>
        <p style={{ fontSize: 48, margin: '0 0 16px' }}>🎉</p>
        <h1 style={{ fontSize: 20, fontWeight: 800, color: '#1F2937', margin: '0 0 8px' }}>ありがとうございます！</h1>
        <p style={{ fontSize: 14, color: '#6B7280', margin: '0 0 24px', lineHeight: 1.7 }}>
          いただいた情報は管理者が確認後、<br />マップに反映されます。
        </p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
          <button onClick={() => {
            setSubmitted(false); setStep(2); setFieldKey(''); setFacId('')
            setTextVal(''); setMultiUrls([''])
            setDocCount(''); setMasterCount(''); setUnderCount(''); setTotalCount('')
          }}
            style={{ padding: '10px 20px', borderRadius: 8, border: '1.5px solid #E5E7EB', background: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            続けて投稿する（同じ研究室）
          </button>
          <a href="/map" style={{ padding: '10px 20px', borderRadius: 8, border: 'none', background: '#1D4ED8', color: 'white', fontSize: 13, fontWeight: 600, textDecoration: 'none', display: 'inline-block' }}>
            マップに戻る
          </a>
        </div>
      </div>
    </main>
  )

  return (
    <main style={{ minHeight: '100vh', background: '#F9FAFB', fontFamily: font }}>
      <header style={{ background: 'white', borderBottom: '1px solid #E5E7EB', padding: '13px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 10 }}>
        <div>
          <span style={{ fontSize: 15, fontWeight: 800 }}>📬 情報を提供する</span>
          <span style={{ fontSize: 11, color: '#9CA3AF', marginLeft: 8 }}>Labo Navi</span>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {isLoaded && (
            user ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 12, color: '#6B7280' }}>{user.fullName ?? user.username}</span>
                <SignOutButton>
                  <button style={{ fontSize: 11, color: '#9CA3AF', padding: '4px 8px', borderRadius: 6, border: '1px solid #E5E7EB', background: 'white', cursor: 'pointer' }}>ログアウト</button>
                </SignOutButton>
              </div>
            ) : (
              <SignInButton mode="modal">
                <button style={{ fontSize: 12, color: '#1D4ED8', padding: '5px 12px', borderRadius: 7, border: '1.5px solid #BFDBFE', background: '#EFF6FF', fontWeight: 600, cursor: 'pointer' }}>
                  🔑 ログイン
                </button>
              </SignInButton>
            )
          )}
          <a href="/map" style={{ fontSize: 12, color: '#6B7280', textDecoration: 'none', padding: '5px 10px', borderRadius: 7, border: '1px solid #E5E7EB' }}>← マップ</a>
        </div>
      </header>

      {isLoaded && !user && (
        <div style={{ background: '#EFF6FF', borderBottom: '1px solid #BFDBFE', padding: '10px 16px' }}>
          <p style={{ fontSize: 12, color: '#1D4ED8', margin: 0, textAlign: 'center' }}>
            💡 <strong>Labo Naviアカウント</strong>でログインすると、あなたの投稿として記録されます。
            <SignInButton mode="modal">
              <button style={{ marginLeft: 8, fontSize: 12, color: '#1D4ED8', fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>ログイン・新規登録</button>
            </SignInButton>
          </p>
        </div>
      )}

      <div style={{ maxWidth: 560, margin: '0 auto', padding: '20px 16px 60px' }}>

        {/* ステッププログレス */}
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 24, gap: 0 }}>
          {[
            { n: 1, label: '研究室' },
            { n: 2, label: '情報の種類' },
            { n: 3, label: '内容入力' },
            { n: 4, label: '送信' },
          ].map(({ n, label }, i) => (
            <div key={n} style={{ display: 'flex', alignItems: 'center', flex: i < 3 ? 1 : 0 }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{
                  width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700,
                  background: step >= n ? '#1D4ED8' : '#E5E7EB',
                  color: step >= n ? 'white' : '#9CA3AF',
                }}>
                  {step > n ? '✓' : n}
                </div>
                <span style={{ fontSize: 10, color: step >= n ? '#1D4ED8' : '#9CA3AF', marginTop: 3, fontWeight: step === n ? 700 : 400, whiteSpace: 'nowrap' }}>{label}</span>
              </div>
              {i < 3 && <div style={{ flex: 1, height: 2, background: step > n ? '#1D4ED8' : '#E5E7EB', margin: '0 4px', marginBottom: 14 }} />}
            </div>
          ))}
        </div>

        {/* Step 1: 研究室選択 */}
        {step === 1 && (
          <div style={card}>
            <Label text="どの研究室の情報ですか？" />
            <input placeholder="研究室名・教員名・専攻で絞り込み" value={query}
              onChange={e => setQuery(e.target.value)} style={{ ...inp, marginBottom: 10 }} />
            <select
              value={labId}
              onChange={e => {
                const id = e.target.value
                const lab = labs.find(l => l.id === id)
                if (id && lab) handleLabSelect(id, lab.name)
                else setLabId('')
              }}
              style={{ ...sel, marginBottom: 16 }}>
              <option value="">── 研究室を選んでください（{filtered.length}件） ──</option>
              {filtered.map(l => (
                <option key={l.id} value={l.id}>
                  {l.name}　{l.faculty_name ? `/ ${l.faculty_name}` : ''}　{l.dept ? `【${l.dept}】` : ''}
                </option>
              ))}
            </select>
            {error && <p style={{ fontSize: 12, color: '#EF4444', margin: '0 0 8px', textAlign: 'center' }}>{error}</p>}
          </div>
        )}

        {/* Step 2: 情報の種類 */}
        {step === 2 && (
          <div style={card}>
            <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 9, padding: '9px 13px', marginBottom: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#166534' }}>🏫 {labName}</span>
              {!initialLabId && (
                <button onClick={() => { setStep(1); setFieldKey(''); setFacId('') }}
                  style={{ fontSize: 11, color: '#6B7280', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>変更</button>
              )}
            </div>

            <Label text="どの情報を提供しますか？" />

            <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
              {(['lab', 'faculty'] as const).map(t => (
                <button key={t} onClick={() => { setTargetType(t); setFacId(''); setFieldKey('') }}
                  style={{ flex: 1, padding: '10px', borderRadius: 8, cursor: 'pointer', fontSize: 13,
                    border: `1.5px solid ${targetType === t ? '#3B82F6' : '#E5E7EB'}`,
                    background: targetType === t ? '#EFF6FF' : 'white',
                    color: targetType === t ? '#1D4ED8' : '#374151',
                    fontWeight: targetType === t ? 700 : 400,
                  }}>
                  {t === 'lab' ? '🏫 研究室の情報' : '👤 特定の教員の情報'}
                </button>
              ))}
            </div>

            {targetType === 'faculty' && (
              <div style={{ marginBottom: 14 }}>
                <Label text="どの教員ですか？" />
                {faculties.length === 0
                  ? <p style={{ fontSize: 12, color: '#9CA3AF' }}>読み込み中...</p>
                  : <select value={facId} onChange={e => { setFacId(e.target.value); setFieldKey('') }} style={{ ...sel, marginBottom: 0 }}>
                      <option value="">── 教員を選んでください ──</option>
                      {faculties.map(f => <option key={f.id} value={f.id}>{f.name}　{f.role ? `（${f.role}）` : ''}</option>)}
                    </select>
                }
              </div>
            )}

            {(targetType === 'lab' || (targetType === 'faculty' && facId)) && (
              <div style={{ marginBottom: 16 }}>
                <Label text="何の情報を提供しますか？" />
                <select value={fieldKey} onChange={e => setFieldKey(e.target.value)} style={sel}>
                  <option value="">── 種類を選んでください ──</option>
                  {Object.entries(currentFieldDefs).map(([k, v]) => (
                    <option key={k} value={k}>{v.label}{v.hint ? `（${v.hint}）` : ''}</option>
                  ))}
                </select>
              </div>
            )}

            <div style={{ display: 'flex', gap: 8 }}>
              {!initialLabId && (
                <button onClick={() => setStep(1)}
                  style={{ flex: 1, padding: '11px', borderRadius: 9, border: '1px solid #E5E7EB', background: 'white', fontSize: 13, cursor: 'pointer' }}>← 戻る</button>
              )}
              <button onClick={handleNext2}
                style={{ flex: 2, padding: '11px', borderRadius: 9, border: 'none', background: '#1D4ED8', color: 'white', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
                次へ →
              </button>
            </div>
            {error && <p style={{ fontSize: 12, color: '#EF4444', margin: '8px 0 0', textAlign: 'center' }}>{error}</p>}
          </div>
        )}

        {/* Step 3: 内容入力 */}
        {step === 3 && fieldDef && (
          <div style={card}>
            <Label text={`${fieldDef.label}を入力してください`} hint={fieldDef.hint} />

            {/* 学生数専用UI */}
            {isStudent ? (
              <div>
                <p style={{ fontSize: 11, color: '#6B7280', margin: '0 0 10px', fontWeight: 600 }}>内訳（わかる範囲で入力）</p>
                {[
                  { key: 'doc',    label: '博士課程', val: docCount,    set: setDocCount    },
                  { key: 'master', label: '修士課程', val: masterCount, set: setMasterCount },
                  { key: 'under',  label: '学部',     val: underCount,  set: setUnderCount  },
                ].map(({ key, label, val, set }) => (
                  <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                    <span style={{ fontSize: 12, color: '#6B7280', width: 72, flexShrink: 0 }}>{label}</span>
                    <input type="number" min="0" placeholder="0" value={val}
                      onChange={e => set(e.target.value)}
                      style={{ ...inp, width: 90 }} />
                    <span style={{ fontSize: 12, color: '#9CA3AF' }}>名</span>
                  </div>
                ))}

                {hasBreakdown && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 8, marginBottom: 12 }}>
                    <span style={{ fontSize: 12, color: '#166534', fontWeight: 700 }}>合計 {autoTotal}名</span>
                    <span style={{ fontSize: 11, color: '#16A34A' }}>→ 全体学生数に自動入力されます</span>
                  </div>
                )}

                <div style={{ borderTop: '1px solid #E5E7EB', paddingTop: 12, marginTop: 4 }}>
                  <p style={{ fontSize: 11, color: '#9CA3AF', margin: '0 0 8px' }}>内訳がわからない場合は全体のみ入力</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 12, color: '#6B7280', width: 72, flexShrink: 0 }}>全体</span>
                    <input type="number" min="0" placeholder="0"
                      value={hasBreakdown ? String(autoTotal) : totalCount}
                      onChange={e => { if (!hasBreakdown) setTotalCount(e.target.value) }}
                      disabled={hasBreakdown}
                      style={{ ...inp, width: 90, background: hasBreakdown ? '#F9FAFB' : 'white', color: hasBreakdown ? '#9CA3AF' : '#1F2937' }} />
                    <span style={{ fontSize: 12, color: '#9CA3AF' }}>名</span>
                  </div>
                </div>
                <div style={{ height: 16 }} />
              </div>
            ) : isMulti ? (
              <div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 10 }}>
                  {multiUrls.map((u, i) => (
                    <div key={i} style={{ display: 'flex', gap: 8 }}>
                      <input type="url" placeholder={`URL ${i + 1}`} value={u}
                        onChange={e => { const n = [...multiUrls]; n[i] = e.target.value; setMultiUrls(n) }}
                        style={{ ...inp, flex: 1 }} />
                      {multiUrls.length > 1 && (
                        <button onClick={() => setMultiUrls(multiUrls.filter((_, j) => j !== i))}
                          style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #FCA5A5', background: '#FEF2F2', color: '#EF4444', fontSize: 13, cursor: 'pointer' }}>✕</button>
                      )}
                    </div>
                  ))}
                </div>
                <button onClick={() => setMultiUrls([...multiUrls, ''])}
                  style={{ width: '100%', padding: '9px', borderRadius: 8, border: '1.5px dashed #93C5FD', background: '#EFF6FF', color: '#1D4ED8', fontSize: 13, fontWeight: 600, cursor: 'pointer', marginBottom: 16 }}>
                  ＋ URLを追加
                </button>
              </div>
            ) : fieldDef.isUrl ? (
              <input type="url" placeholder="https://..." value={textVal}
                onChange={e => setTextVal(e.target.value)} style={{ ...inp, marginBottom: 16 }} />
            ) : (
              <textarea value={textVal} onChange={e => setTextVal(e.target.value)} rows={5}
                placeholder="テキストを入力してください..."
                style={{ ...inp, resize: 'vertical', lineHeight: 1.7, marginBottom: 16 }} />
            )}

            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setStep(2)}
                style={{ flex: 1, padding: '11px', borderRadius: 9, border: '1px solid #E5E7EB', background: 'white', fontSize: 13, cursor: 'pointer' }}>← 戻る</button>
              <button onClick={handleNext3}
                style={{ flex: 2, padding: '11px', borderRadius: 9, border: 'none', background: '#1D4ED8', color: 'white', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
                確認する →
              </button>
            </div>
            {error && <p style={{ fontSize: 12, color: '#EF4444', margin: '8px 0 0', textAlign: 'center' }}>{error}</p>}
          </div>
        )}

        {/* Step 4: 確認・送信 */}
        {step === 4 && (
          <div>
            <div style={{ ...card, border: '1.5px solid #BFDBFE' }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: '#1D4ED8', margin: '0 0 12px' }}>📋 送信内容の確認</p>
              <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
                <tbody>
                  {[
                    ['研究室', labName] as [string, string],
                    ...(targetType === 'faculty' ? [['教員', selectedFac?.name ?? ''] as [string, string]] : []),
                    ['情報の種類', fieldDef?.label ?? ''] as [string, string],
                    ...getConfirmRows(),
                  ].map(([k, v]) => (
                    <tr key={k} style={{ borderBottom: '1px solid #F3F4F6' }}>
                      <td style={{ padding: '7px 0', color: '#6B7280', fontWeight: 600, width: 90, verticalAlign: 'top' }}>{k}</td>
                      <td style={{ padding: '7px 0', color: '#1F2937', wordBreak: 'break-all', lineHeight: 1.6 }}>{v}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {isLoaded && !user && (
              <div style={card}>
                <p style={{ fontSize: 12, fontWeight: 700, color: '#6B7280', margin: '0 0 10px' }}>
                  あなたのお名前・メールアドレス
                  <span style={{ fontWeight: 400, marginLeft: 6, color: '#9CA3AF' }}>（任意）</span>
                </p>
                <input placeholder="お名前（例: 山田太郎）" value={guestName}
                  onChange={e => setGuestName(e.target.value)} style={{ ...inp, marginBottom: 8 }} />
                <input type="email" placeholder="メールアドレス（任意）" value={guestEmail}
                  onChange={e => setGuestEmail(e.target.value)} style={inp} />
              </div>
            )}

            {isLoaded && user && (
              <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 10, padding: '10px 14px', marginBottom: 14 }}>
                <p style={{ fontSize: 12, color: '#16A34A', margin: 0 }}>
                  ✅ <strong>{user.fullName ?? user.username}</strong> として投稿されます
                </p>
              </div>
            )}

            {error && <p style={{ fontSize: 12, color: '#EF4444', margin: '0 0 10px', textAlign: 'center' }}>{error}</p>}

            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setStep(3)}
                style={{ flex: 1, padding: '12px', borderRadius: 9, border: '1px solid #E5E7EB', background: 'white', fontSize: 13, cursor: 'pointer' }}>← 戻る</button>
              <button onClick={handleSubmit} disabled={loading}
                style={{ flex: 2, padding: '12px', borderRadius: 9, border: 'none', background: loading ? '#9CA3AF' : '#059669', color: 'white', fontSize: 14, fontWeight: 700, cursor: loading ? 'wait' : 'pointer' }}>
                {loading ? '⏳ 送信中...' : '📬 送信する'}
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}

export default function ContributePage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'sans-serif', color: '#9CA3AF' }}>読み込み中...</div>}>
      <ContributeInner />
    </Suspense>
  )
}