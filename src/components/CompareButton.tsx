'use client'

import { useCompare } from '@/contexts/CompareContext'

type Props = {
  labId: string
  labName?: string
  // sizeはボタンの大きさ。マップカードではsmall、詳細ページではmedium
  size?: 'small' | 'medium'
}

export function CompareButton({ labId, labName, size = 'small' }: Props) {
  const { isComparing, toggleCompare, isFull } = useCompare()
  const comparing = isComparing(labId)

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()  // 詳細ページリンクの親要素のクリックを止める
    e.stopPropagation()

    if (!comparing && isFull) {
      // 3件上限に達している場合はトーストの代わりにalertで仮置き
      // TODO: 後でトースト通知に差し替え
      alert('比較できるのは最大3件までです。')
      return
    }
    toggleCompare(labId)
  }

  const isSmall = size === 'small'

  return (
    <button
      onClick={handleClick}
      title={comparing ? `比較から外す（${labName ?? ''}）` : `比較に追加（${labName ?? ''}）`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: isSmall ? 4 : 6,
        padding: isSmall ? '4px 10px' : '7px 16px',
        borderRadius: 999,
        border: comparing
          ? '1.5px solid #5FAFC6'
          : '1.5px solid #DCE8EE',
        background: comparing
          ? 'rgba(95,175,198,0.12)'
          : 'rgba(255,255,255,0.85)',
        color: comparing ? '#3A8BA5' : '#8FA1AE',
        fontSize: isSmall ? 11 : 13,
        fontWeight: 700,
        cursor: 'pointer',
        transition: 'all 0.15s',
        fontFamily: "'Noto Sans JP', sans-serif",
        whiteSpace: 'nowrap',
        flexShrink: 0,
      }}
    >
      {/* アイコン */}
      <span style={{ fontSize: isSmall ? 11 : 13, lineHeight: 1 }}>
        {comparing ? '✓' : '+'}
      </span>
      {/* ラベル */}
      <span>{comparing ? '比較中' : '比較に追加'}</span>
    </button>
  )
}
