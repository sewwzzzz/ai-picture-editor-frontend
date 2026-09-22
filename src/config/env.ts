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
