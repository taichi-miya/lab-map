export const CLUSTER_COLORS = [
  '#3B82F6','#22C55E','#F59E0B','#EF4444',
  '#8B5CF6','#EC4899','#14B8A6','#F97316',
  '#0EA5E9','#A855F7'
] as const

export const CLUSTER_NAMES = [
  '情報・社会システム',
  '材料プロセス・金属',
  '流体・航空宇宙・計算力学',
  '環境・土木・化学プロセス',
  'ナノ材料・機能デバイス',
  'エネルギーデバイス・ナノ化学',
  'ロボット・医工学・バイオ',
  '計測・イメージング・量子ビーム',
  '通信・光・電子デバイス',
  '原子力・核融合・プラズマ'
] as const

export const CLUSTER_CHIP = [
  'rgba(59,130,246,0.12)','rgba(34,197,94,0.12)','rgba(245,158,11,0.12)','rgba(239,68,68,0.12)',
  'rgba(139,92,246,0.12)','rgba(236,72,153,0.12)','rgba(20,184,166,0.12)','rgba(249,115,22,0.12)',
  'rgba(14,165,233,0.12)','rgba(168,85,247,0.12)'
] as const

export const CLUSTER_STROKE = [
  'rgba(59,130,246,0.35)','rgba(34,197,94,0.35)','rgba(245,158,11,0.35)','rgba(239,68,68,0.35)',
  'rgba(139,92,246,0.35)','rgba(236,72,153,0.35)','rgba(20,184,166,0.35)','rgba(249,115,22,0.35)',
  'rgba(14,165,233,0.35)','rgba(168,85,247,0.35)'
] as const

export function getClusterStyle(clusterId: number | null) {
  const ci = clusterId ?? null
  return {
    color:  ci !== null ? CLUSTER_COLORS[ci] : '#94A3B8',
    name:   ci !== null ? CLUSTER_NAMES[ci]  : '未分類',
    chipBg: ci !== null ? CLUSTER_CHIP[ci]   : 'rgba(148,163,184,0.12)',
    stroke: ci !== null ? CLUSTER_STROKE[ci] : 'rgba(148,163,184,0.35)',
  }
}