'use client'

import { useRouter } from 'next/navigation'
import { useCompare } from '@/contexts/CompareContext'

export function CompareBar() {
  const { compareIds, clearCompare } = useCompare()
  const router = useRouter()
  const count = compareIds.length

  // 0件のときは表示しない
  if (count === 0) return null

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 200,
        background: 'rgba(31,45,61,0.97)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderTop: '1px solid rgba(95,175,198,0.3)',
        padding: '12px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        fontFamily: "'Noto Sans JP', sans-serif",
      }}
    >
      {/* 左：件数表示 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {/* バッジ */}
        <div style={{
          width: 28, height: 28, borderRadius: '50%',
          background: 'linear-gradient(135deg, #5FAFC6, #8FD3E0)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 14, fontWeight: 800, color: 'white',
          flexShrink: 0,
        }}>
          {count}
        </div>
        <span style={{ fontSize: 13, color: '#CBD5E1', fontWeight: 500 }}>
          件を比較中
          <span style={{ color: '#8FA1AE', fontSize: 11, marginLeft: 6 }}>
            （最大3件）
          </span>
        </span>
      </div>

      {/* 右：ボタン群 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {/* クリアボタン */}
        <button
          onClick={clearCompare}
          style={{
            padding: '6px 14px',
            borderRadius: 999,
            border: '1px solid rgba(255,255,255,0.15)',
            background: 'transparent',
            color: '#8FA1AE',
            fontSize: 12,
            fontWeight: 600,
            cursor: 'pointer',
            fontFamily: "'Noto Sans JP', sans-serif",
          }}
        >
          クリア
        </button>

        {/* 比較ページへボタン */}
        <button
          onClick={() => router.push('/compare')}
          disabled={count < 2}
          style={{
            padding: '8px 20px',
            borderRadius: 999,
            border: 'none',
            background: count >= 2
              ? 'linear-gradient(135deg, #5FAFC6, #8FD3E0)'
              : 'rgba(255,255,255,0.1)',
            color: count >= 2 ? 'white' : '#4B5563',
            fontSize: 13,
            fontWeight: 700,
            cursor: count >= 2 ? 'pointer' : 'not-allowed',
            fontFamily: "'Noto Sans JP', sans-serif",
            transition: 'all 0.15s',
            whiteSpace: 'nowrap',
          }}
        >
          {count < 2 ? `あと${2 - count}件追加で比較できます` : '比較する →'}
        </button>
      </div>
    </div>
  )
}
