import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export const alt = '東北大学 研究室マップ'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '1200px',
          height: '630px',
          background: 'linear-gradient(135deg, #faf9f6 0%, #f0ede4 100%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'sans-serif',
          position: 'relative',
        }}
      >
        {/* 背景の装飾円 */}
        <div style={{
          position: 'absolute',
          top: -80,
          right: -80,
          width: 400,
          height: 400,
          borderRadius: '50%',
          background: 'rgba(59,130,246,0.08)',
          display: 'flex',
        }} />
        <div style={{
          position: 'absolute',
          bottom: -60,
          left: -60,
          width: 300,
          height: 300,
          borderRadius: '50%',
          background: 'rgba(34,197,94,0.08)',
          display: 'flex',
        }} />
        <div style={{
          position: 'absolute',
          top: 120,
          left: 80,
          width: 200,
          height: 200,
          borderRadius: '50%',
          background: 'rgba(245,158,11,0.08)',
          display: 'flex',
        }} />

        {/* メインコンテンツ */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '24px',
          zIndex: 1,
        }}>
          {/* バッジ */}
          <div style={{
            background: 'rgba(59,130,246,0.12)',
            border: '1px solid rgba(59,130,246,0.3)',
            borderRadius: '100px',
            padding: '8px 24px',
            fontSize: '18px',
            color: '#3b82f6',
            fontWeight: 600,
            display: 'flex',
          }}>
            東北大学 工学研究科
          </div>

          {/* タイトル */}
          <div style={{
            fontSize: '72px',
            fontWeight: 700,
            color: '#1a1a1a',
            letterSpacing: '-2px',
            display: 'flex',
          }}>
            研究室マップ
          </div>

          {/* サブタイトル */}
          <div style={{
            fontSize: '26px',
            color: '#6b7280',
            display: 'flex',
          }}>
            研究概要の類似度で研究室を配置。近いほど研究内容が似ています。
          </div>

          {/* クラスタバッジ群 */}
          <div style={{
            display: 'flex',
            gap: '12px',
            marginTop: '8px',
          }}>
            {[
              { label: 'プラズマ・核融合', color: '#3b82f6' },
              { label: '材料・照射', color: '#22c55e' },
              { label: '計測・レーザー', color: '#f59e0b' },
              { label: '安全・システム', color: '#ef4444' },
            ].map((c) => (
              <div key={c.label} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '100px',
                padding: '8px 18px',
                fontSize: '18px',
                color: '#374151',
              }}>
                <div style={{
                  width: '12px',
                  height: '12px',
                  borderRadius: '50%',
                  background: c.color,
                  display: 'flex',
                }} />
                {c.label}
              </div>
            ))}
          </div>
        </div>

        {/* URL */}
        <div style={{
          position: 'absolute',
          bottom: '32px',
          fontSize: '20px',
          color: '#9ca3af',
          display: 'flex',
        }}>
          lab-map.vercel.app
        </div>
      </div>
    ),
    { ...size }
  )
}