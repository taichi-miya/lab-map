// カラーパレットのみここで管理（クラスタ名・説明はDBのcluster_labelsテーブルが唯一のソース）
export const CLUSTER_COLORS = [
  '#5FAFC6','#22C55E','#F59E0B','#EF4444',
  '#8B5CF6','#EC4899','#14B8A6','#F97316',
  '#0EA5E9','#A855F7'
] as const

export const CLUSTER_FILL   = CLUSTER_COLORS.map(c => c + '17')
export const CLUSTER_CHIP   = CLUSTER_COLORS.map(c => c + '1F')
export const CLUSTER_STROKE = CLUSTER_COLORS.map(c => c + '52')

export function getClusterColor(clusterId: number | null): string {
  if (clusterId === null) return '#94A3B8'
  return CLUSTER_COLORS[clusterId % CLUSTER_COLORS.length]
}

export function getClusterChip(clusterId: number | null): string {
  if (clusterId === null) return 'rgba(148,163,184,0.12)'
  return CLUSTER_CHIP[clusterId % CLUSTER_CHIP.length]
}

export function getClusterStroke(clusterId: number | null): string {
  if (clusterId === null) return 'rgba(148,163,184,0.35)'
  return CLUSTER_STROKE[clusterId % CLUSTER_STROKE.length]
}

// lab/[id]/page.tsx から呼ばれる。名前はDB(cluster_labels)から別途取得すること。
export function getClusterStyle(clusterId: number | null): {
  color: string
  chipBg: string
  stroke: string
} {
  return {
    color:  getClusterColor(clusterId),
    chipBg: getClusterChip(clusterId),
    stroke: getClusterStroke(clusterId),
  }
}