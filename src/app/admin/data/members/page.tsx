'use client'
import { useState, useEffect } from 'react'
import { useUser } from '@clerk/nextjs'

type Member = {
  id: string
  name: string
  role: string
  clerk_user_id: string | null
  created_at: string
}

const font    = "system-ui,'Noto Sans JP',sans-serif"
const SUPER   = 'user_3AgMgxAzuTbup4F7c6PGEBiied8'

export default function MembersPage() {
  const { user, isLoaded } = useUser()
  const [members,  setMembers]  = useState<Member[]>([])
  const [loading,  setLoading]  = useState(false)
  const [updating, setUpdating] = useState<string | null>(null)

  const isSuperAdmin = isLoaded && user?.id === SUPER

  useEffect(() => {
    if (isSuperAdmin) fetchMembers()
  }, [isSuperAdmin])

  async function fetchMembers() {
    setLoading(true)
    const res  = await fetch('/api/admin/members')
    const data = await res.json()
    if (data.ok) setMembers(data.members)
    setLoading(false)
  }

  async function updateRole(id: string, role: 'admin' | 'contributor') {
    setUpdating(id)
    await fetch('/api/admin/members', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, role }),
    })
    await fetchMembers()
    setUpdating(null)
  }

  const roleInfo = (role: string) => {
    if (role === 'superadmin') return { label: '👑 superadmin', bg: '#EFF6FF', color: '#1D4ED8', border: '#BFDBFE' }
    if (role === 'admin')      return { label: '🔑 admin',      bg: '#F0FDF4', color: '#16A34A', border: '#BBF7D0' }
    return                            { label: '✏️ contributor', bg: '#F9FAFB', color: '#6B7280', border: '#E5E7EB' }
  }

  if (!isLoaded) return null

  if (!isSuperAdmin) return (
    <main style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:font }}>
      <p style={{ color:'#EF4444', fontSize:14 }}>⛔ superadmin 専用ページです</p>
    </main>
  )

  return (
    <main style={{ minHeight:'100vh', background:'#F9FAFB', fontFamily:font }}>
      <header style={{ background:'white', borderBottom:'1px solid #E5E7EB', padding:'12px 16px', display:'flex', alignItems:'center', justifyContent:'space-between', position:'sticky', top:0, zIndex:10 }}>
        <div>
          <span style={{ fontSize:15, fontWeight:800 }}>👥 メンバー管理</span>
          <span style={{ fontSize:11, color:'#9CA3AF', marginLeft:8 }}>superadmin 専用</span>
        </div>
        <div style={{ display:'flex', gap:6 }}>
          <a href="/admin/data" style={{ fontSize:12, color:'#6B7280', textDecoration:'none', padding:'5px 10px', borderRadius:7, border:'1px solid #E5E7EB' }}>← データ投入</a>
          <button onClick={fetchMembers} style={{ fontSize:12, color:'#6B7280', padding:'5px 10px', borderRadius:7, border:'1px solid #E5E7EB', background:'white', cursor:'pointer' }}>🔄 更新</button>
        </div>
      </header>

      <div style={{ maxWidth:700, margin:'0 auto', padding:'20px 14px 60px' }}>
        <div style={{ background:'#EFF6FF', border:'1px solid #BFDBFE', borderRadius:10, padding:'12px 14px', marginBottom:20 }}>
          <p style={{ fontSize:12, color:'#1D4ED8', margin:0 }}>
            👑 adminへの昇格・降格ができるのはあなただけです。Clerkでログインしたユーザーは自動でcontributorとして登録されます。
          </p>
        </div>

        {loading ? (
          <p style={{ textAlign:'center', color:'#9CA3AF', fontSize:13 }}>読み込み中...</p>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {members.map(m => {
              const ri = roleInfo(m.role)
              return (
                <div key={m.id} style={{ background:'white', border:'1px solid #E5E7EB', borderRadius:12, padding:'14px 16px', display:'flex', alignItems:'center', gap:12 }}>
                  {/* アバター */}
                  <div style={{ width:40, height:40, borderRadius:'50%', background:'#F3F4F6', display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, flexShrink:0 }}>
                    {m.name.slice(0,1).toUpperCase()}
                  </div>

                  {/* 情報 */}
                  <div style={{ flex:1, minWidth:0 }}>
                    <p style={{ fontSize:14, fontWeight:700, color:'#1F2937', margin:'0 0 3px' }}>{m.name}</p>
                    <p style={{ fontSize:11, color:'#9CA3AF', margin:0 }}>
                      {m.clerk_user_id ? `Clerk: ${m.clerk_user_id.slice(0,20)}…` : 'パスワード認証'}　·　{new Date(m.created_at).toLocaleDateString('ja-JP')}登録
                    </p>
                  </div>

                  {/* ロールバッジ */}
                  <span style={{ fontSize:11, padding:'4px 12px', borderRadius:20, background:ri.bg, color:ri.color, border:`1px solid ${ri.border}`, fontWeight:700, whiteSpace:'nowrap' }}>
                    {ri.label}
                  </span>

                  {/* 操作ボタン（superadmin自身は変更不可） */}
                  {m.role !== 'superadmin' && (
                    <div style={{ display:'flex', gap:6, flexShrink:0 }}>
                      {m.role === 'contributor' ? (
                        <button
                          onClick={() => updateRole(m.id, 'admin')}
                          disabled={updating === m.id}
                          style={{ padding:'6px 12px', borderRadius:7, border:'1px solid #BBF7D0', background:'#F0FDF4', color:'#16A34A', fontSize:12, fontWeight:600, cursor:'pointer', whiteSpace:'nowrap' }}>
                          {updating === m.id ? '...' : '🔑 adminに昇格'}
                        </button>
                      ) : (
                        <button
                          onClick={() => updateRole(m.id, 'contributor')}
                          disabled={updating === m.id}
                          style={{ padding:'6px 12px', borderRadius:7, border:'1px solid #FCA5A5', background:'#FEF2F2', color:'#EF4444', fontSize:12, fontWeight:600, cursor:'pointer', whiteSpace:'nowrap' }}>
                          {updating === m.id ? '...' : '↓ contributorに降格'}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </main>
  )
}