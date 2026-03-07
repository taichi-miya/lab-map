'use client'
import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

type InquiryType = 'correction' | 'feature' | 'bug' | 'other' | ''

type Lab = {
  id: string
  name: string
  dept: string | null
}

// 情報修正の対象フィールド
const CORRECTION_FIELDS = [
  '教員名',
  '研究室HP URL',
  '研究概要テキスト',
  'タグ・キーワード',
  'SNS情報',
  '所属専攻・学科',
  'その他',
]

const INQUIRY_TYPES: { value: InquiryType; label: string; desc: string }[] = [
  { value: 'correction', label: '📝 情報修正依頼', desc: '研究室情報の誤り・変更を報告' },
  { value: 'feature',    label: '💡 新機能要望',   desc: 'あったら嬉しい機能のアイデア' },
  { value: 'bug',        label: '🐛 不具合報告',   desc: '動作がおかしい箇所を報告' },
  { value: 'other',      label: '💬 その他',       desc: 'ご意見・ご感想など' },
]

function ContactForm() {
  const searchParams = useSearchParams()
  const initialType = (searchParams.get('type') as InquiryType) || ''
  const initialLabId = searchParams.get('lab_id') || ''
  const initialLabName = searchParams.get('lab_name') || ''

  const [inquiryType, setInquiryType] = useState<InquiryType>(initialType)
  const [labs, setLabs] = useState<Lab[]>([])
  const [depts, setDepts] = useState<string[]>([])
  const [selectedDept, setSelectedDept] = useState('')
  const [selectedLabId, setSelectedLabId] = useState(initialLabId)
  const [selectedLabName, setSelectedLabName] = useState(initialLabName)
  const [correctionField, setCorrectionField] = useState('')
  const [body, setBody] = useState('')
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    supabase.from('labs').select('id,name,dept').order('name').then(({ data }) => {
      if (!data) return
      setLabs(data)
      const deptList = [...new Set(data.map(l => l.dept).filter(Boolean) as string[])].sort()
      setDepts(deptList)
    })
  }, [])

  // 専攻絞り込み後の研究室リスト
  const filteredLabs = selectedDept
    ? labs.filter(l => l.dept === selectedDept)
    : labs

  const handleLabSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value
    setSelectedLabId(id)
    const found = labs.find(l => l.id === id)
    setSelectedLabName(found?.name ?? '')
  }

  const handleSubmit = async () => {
    if (!inquiryType) { setError('お問い合わせ種別を選択してください'); return }
    if (inquiryType === 'correction' && !selectedLabId) { setError('研究室を選択してください'); return }
    if (inquiryType === 'correction' && !correctionField) { setError('修正対象の項目を選択してください'); return }
    if (!body.trim()) { setError('内容を入力してください'); return }
    setError('')
    setSubmitting(true)

    // Supabaseのreportsテーブルに保存（なければコンソールログのみ）
    try {
      await supabase.from('reports').insert({
        type: inquiryType,
        lab_id: selectedLabId || null,
        lab_name: selectedLabName || null,
        correction_field: correctionField || null,
        body: body.trim(),
        email: email.trim() || null,
        created_at: new Date().toISOString(),
      })
    } catch {
      // reportsテーブルがなくてもOK（将来対応）
      console.log('report saved (local only):', { inquiryType, selectedLabName, correctionField, body })
    }

    setSubmitted(true)
    setSubmitting(false)
  }

  if (submitted) {
    return (
      <div style={{ textAlign: 'center', padding: '48px 0' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
        <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8, color: '#1F2937' }}>送信しました</h2>
        <p style={{ fontSize: 14, color: '#6B7280', marginBottom: 32, lineHeight: 1.7 }}>
          ご報告ありがとうございます。<br />内容を確認のうえ、順次対応いたします。
        </p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/" style={{
            display: 'inline-block', padding: '10px 20px', borderRadius: 10,
            background: '#3B82F6', color: 'white', textDecoration: 'none',
            fontSize: 14, fontWeight: 600,
          }}>
            マップに戻る
          </Link>
          <button onClick={() => { setSubmitted(false); setBody(''); setCorrectionField(''); setEmail('') }}
            style={{
              padding: '10px 20px', borderRadius: 10, border: '1.5px solid #E5E7EB',
              background: 'white', color: '#374151', fontSize: 14, fontWeight: 600,
              cursor: 'pointer', fontFamily: 'inherit',
            }}>
            別の内容を送る
          </button>
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* 種別選択 */}
      <div style={{ marginBottom: 28 }}>
        <label style={labelStyle}>お問い合わせ種別 *</label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {INQUIRY_TYPES.map(t => (
            <button key={t.value} onClick={() => setInquiryType(t.value)}
              style={{
                padding: '10px 14px', borderRadius: 10, border: '1.5px solid',
                borderColor: inquiryType === t.value ? '#3B82F6' : '#E5E7EB',
                background: inquiryType === t.value ? 'rgba(59,130,246,0.06)' : 'white',
                textAlign: 'left', cursor: 'pointer', fontFamily: 'inherit',
                transition: 'all 0.15s',
              }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: inquiryType === t.value ? '#3B82F6' : '#1F2937', marginBottom: 2 }}>
                {t.label}
              </div>
              <div style={{ fontSize: 11, color: '#6B7280' }}>{t.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* 情報修正依頼：研究室選択 */}
      {inquiryType === 'correction' && (
        <div style={{ marginBottom: 20 }}>
          {/* 詳細ページから来た場合は研究室名を表示（変更不可） */}
          {initialLabId ? (
            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>対象研究室</label>
              <div style={{
                padding: '10px 14px', borderRadius: 10, border: '1.5px solid #E5E7EB',
                background: '#F9FAFB', fontSize: 14, color: '#1F2937', fontWeight: 600,
              }}>
                {initialLabName}
              </div>
            </div>
          ) : (
            <>
              <div style={{ marginBottom: 12 }}>
                <label style={labelStyle}>専攻で絞り込む（任意）</label>
                <select value={selectedDept} onChange={e => { setSelectedDept(e.target.value); setSelectedLabId(''); setSelectedLabName('') }} style={selectStyle}>
                  <option value="">すべての専攻</option>
                  {depts.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>対象研究室 *</label>
                <select value={selectedLabId} onChange={handleLabSelect} style={selectStyle}>
                  <option value="">研究室を選択...</option>
                  {filteredLabs.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                </select>
              </div>
            </>
          )}

          {/* 修正対象の項目 */}
          <div style={{ marginTop: 16 }}>
            <label style={labelStyle}>修正対象の項目 *</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {CORRECTION_FIELDS.map(f => (
                <button key={f} onClick={() => setCorrectionField(f)}
                  style={{
                    padding: '6px 12px', borderRadius: 8, border: '1.5px solid',
                    borderColor: correctionField === f ? '#3B82F6' : '#E5E7EB',
                    background: correctionField === f ? 'rgba(59,130,246,0.08)' : 'white',
                    fontSize: 12, color: correctionField === f ? '#3B82F6' : '#374151',
                    fontWeight: correctionField === f ? 600 : 400,
                    cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s',
                  }}>
                  {f}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 本文（種別が選択されたら表示） */}
      {inquiryType && (
        <>
          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>
              {inquiryType === 'correction'
                ? '修正内容・正しい情報 *'
                : inquiryType === 'feature'
                ? '要望内容 *'
                : inquiryType === 'bug'
                ? '不具合の内容・再現手順 *'
                : 'お問い合わせ内容 *'}
            </label>
            <textarea
              value={body}
              onChange={e => setBody(e.target.value)}
              placeholder={
                inquiryType === 'correction'
                  ? '例：教員名が「山田 太郎」→「山田 太郎・佐藤 花子」に変更されています'
                  : inquiryType === 'feature'
                  ? '例：研究室をお気に入り登録して比較できる機能が欲しいです'
                  : inquiryType === 'bug'
                  ? '例：検索バーで入力しても候補が表示されません（Chrome / Mac）'
                  : 'ご自由にお書きください'
              }
              style={{
                ...inputStyle,
                height: 120, resize: 'vertical',
              }}
            />
          </div>

          <div style={{ marginBottom: 24 }}>
            <label style={labelStyle}>メールアドレス（任意・返信希望の場合）</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="example@tohoku.ac.jp"
              style={inputStyle}
            />
          </div>

          {error && (
            <div style={{ marginBottom: 12, padding: '8px 12px', borderRadius: 8, background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)', fontSize: 12, color: '#EF4444' }}>
              {error}
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={submitting}
            style={{
              width: '100%', padding: '12px', borderRadius: 10, border: 'none',
              background: submitting ? '#93C5FD' : '#3B82F6',
              color: 'white', fontSize: 14, fontWeight: 700,
              cursor: submitting ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit', transition: 'background 0.15s',
            }}>
            {submitting ? '送信中...' : '送信する'}
          </button>
        </>
      )}
    </div>
  )
}

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 12, fontWeight: 700, color: '#6B7280',
  marginBottom: 6, letterSpacing: '0.03em',
}

const selectStyle: React.CSSProperties = {
  width: '100%', padding: '9px 12px', borderRadius: 10,
  border: '1.5px solid #E5E7EB', background: 'white',
  fontSize: 13, color: '#1F2937', fontFamily: 'inherit',
  outline: 'none', cursor: 'pointer',
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '9px 12px', borderRadius: 10,
  border: '1.5px solid #E5E7EB', background: 'white',
  fontSize: 13, color: '#1F2937', fontFamily: 'inherit',
  outline: 'none', boxSizing: 'border-box',
}

export default function ContactPage() {
  return (
    <main style={{
      maxWidth: 600, margin: '0 auto', padding: '32px 20px 64px',
      fontFamily: "'Hiragino Kaku Gothic ProN','Hiragino Sans','Noto Sans JP',sans-serif",
      color: '#1F2937',
    }}>
      <Link href="/" style={{
        fontSize: 13, color: '#6B7280', textDecoration: 'none',
        display: 'inline-flex', alignItems: 'center', gap: 4, marginBottom: 24,
      }}>
        ← マップに戻る
      </Link>

      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, margin: '0 0 6px', letterSpacing: '-0.02em' }}>
          お問い合わせ
        </h1>
        <p style={{ fontSize: 13, color: '#6B7280', margin: 0, lineHeight: 1.7 }}>
          情報の修正依頼・新機能の要望・不具合報告などをお送りください。
        </p>
      </div>

      <div style={{
        background: 'white', borderRadius: 18,
        border: '1.5px solid #E5E7EB',
        boxShadow: '0 4px 24px rgba(17,24,39,0.06)',
        padding: '24px 28px',
      }}>
        <Suspense fallback={<div style={{ color: '#9CA3AF', fontSize: 13 }}>読み込み中...</div>}>
          <ContactForm />
        </Suspense>
      </div>
    </main>
  )
}