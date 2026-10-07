import { useCallback, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useToastStore, type ToastItem, type ToastVariant } from '@/app/store/useToastStore'

const cx = (...classes: Array<string | false | undefined>) => classes.filter(Boolean).join(' ')

const TOAST_BASE =
  'pointer-events-auto flex items-start gap-2 px-3 py-2.5 bg-surface text-fg border border-border rounded-control shadow-card text-sm leading-[1.4]'

// 左侧 3px 强调色条：! 强制覆盖 TOAST_BASE 的 border-border（左色）
const VARIANT_BORDER: Record<ToastVariant, string> = {
  error: 'border-l-[3px]! border-l-danger!',
  success: 'border-l-[3px]! border-l-success!',
  warning: 'border-l-[3px]! border-l-warning!',
  info: 'border-l-[3px]! border-l-accent-fg!',
}

/**
 * 全局 Toast 视图层：挂一次即可服务全应用（在 app/App.tsx 挂载）。
 * 经 createPortal 渲染到 document.body，避开布局/层叠上下文干扰。
 */
export function ToastHost() {
  const toasts = useToastStore((s) => s.toasts)
  if (typeof document === 'undefined') return null
  return createPortal(
    <div
      className="fixed top-4 right-4 flex flex-col gap-2 z-[1000] pointer-events-none max-w-[min(360px,calc(100vw-32px))]"
      role="region"
      aria-label="通知"
      aria-live="polite"
    >
      {toasts.map((t) => (
        <ToastCard key={t.id} toast={t} />
      ))}
    </div>,
    document.body,
  )
}

function ToastCard({ toast }: { toast: ToastItem }) {
  const dismiss = useToastStore((s) => s.dismiss)
  const [leaving, setLeaving] = useState(false)
  const remove = useCallback(() => dismiss(toast.id), [dismiss, toast.id])
  const close = useCallback(() => setLeaving(true), [])
  const onAction = useCallback(() => {
    toast.action?.onClick()
    setLeaving(true)
  }, [toast.action])

  useEffect(() => {
    if (toast.duration <= 0) return
    const timer = window.setTimeout(close, toast.duration)
    return () => window.clearTimeout(timer)
  }, [toast.duration, close])

  // 退场动画结束后从 store 移除。reduced-motion 下 animation:none 不会触发
  // onAnimationEnd，用定时器兜底（退场动画 0.15s，缓冲到 200ms）；remove() 幂等，与 onAnimationEnd 重复调用无碍。
  useEffect(() => {
    if (!leaving) return
    const timer = window.setTimeout(remove, 200)
    return () => window.clearTimeout(timer)
  }, [leaving, remove])

  return (
    <div
      className={cx(
        TOAST_BASE,
        VARIANT_BORDER[toast.variant],
        leaving ? 'animate-toast-out' : 'animate-toast-in',
        'motion-reduce:animate-none',
      )}
      role="alert"
      onAnimationEnd={() => leaving && remove()}
    >
      <span className="flex-1 min-w-0 break-words">{toast.message}</span>
      {toast.action && (
        <button
          type="button"
          className="flex-none border-0 bg-transparent text-primary font-[inherit] font-semibold cursor-pointer p-0 underline"
          onClick={onAction}
        >
          {toast.action.label}
        </button>
      )}
      <button
        type="button"
        className="flex-none border-0 bg-transparent text-fg-muted text-[18px] leading-none cursor-pointer p-0 hover:text-fg"
        onClick={close}
        aria-label="关闭"
      >
        ×
      </button>
    </div>
  )
}
