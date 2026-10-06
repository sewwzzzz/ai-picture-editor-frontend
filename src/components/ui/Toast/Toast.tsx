import { useCallback, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useToastStore, type ToastItem } from '@/app/store/useToastStore'
import styles from './Toast.module.css'

const cx = (...classes: Array<string | false | undefined>) => classes.filter(Boolean).join(' ')

/**
 * 全局 Toast 视图层：挂一次即可服务全应用（在 app/App.tsx 挂载）。
 * 经 createPortal 渲染到 document.body，避开布局/层叠上下文干扰。
 */
export function ToastHost() {
  const toasts = useToastStore((s) => s.toasts)
  if (typeof document === 'undefined') return null
  return createPortal(
    <div className={styles.host} role="region" aria-label="通知" aria-live="polite">
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
      className={cx(styles.toast, styles[toast.variant], leaving && styles.leaving)}
      role="alert"
      onAnimationEnd={() => leaving && remove()}
    >
      <span className={styles.message}>{toast.message}</span>
      {toast.action && (
        <button type="button" className={styles.action} onClick={onAction}>
          {toast.action.label}
        </button>
      )}
      <button type="button" className={styles.close} onClick={close} aria-label="关闭">
        ×
      </button>
    </div>
  )
}
