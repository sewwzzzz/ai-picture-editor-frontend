import { apiClient } from './api-client'

/** 后端健康检查响应；M0 唯一接入的接口，字段以后端实际返回为准 */
export interface HealthResponse {
  status?: string
}

/**
 * GET /health（经 baseURL 实际为 /api/health）
 * M0 范围约束：仅此接口，不写其他业务接口。
 */
export const getHealth = async (): Promise<HealthResponse> => {
  const { data } = await apiClient.get<HealthResponse>('/health')
  return data
}
