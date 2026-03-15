'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// ── 型 ──────────────────────────────────────────
type Lab = { id: string; name: string; faculty_name: string | null; dept: string | null }
type Faculty = { id: string; name: string; role: string | null; researchmap_id: string | null }
type Target = 'lab' | 'faculty'
type Mode   = 'url' | 'screenshot' | 'instagram' | 'manual'

// labsの更新可能フィールド
const LAB_FIELDS: Record<string, string> = {
  summary_text:              '研究概要テキスト',
  summary_source_url:        '概要の出典URL',
  summary_source_url_override: '概要出典URL（手動上書き）',
  lab_url:                   '研究室HP URL',
  summary_short:             '短い紹介文',
  summary_bullets:           '箇条書きサマリ',
}

// facultiesの更新可能フィールド
const FACULTY_FIELDS: Record<string, string> = {
  researchmap_id:  'researchmap ID',
  twitter_url:     'X（Twitter）URL',
  instagram_url:   'Instagram URL',
  x_username:      'X ユーザー名（@なし）',
  source_note:     'メモ（情報出典など）',
}

const PW = process.env.NEXT_PUBLIC_ADMIN_PASSWORD ?? 'admin2024'
const font = "system-ui,'Noto Sans JP',sans-serif"
const card: React.CSSProperties = {
  background: 'white', border: '1px solid #E5E7EB',
  borderRadius: 12, padding: '16px 18px', marginBottom: 12,
}

// ── コンポーネント ──────────────────────────────
export default function AdminDataPage() {
  const [authed,   setAuthed]   = useState(false)
  const [pw,       setPw]       = useState('')
  const [labs,     setLabs]     = useState<Lab[]>([])
  const [query,    setQuery]    = useState('')
  const [labId,    setLabId]    = useState('')
  const [target,   setTarget]   = useState<Target>('lab')
  const [faculties, setFaculties] = useState<Faculty[]>([])
  const [facId,    setFacId]    = useState('')
  const [labField, setLabField] = useState(Object.keys(LAB_FIELDS)[0])
  const [facField, setFacField] = useState(Object.keys(FACULTY_FIELDS)[0])
  const [mode,     setMode]     = useState<Mode>('url')
  const [url,      setUrl]      = useState('')
  const [manualText, setManualText] = useState('')
  const [imgFile,  setImgFile]  = useState<File | null>(null)
  const [preview,  setPreview]  = useState('')
  const [loading,  setLoading]  = useState(false)
  const [saved,    setSaved]    = useState(false)
  const [currentVal, setCurrentVal] = useState<string>('')  // 既存値プレビュー

  // ─ 初期ロード
  useEffect(() => { if (authed) fetchLabs() }, [authed])

  // ─ 研究室変更 → 教員リスト取得 & 既存値クリア
  useEffect(() => {
    setFacId(''); setFaculties([]); setPreview(''); setCurrentVal('')
    if (labId && target === 'faculty') fetchFaculties(labId)
    if (labId && target === 'lab') fetchCurrentVal(labId, labField, 'lab')
  }, [labId, target])

  // ─ 教員 / フィールド変更 → 既存値更新
  useEffect(() => {
    if (labId && target === 'lab') fetchCurrentVal(labId, labField, 'lab')
  }, [labField])
  useEffect(() => {
    if (facId) fetchCurrentVal(facId, facField, 'faculty')
  }, [facId, facField])

  async function fetchLabs() {
    const { data } = await sb.from('labs').select('id,name,faculty_name,dept').order('dept').order('name')
    if (data) setLabs(data)
  }

  async function fetchFaculties(lId: string) {
    const { data } = await sb.from('faculties').select('id,name,role,researchmap_id').eq('lab_id', lId).order('name')
    if (data) setFaculties(data)
  }

  async function fetchCurrentVal(id: string, field: string, tbl: 'lab' | 'faculty') {
    const table = tbl === 'lab' ? 'labs' : 'faculties'
    const { data } = await sb.from(table).select(field).eq('id', id).single()
    setCurrentVal((data as Record<string, string> | null)?.[field] ?? '')
  }

  // ─ フィルタ
  const filtered = labs.filter(l =>
    l.name.includes(query) || (l.faculty_name ?? '').includes(query) || (l.dept ?? '').includes(query)
  )

  // ─ URL読み取り
  async function handleFetchUrl() {
    if (!url) return
    setLoading(true); setPreview('')
    try {
      const res = await fetch('/api/admin/fetch-url', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, mode: target, field: target === 'lab' ? labField : facField })
      })
      const d = await res.json()
      setPreview(d.text ?? 'テキストを取得できませんでした')
    } catch { setPreview('エラーが発生しました') }
    setLoading(false)
  }

  // ─ OCR
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
      setPreview(d.text ?? 'テキストを取得できませんでした')
      setLoading(false)
    }
    reader.readAsDataURL(imgFile)
  }

  // ─ 保存
  async function handleSave() {
    if (!labId) return alert('研究室を選択してください')
    if (target === 'faculty' && !facId) return alert('教員を選択してください')

    const value = mode === 'manual' ? manualText : preview
    if (!value.trim()) return alert('保存する内容がありません')

    setLoading(true)
    const now = new Date().toISOString()

    if (target === 'lab') {
      await sb.from('labs').update({ [labField]: value, updated_at: now }).eq('id', labId)
    } else {
      // researchmap_id は URL全体ではなく ID部分だけを保存
      let saveVal = value
      if (facField === 'researchmap_id' && value.includes('researchmap.jp/')) {
        saveVal = value.split('researchmap.jp/').pop()?.split('/')[0] ?? value
      }
      await sb.from('faculties').update({ [facField]: saveVal, updated_at: now }).eq('id', facId)
    }

    // Instagram は evidence にも保存（埋め込み用）
    if (mode === 'instagram') {
      await sb.from('evidence').upsert({
        lab_id: labId, source_type: 'instagram',
        source_url: value, raw_text: value, created_at: now
      } as never)
    }

    setLoading(false); setSaved(true)
    setCurrentVal(value)
    setTimeout(() => { setSaved(false); setPreview(''); setUrl(''); setManualText(''); setImgFile(null) }, 2000)
  }

  // ─ スタイルヘルパー
  const modeBtn = (m: Mode) => ({
    padding: '9px 12px', borderRadius: 8, cursor: 'pointer', fontSize: 13,
    textAlign: 'left' as const, width: '100%',
    border: `1.5px solid ${mode === m ? '#3B82F6' : '#E5E7EB'}`,
    background: mode === m ? 'rgba(59,130,246,0.07)' : 'white',
    color: mode === m ? '#1D4ED8' : '#374151',
    fontWeight: mode === m ? 600 : 400,
  })
  const targetBtn = (t: Target) => ({
    flex: 1, padding: '10px', borderRadius: 8, cursor: 'pointer',
    border: `1.5px solid ${target === t ? '#3B82F6' : '#E5E7EB'}`,
    background: target === t ? '#EFF6FF' : 'white',
    color: target === t ? '#1D4ED8' : '#374151',
    fontSize: 13, fontWeight: target === t ? 700 : 400,
  })

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '9px 12px', borderRadius: 8,
    border: '1px solid #E5E7EB', fontSize: 13, boxSizing: 'border-box',
    outline: 'none', fontFamily: font,
  }
  const selectStyle: React.CSSProperties = { ...inputStyle, background: 'white', cursor: 'pointer' }
  const label = (t: string) => (
    <p style={{ fontSize: 11, fontWeight: 700, color: '#6B7280', margin: '0 0 6px', letterSpacing: '0.04em' }}>{t}</p>
  )

  // ─ ログイン画面
  if (!authed) return (
    <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F9FAFB', fontFamily: font }}>
      <div style={{ background: 'white', borderRadius: 16, padding: '32px 28px', width: 320, border: '1px solid #E5E7EB' }}>
        <h1 style={{ fontSize: 17, fontWeight: 800, margin: '0 0 4px' }}>データ投入</h1>
        <p style={{ fontSize: 12, color: '#9CA3AF', margin: '0 0 20px' }}>管理者パスワードでログイン</p>
        <input type="password" placeholder="パスワード" value={pw}
          onChange={e => setPw(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && (pw === PW ? setAuthed(true) : alert('パスワードが違います'))}
          style={{ ...inputStyle, marginBottom: 10 }} />
        <button onClick={() => pw === PW ? setAuthed(true) : alert('パスワードが違います')}
          style={{ width: '100%', padding: '10px', borderRadius: 8, border: 'none', background: '#1D4ED8', color: 'white', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
          ログイン
        </button>
      </div>
    </main>
  )

  // ─ メイン画面
  return (
    <main style={{ minHeight: '100vh', background: '#F9FAFB', fontFamily: font }}>
      {/* ヘッダー */}
      <header style={{ background: 'white', borderBottom: '1px solid #E5E7EB', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 10 }}>
        <div>
          <span style={{ fontSize: 15, fontWeight: 800 }}>📥 データ投入</span>
          <span style={{ fontSize: 11, color: '#9CA3AF', marginLeft: 8 }}>研究室DBの更新</span>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <a href="/admin" style={{ fontSize: 12, color: '#6B7280', textDecoration: 'none', padding: '5px 10px', borderRadius: 7, border: '1px solid #E5E7EB' }}>管理画面</a>
          <a href="/" style={{ fontSize: 12, color: '#6B7280', textDecoration: 'none', padding: '5px 10px', borderRadius: 7, border: '1px solid #E5E7EB' }}>マップ</a>
        </div>
      </header>

      <div style={{ maxWidth: 600, margin: '0 auto', padding: '16px 14px 40px' }}>

        {/* ① 研究室選択 */}
        <div style={card}>
          {label('① 研究室を選択')}
          <input placeholder="研究室名 / 教員名 / 専攻で絞り込み" value={query}
            onChange={e => setQuery(e.target.value)} style={{ ...inputStyle, marginBottom: 8 }} />
          <select value={labId} onChange={e => { setLabId(e.target.value); setTarget('lab') }} style={selectStyle}>
            <option value="">-- 研究室を選んでください ({filtered.length}件) --</option>
            {filtered.map(l => (
              <option key={l.id} value={l.id}>
                {l.name}　{l.faculty_name ? `／ ${l.faculty_name}` : ''}　{l.dept ? `【${l.dept}】` : ''}
              </option>
            ))}
          </select>
        </div>

        {labId && (<>
          {/* ② 研究室 or 教員 */}
          <div style={card}>
            {label('② 更新する対象')}
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setTarget('lab')} style={targetBtn('lab')}>🏫 研究室の情報</button>
              <button onClick={() => { setTarget('faculty'); fetchFaculties(labId) }} style={targetBtn('faculty')}>👤 教員の情報</button>
            </div>
          </div>

          {/* 教員選択（targetがfacultyの時） */}
          {target === 'faculty' && (
            <div style={card}>
              {label('③-a 教員を選択')}
              {faculties.length === 0
                ? <p style={{ fontSize: 12, color: '#9CA3AF', margin: 0 }}>読み込み中...</p>
                : <select value={facId} onChange={e => setFacId(e.target.value)} style={selectStyle}>
                    <option value="">-- 教員を選んでください ({faculties.length}名) --</option>
                    {faculties.map(f => (
                      <option key={f.id} value={f.id}>
                        {f.name}　{f.role ? `（${f.role}）` : ''}　{f.researchmap_id ? '✓RM' : ''}
                      </option>
                    ))}
                  </select>
              }
            </div>
          )}

          {/* フィールド選択 */}
          {(target === 'lab' || (target === 'faculty' && facId)) && (
            <div style={card}>
              {label(target === 'lab' ? '③ 更新するフィールド' : '③-b 更新するフィールド')}
              <select
                value={target === 'lab' ? labField : facField}
                onChange={e => target === 'lab' ? setLabField(e.target.value) : setFacField(e.target.value)}
                style={selectStyle}>
                {Object.entries(target === 'lab' ? LAB_FIELDS : FACULTY_FIELDS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>

              {/* 既存値表示 */}
              {currentVal && (
                <div style={{ marginTop: 10, background: '#F9FAFB', borderRadius: 8, padding: '8px 10px', border: '1px solid #E5E7EB' }}>
                  <p style={{ fontSize: 10, color: '#9CA3AF', margin: '0 0 3px', fontWeight: 700 }}>現在の値</p>
                  <p style={{ fontSize: 12, color: '#374151', margin: 0, wordBreak: 'break-all', lineHeight: 1.6 }}>
                    {currentVal.length > 200 ? currentVal.slice(0, 200) + '…' : currentVal}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* ④ 入力方法 */}
          {(target === 'lab' || (target === 'faculty' && facId)) && (
            <div style={card}>
              {label('④ 情報の追加方法')}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
                <button onClick={() => { setMode('url'); setPreview('') }} style={modeBtn('url')}>🔗 URL → AI読み取り</button>
                <button onClick={() => { setMode('screenshot'); setPreview('') }} style={modeBtn('screenshot')}>📸 スクショ → OCR</button>
                <button onClick={() => { setMode('instagram'); setPreview('') }} style={modeBtn('instagram')}>📷 Instagram URL</button>
                <button onClick={() => { setMode('manual'); setPreview('') }} style={modeBtn('manual')}>✏️ 直接入力</button>
              </div>

              {/* URLモード */}
              {mode === 'url' && (
                <div>
                  <input type="url" placeholder="https://..." value={url}
                    onChange={e => setUrl(e.target.value)} style={{ ...inputStyle, marginBottom: 8 }} />
                  <button onClick={handleFetchUrl} disabled={loading || !url}
                    style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid #D1D5DB', background: '#F3F4F6', fontSize: 13, fontWeight: 600, cursor: loading ? 'wait' : 'pointer', opacity: !url ? 0.5 : 1 }}>
                    {loading ? '⏳ 読み取り中...' : 'AIでテキストを取得'}
                  </button>
                </div>
              )}

              {/* スクショモード */}
              {mode === 'screenshot' && (
                <div>
                  <input type="file" accept="image/*" onChange={e => setImgFile(e.target.files?.[0] ?? null)}
                    style={{ marginBottom: 8, fontSize: 13, width: '100%' }} />
                  <button onClick={handleOcr} disabled={loading || !imgFile}
                    style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid #D1D5DB', background: '#F3F4F6', fontSize: 13, fontWeight: 600, cursor: loading ? 'wait' : 'pointer', opacity: !imgFile ? 0.5 : 1 }}>
                    {loading ? '⏳ OCR処理中...' : '画像からテキストを抽出'}
                  </button>
                </div>
              )}

              {/* Instagramモード */}
              {mode === 'instagram' && (
                <div>
                  <p style={{ fontSize: 11, color: '#6B7280', margin: '0 0 6px' }}>投稿URLを保存します（将来の埋め込み用）</p>
                  <input type="url" placeholder="https://www.instagram.com/p/..." value={url}
                    onChange={e => setUrl(e.target.value)} style={inputStyle} />
                </div>
              )}

              {/* 直接入力モード */}
              {mode === 'manual' && (
                <textarea value={manualText} onChange={e => setManualText(e.target.value)}
                  rows={5} placeholder="テキストを直接入力..."
                  style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.7 }} />
              )}
            </div>
          )}

          {/* プレビュー（AI/OCR結果） */}
          {preview && (
            <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 10, padding: '12px 14px', marginBottom: 12 }}>
              <p style={{ fontSize: 10, fontWeight: 700, color: '#1D4ED8', margin: '0 0 6px' }}>読み取り結果（編集可）</p>
              <textarea value={preview} onChange={e => setPreview(e.target.value)} rows={6}
                style={{ width: '100%', border: 'none', background: 'transparent', fontSize: 13, outline: 'none', resize: 'vertical', fontFamily: font, lineHeight: 1.7, boxSizing: 'border-box' }} />
            </div>
          )}

          {/* 保存ボタン */}
          {(target === 'lab' || (target === 'faculty' && facId)) && (
            <button onClick={handleSave} disabled={loading}
              style={{ width: '100%', padding: '14px', borderRadius: 10, border: 'none', background: saved ? '#16A34A' : '#1D4ED8', color: 'white', fontSize: 15, fontWeight: 700, cursor: loading ? 'wait' : 'pointer', transition: 'background 0.3s' }}>
              {saved ? '✅ 保存しました！' : loading ? '⏳ 処理中...' : '💾 DBに保存する'}
            </button>
          )}
        </>)}

      </div>
    </main>
  )
}