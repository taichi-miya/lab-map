'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

type Lab = {
  id: string
  name: string
  faculty_name: string | null
  map_x: number | null
  map_y: number | null
  cluster_id: number | null
}

const CLUSTER_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444']
const CLUSTER_NAMES = ['プラズマ・核融合', '材料・照射', '計測・医療', '安全・システム']

export default function ExplorePage() {
  const [labs, setLabs] = useState<Lab[]>([])
  const [selected, setSelected] = useState<Lab | null>(null)

  useEffect(() => {
    supabase
      .from('labs')
      .select('id,name,faculty_name,map_x,map_y,cluster_id')
      .then(({ data }) => setLabs(data ?? []))
  }, [])

  const placed = labs.map((lab, i) => ({
    ...lab,
    x: lab.map_x ?? 100 + (i % 5) * 130,
    y: lab.map_y ?? 100 + Math.floor(i / 5) * 120,
  }))

  return (
    <main className="flex flex-col items-center p-4">
      <h1 className="text-2xl font-bold mb-1">Tohoku Lab Map</h1>
      <p className="text-sm text-gray-500 mb-3">
        研究概要テキストの類似度で研究室を配置しています。近いほど研究内容が似ています。
      </p>

      {/* クラスタ凡例 */}
      <div className="flex gap-4 mb-3 flex-wrap justify-center">
        {CLUSTER_NAMES.map((name, i) => (
          <div key={i} className="flex items-center gap-1 text-xs">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: CLUSTER_COLORS[i] }} />
            <span>{name}</span>
          </div>
        ))}
      </div>

      <svg width={800} height={600} className="border rounded bg-gray-50">
        {placed.map(lab => {
          const color = lab.cluster_id !== null ? CLUSTER_COLORS[lab.cluster_id] : '#94a3b8'
          return (
            <g key={lab.id} onClick={() => setSelected(lab)} className="cursor-pointer">
              <circle
                cx={lab.x} cy={lab.y} r={18}
                fill={color}
                opacity={selected?.id === lab.id ? 1 : 0.75}
                stroke={selected?.id === lab.id ? '#1e293b' : 'none'}
                strokeWidth={2}
              />
              <text x={lab.x} y={lab.y + 30} textAnchor="middle" fontSize={10} fill="#1e293b">
                {lab.name.slice(0, 12)}
              </text>
            </g>
          )
        })}
      </svg>

      {selected && (
        <div className="mt-4 p-4 border rounded w-full max-w-md bg-white shadow">
          <div className="flex items-center gap-2 mb-1">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: selected.cluster_id !== null ? CLUSTER_COLORS[selected.cluster_id] : '#94a3b8' }}
            />
            <span className="text-xs text-gray-500">
              {selected.cluster_id !== null ? CLUSTER_NAMES[selected.cluster_id] : '未分類'}
            </span>
          </div>
          <p className="font-bold">{selected.name}</p>
          <p className="text-sm text-gray-500">{selected.faculty_name}</p>
          <Link href={`/lab/${selected.id}`} className="text-blue-600 underline text-sm">
            詳細を見る →
          </Link>
        </div>
      )}
    </main>
  )
}