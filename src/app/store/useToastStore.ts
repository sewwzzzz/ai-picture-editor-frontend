import { create } from 'zustand'
import { ApiError } from '@/lib/api-client'

export type ToastVariant = 'error' | 'success' | 'info' | 'warning'

export interface ToastAction {
  label: string
  onClick: () => void
}

export interface ToastItem {
  id: string
  variant: ToastVariant
  message: string
  action?: ToastAction
  /** 自动消失毫秒数；0 表示不自动消失，需手动关闭 */
  duration: number
}

type PushInput = Omit<ToastItem, 'id' | 'duration'> & { duration?: number }
type ToastPushOpts = { action?: ToastAction; duration?: number }

const DEFAULT_DURATION = 4000
let seq = 0

interface ToastState {
  toasts: ToastItem[]
  push: (toast: PushInput) => string
  dismiss: (id: string) => void
  clear: () => void
}

/**
 * 全局反馈通道的载体（补 M0 复盘漏项）：L3 全局 Toast 的唯一真相源。
 * 模块级单例，无需 Provider；组件外用 `useToastStore.getState()` 也可读写。
 * 仅放跨 feature 共享、非服务端真相的客户端 UI 状态（见 useAppStore 约定）。
 */
export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  push: (toast) => {
    const id = `toast-${++seq}`
    set((s) => ({ toasts: [...s.toasts, { duration: DEFAULT_DURATION, ...toast, id }] }))
    return id
  },
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
  clear: () => set({ toasts: [] }),
}))

/** 命令式门面：组件外（含 mutation 的 onError）也能直接 toast，无需 useHook。 */
export const toast = {
  error: (message: string, opts?: ToastPushOpts) =>
    useToastStore.getState().push({ variant: 'error', message, ...opts }),
  success: (message: string, opts?: ToastPushOpts) =>
    useToastStore.getState().push({ variant: 'success', message, ...opts }),
  info: (message: string, opts?: ToastPushOpts) =>
    useToastStore.getState().push({ variant: 'info', message, ...opts }),
  warning: (message: string, opts?: ToastPushOpts) =>
    useToastStore.getState().push({ variant: 'warning', message, ...opts }),
}

/**
 * 把未知错误归一成一条 error toast，供 mutation 的 onError 统一调用。
 * 仅取 `ApiError.message` 作文案（禁止解析 `detail` 做分支，见 error-handling.md R2）。
 * 约定：仅 L3（5xx / 网络 / 超时）走 toast；L1/L2 在表单/页面内联处理。
 */
export function notifyError(error: unknown): void {
  const message = error instanceof ApiError ? error.message : '操作失败，请稍后重试'
  toast.error(message)
}
