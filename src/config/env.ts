const toPositiveNumber = (value: string | undefined, fallback: number): number => {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

/**
 * 全局配置：唯一读取环境变量的出口，其余代码不直接碰 import.meta.env。
 * 默认 /api 由 Vite dev server 代理转发到后端，保持同源。
 */
export const env = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL ?? '/api',
  apiTimeoutMs: toPositiveNumber(import.meta.env.VITE_API_TIMEOUT_MS, 15_000),
} as const

/**
 * 是否开发环境：dev-only 代码（诊断面板等）的唯一守卫。
 * 单独导出、不挂在 `env` 对象上，是为了让打包器把它当**常量内联**——
 * 生产构建里 `isDev && <X />` 被静态判为死代码，整个分支连同其依赖一起被摇掉。
 */
export const isDev = import.meta.env.DEV
