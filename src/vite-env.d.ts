/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** 前端请求的 API 前缀，保持同源以便 httpOnly Cookie 自动携带 */
  readonly VITE_API_BASE_URL?: string
  /** 请求超时（毫秒） */
  readonly VITE_API_TIMEOUT_MS?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
