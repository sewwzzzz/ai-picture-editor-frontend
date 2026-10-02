import { useQuery } from '@tanstack/react-query'
import { apiClient, type ApiError } from './api-client'

/**
 * 后端健康检查响应：三项探针，值为 "ok" 或 "error: <异常类名>"。
 * 注意：健康检查**失败也返回 200**，错误藏在响应体里，因此不能只看状态码。
 */
export interface HealthResponse {
  api: string
  database: string
  storage: string
}

/**
 * GET /health（经 baseURL 实际为 /api/health）
 * M0 范围约束：仅此接口，不写其他业务接口。
 */
export const getHealth = async (): Promise<HealthResponse> => {
  const { data } = await apiClient.get<HealthResponse>('/health')
  return data
}

/** 单个探针是否健康：后端以 "error:" 前缀标记失败 */
export const isProbeHealthy = (probe: string | undefined): boolean =>
  typeof probe === 'string' && probe.trim().toLowerCase().startsWith('ok')

/** 整体是否健康（三项探针全部 ok）——判定依据是响应体，不是状态码 */
export const isHealthy = (health: HealthResponse): boolean =>
  isProbeHealthy(health.api) && isProbeHealthy(health.database) && isProbeHealthy(health.storage)

/** 列出不健康的探针名，便于排障时定位是哪一层出问题 */
export const unhealthyProbes = (health: HealthResponse): (keyof HealthResponse)[] =>
  (Object.keys(health) as (keyof HealthResponse)[]).filter((key) => !isProbeHealthy(health[key]))

/** 探针的中文标签：展示层直接取用，避免各处重复映射领域名 */
export const PROBE_LABELS: Record<keyof HealthResponse, string> = {
  api: '接口',
  database: '数据库',
  storage: '存储',
}

/**
 * 健康检查的 queryKey 与 hook：三者（裸请求函数 + key + hook）同文件，
 * 避免 queryKey 写散、失效时漏配。
 *
 * 注意：这里**不在 queryFn 里把「不健康」抛成错误**——健康检查是状态查询，
 * 200 也可能表示某个依赖不可用（判定依据在响应体的 `error:` 前缀）。
 * 真正的请求失败（后端未启动 / 超时 / 5xx）才会以 `ApiError` 落到 `error`。
 */
export const healthQueryKey = ['health'] as const

export const useHealthQuery = () =>
  useQuery<HealthResponse, ApiError>({
    queryKey: healthQueryKey,
    queryFn: getHealth,
  })
