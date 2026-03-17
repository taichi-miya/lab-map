'use client'

import { useState } from 'react'

function getYoutubeId(url: string) {
  const m = url.match(/(?:v=|youtu\.be\/|embed\/)([A-Za-z0-9_-]{11})/)
  return m ? m[1] : null
}

export default function YoutubeCarousel({ urls }: { urls: string[] }) {
  const [current, setCurrent] = useState(0)
  const ids = urls.map(getYoutubeId).filter((id): id is string => id !== null)
  if (ids.length === 0) return null

  const prev = () => setCurrent(i => (i - 1 + ids.length) % ids.length)
  const next = () => setCurrent(i => (i + 1) % ids.length)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
      {/* 動画 + 左右ボタン */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', justifyContent: 'center' }}>
        {/* 左ボタン */}
        {ids.length > 1 && (
          <button onClick={prev} style={{
            width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
            background: 'white', border: '1.5px solid #DCE8EE',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', boxShadow: '0 2px 8px rgba(41,88,107,0.08)',
            transition: 'border-color .15s, box-shadow .15s',
          }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = '#5FAFC6'; (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 2px 12px rgba(95,175,198,0.2)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = '#DCE8EE'; (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 2px 8px rgba(41,88,107,0.08)' }}
          >
            <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#5B6B79" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
        )}

        {/* 動画 */}
        <div style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid #DCE8EE', flexShrink: 0 }}>
          <iframe
            key={ids[current]}
            width="560"
            height="315"
            src={`https://www.youtube.com/embed/${ids[current]}`}
            title={`紹介動画 ${current + 1}`}
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            style={{ display: 'block' }}
          />
        </div>

        {/* 右ボタン */}
        {ids.length > 1 && (
          <button onClick={next} style={{
            width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
            background: 'white', border: '1.5px solid #DCE8EE',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', boxShadow: '0 2px 8px rgba(41,88,107,0.08)',
            transition: 'border-color .15s, box-shadow .15s',
          }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = '#5FAFC6'; (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 2px 12px rgba(95,175,198,0.2)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = '#DCE8EE'; (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 2px 8px rgba(41,88,107,0.08)' }}
          >
            <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#5B6B79" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        )}
      </div>

      {/* ドットインジケーター */}
      {ids.length > 1 && (
        <div style={{ display: 'flex', gap: 6 }}>
          {ids.map((_, i) => (
            <button key={i} onClick={() => setCurrent(i)} style={{
              width: i === current ? 20 : 8, height: 8, borderRadius: 99, border: 'none', padding: 0,
              background: i === current ? '#5FAFC6' : '#DCE8EE',
              cursor: 'pointer', transition: 'all .2s ease',
            }} />
          ))}
        </div>
      )}

      {/* 枚数表示 */}
      {ids.length > 1 && (
        <p style={{ fontSize: 11, color: '#8FA1AE', margin: 0, fontFamily: "'Sora',sans-serif" }}>
          {current + 1} / {ids.length}
        </p>
      )}
    </div>
  )
}