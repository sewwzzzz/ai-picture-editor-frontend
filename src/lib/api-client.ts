import axios from 'axios'
import type { AxiosError, AxiosResponse } from 'axios'
import { env } from '@/config/env'

/** 归一后的错误类别 */
export type ApiErrorKind = 'network' | 'http' | 'business' | 'aborted'

interface ApiErrorOptions {
  kind: ApiErrorKind
  message: string
  status?: number
  code?: string
  payload?: unknown
}

/**
 * 项目统一的 API 错误类型。
 * 拦截器把所有失败归一为此类型，调用方只需 catch 一种东西即可。
 */
export class ApiError extends Error {
  readonly kind: ApiErrorKind
  readonly status?: number
  readonly code?: string
  readonly payload?: unknown

  constructor(options: ApiErrorOptions) {
    super(options.message)
    this.name = 'ApiError'
    this.kind = options.kind
    this.status = options.status
    this.code = options.code
    this.payload = options.payload
  }
}

/**
 * 全局唯一的 axios 实例（有状态、需初始化 → 放 lib/）。
 * withCredentials 无需显式开启：baseURL 为同源 /api，Cookie 自动携带。
 */
export const apiClient = axios.create({
  baseURL: env.apiBaseUrl,
  timeout: env.apiTimeoutMs,
  headers: { 'Content-Type': 'application/json' },
})

/**
 * 401 的处理钩子。
 * M0 只预留：无登录页，不做跳转。M1 接入认证后在此注入重定向逻辑。
 */
type UnauthorizedHandler = (error: ApiError) => void

let unauthorizedHandler: UnauthorizedHandler | null = null

export const setUnauthorizedHandler = (handler: UnauthorizedHandler): void => {
  unauthorizedHandler = handler
}

/** 后端信封里的业务失败标记（HTTP 仍是 2xx，但业务层面失败） */
interface BusinessEnvelope {
  success?: boolean
  message?: string
}

const readBusinessFailure = (data: unknown): BusinessEnvelope | null => {
  if (typeof data !== 'object' || data === null) return null
  const envelope = data as BusinessEnvelope
  return envelope.success === false ? envelope : null
}

/** 把 axios 抛出的各类错误归一化成 ApiError */
const toApiError = (error: unknown): ApiError => {
  if (error instanceof ApiError) return error

  const axiosError = error as AxiosError<unknown>

  // 请求被取消（AbortController）不计为网络故障
  if (axiosError?.code === 'ERR_CANCELED' || axiosError?.name === 'CanceledError') {
    return new ApiError({ kind: 'aborted', message: '请求已取消' })
  }

  const response = axiosError?.response
  if (!response) {
    const timedOut = axiosError?.code === 'ECONNABORTED'
    return new ApiError({
      kind: 'network',
      message: timedOut ? '请求超时，请稍后重试' : '网络异常，请检查连接',
      code: axiosError?.code,
    })
  }

  const business = readBusinessFailure(response.data)
  return new ApiError({
    kind: business ? 'business' : 'http',
    message: business?.message ?? `请求失败（HTTP ${response.status}）`,
    status: response.status,
    payload: response.data,
  })
}

apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    // 兜底：HTTP 2xx 但后端信封标记为失败的，也归一成 business 错误
    const business = readBusinessFailure(response.data)
    if (business) {
      return Promise.reject(
        new ApiError({
          kind: 'business',
          message: business.message ?? '业务处理失败',
          status: response.status,
          payload: response.data,
        })
      )
    }
    return response
  },
  (error: unknown) => {
    const apiError = toApiError(error)
    if (apiError.status === 401) unauthorizedHandler?.(apiError)
    return Promise.reject(apiError)
  }
)
