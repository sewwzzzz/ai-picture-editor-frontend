import axios from 'axios'
import type { AxiosError, AxiosResponse } from 'axios'
import { env } from '@/config/env'

/**
 * 归一后的错误分类码。
 * 由 HTTP 状态码派生 —— 后端不提供任何机器码，错误文案只在 `detail` 字段。
 * 判定表见 docs/rules/error-handling.md 第 3 节。
 */
export type ApiErrorCode =
  | 'UNAUTHENTICATED'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'PAYLOAD_TOO_LARGE'
  | 'VALIDATION'
  | 'SERVER'
  | 'NETWORK'
  | 'TIMEOUT'
  | 'ABORTED'
  | 'UNKNOWN'

/** 422 的字段级错误：`field` 取自 `detail[].loc`，`message` 取自 `msg` */
export interface ApiFieldError {
  field: string
  message: string
}

interface ApiErrorOptions {
  code: ApiErrorCode
  expected: boolean
  retryable: boolean
  message: string
  fields?: ApiFieldError[]
  status?: number
  payload?: unknown
}

/**
 * 项目统一的 API 错误类型。
 * 拦截器把所有失败归一为此类型，调用方只需 catch 一种东西即可，
 * 并按 `code` 分派 UI —— 不要按 `status` 散写 if，也不要解析 `message` 做分支。
 */
export class ApiError extends Error {
  readonly code: ApiErrorCode
  readonly expected: boolean
  readonly retryable: boolean
  readonly fields?: ApiFieldError[]
  readonly status?: number
  readonly payload?: unknown

  constructor(options: ApiErrorOptions) {
    super(options.message)
    this.name = 'ApiError'
    this.code = options.code
    this.expected = options.expected
    this.retryable = options.retryable
    this.fields = options.fields
    this.status = options.status
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
 * M0 只预留：无登录页，不做跳转。M1 接入认证后在此注入重定向逻辑
 * —— 届时须排除 login / register 的 401（那是密码错误，不是会话过期），
 * 详见 docs/rules/error-handling.md 第 5 节。
 */
type UnauthorizedHandler = (error: ApiError) => void

let unauthorizedHandler: UnauthorizedHandler | null = null

export const setUnauthorizedHandler = (handler: UnauthorizedHandler): void => {
  unauthorizedHandler = handler
}

/** 一次错误分类所需的三个判定维度 */
interface ErrorSpec {
  code: ApiErrorCode
  expected: boolean
  retryable: boolean
}

/**
 * 状态码 → 分类的映射（唯一定义处）。
 * 业务码皆「预料中且不可重试」——409 虽不可重试，但通常应先刷新状态让用户重做。
 */
const EXPECTED_SPECS: Record<number, ErrorSpec> = {
  401: { code: 'UNAUTHENTICATED', expected: true, retryable: false },
  404: { code: 'NOT_FOUND', expected: true, retryable: false },
  409: { code: 'CONFLICT', expected: true, retryable: false },
  413: { code: 'PAYLOAD_TOO_LARGE', expected: true, retryable: false },
  422: { code: 'VALIDATION', expected: true, retryable: false },
}

const SERVER_SPEC: ErrorSpec = { code: 'SERVER', expected: false, retryable: true }
const ABORTED_SPEC: ErrorSpec = { code: 'ABORTED', expected: false, retryable: false }
const UNKNOWN_SPEC: ErrorSpec = { code: 'UNKNOWN', expected: false, retryable: false }

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

/** pydantic 的 msg 形如「Value error, 提示词不能为空」，去掉前缀才是给用户看的文案 */
const stripPydanticPrefix = (msg: string): string => msg.replace(/^Value error,\s*/, '')

/** FastAPI 校验错误项：`{ loc: [...], msg: "...", type: "..." }` */
interface DetailEntry {
  loc?: unknown[]
  msg?: string
}

const readDetailEntries = (data: unknown): DetailEntry[] => {
  if (!isRecord(data) || !Array.isArray(data.detail)) return []
  return data.detail.filter((item): item is DetailEntry => isRecord(item))
}

/** 展示文案：`detail` 为字符串直接取；422 的数组则取首条的 msg */
const readMessage = (data: unknown): string | undefined => {
  if (!isRecord(data)) return undefined
  if (typeof data.detail === 'string') return data.detail
  const [first] = readDetailEntries(data)
  if (first !== undefined && typeof first.msg === 'string') return stripPydanticPrefix(first.msg)
  return undefined
}

/**
 * 把 loc 转成字段名：去掉来源段（body / query / path），其余以 "." 连接。
 * 无 loc（表单级错误）时返回 "_"。
 */
const locToField = (loc: unknown[] | undefined): string => {
  if (loc === undefined || loc.length === 0) return '_'
  const [, ...rest] = loc
  if (rest.length === 0) return '_'
  return rest.map((part) => String(part)).join('.')
}

/** 422 的字段级错误映射；其余状态码一律返回 undefined */
const readFields = (data: unknown, status: number): ApiFieldError[] | undefined => {
  if (status !== 422) return undefined
  const fields = readDetailEntries(data).map((entry) => ({
    field: locToField(entry.loc),
    message: typeof entry.msg === 'string' ? stripPydanticPrefix(entry.msg) : '',
  }))
  return fields.length > 0 ? fields : undefined
}

/** 把响应体归一为可解析对象：Blob(下载场景)先读文本再 JSON.parse；解析失败返回 undefined(交给 fallback) */
const readBody = async (data: unknown): Promise<unknown> => {
  if (typeof Blob !== 'undefined' && data instanceof Blob) {
    try {
      return JSON.parse(await data.text())
    } catch {
      return undefined
    }
  }
  return data
}

/** 按状态码分类并提取文案/字段，产出统一的 ApiError（与 `toApiError` 共用判定逻辑） */
const buildApiError = (status: number, data: unknown, fallback: string): ApiError =>
  new ApiError({
    ...(EXPECTED_SPECS[status] ?? (status >= 500 ? SERVER_SPEC : UNKNOWN_SPEC)),
    message: readMessage(data) ?? fallback,
    fields: readFields(data, status),
    status,
    payload: data,
  })

/** 把 axios 抛出的各类错误归一化成 ApiError */
const toApiError = (error: unknown): ApiError => {
  if (error instanceof ApiError) return error

  const axiosError = error as AxiosError<unknown>

  // 主动取消（AbortController）不计为故障
  if (axiosError?.code === 'ERR_CANCELED' || axiosError?.name === 'CanceledError') {
    return new ApiError({ ...ABORTED_SPEC, message: '请求已取消' })
  }

  const response = axiosError?.response
  if (!response) {
    const timedOut = axiosError?.code === 'ECONNABORTED'
    return new ApiError({
      code: timedOut ? 'TIMEOUT' : 'NETWORK',
      expected: false,
      retryable: true,
      message: timedOut ? '请求超时，请稍后重试' : '网络异常，请检查连接',
    })
  }

  return buildApiError(response.status, response.data, `请求失败（HTTP ${response.status}）`)
}

apiClient.interceptors.response.use(
  // 成功响应原样透传：2xx 但业务体标记失败的情况（目前仅健康检查）交给调用方自行判定
  (response: AxiosResponse) => response,
  (error: unknown) => {
    const apiError = toApiError(error)
    if (apiError.status === 401) unauthorizedHandler?.(apiError)
    return Promise.reject(apiError)
  }
)

/**
 * 上传/下载(blob)场景的错误归一助手。
 *
 * 普通 JSON 请求由拦截器走 `toApiError` 即可；但 `responseType: 'blob'` 的下载失败时，
 * `response.data` 是 Blob，拦截器无法同步解析其内部 JSON 错误体，故调用方在 catch 里改用本函数：
 * 先 `text()` 再 `JSON.parse` 提取 code/message，解析不出则回退 `fallback`。
 * 错误形态与 JSON 请求完全一致（同为 `ApiError`），上传的 JSON 错误响应也能直接复用。
 *
 * 用法：
 * ```ts
 * try {
 *   const res = await apiClient.get(url, { responseType: 'blob' })
 *   saveFile(res.data)
 * } catch (e) {
 *   const ax = e as AxiosError
 *   if (ax.response) throw await apiError(ax.response, '下载失败')
 *   throw e
 * }
 * ```
 */
export const apiError = async (response: AxiosResponse, fallback: string): Promise<ApiError> =>
  buildApiError(response.status, await readBody(response.data), fallback)
