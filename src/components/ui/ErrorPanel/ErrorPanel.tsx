import { getDisplayMessage } from '@/utils/errorFields'
import styles from './ErrorPanel.module.css'

interface ErrorPanelProps {
  error: unknown
  /** 可选小标题，如「无法保存」；不传则只显示文案 */
  title?: string
  /** 恢复动作，如「重试」——对应 409 刷新状态后让用户重做 */
  action?: { label: string; onClick: () => void }
}

/**
 * L2 页面级 / 区块级错误区（error-handling.md 第 6 节）：
 * 409 业务冲突、子资源 404 这类「需要用户在当前页面处理」的错误走这里。
 * error 为空时返回 null；主资源 404 属 L4（路由占位），不要用本组件。
 */
export function ErrorPanel({ error, title, action }: ErrorPanelProps) {
  if (!error) return null
  return (
    <div className={styles.panel} role="alert">
      <div className={styles.body}>
        {title && <strong className={styles.title}>{title}</strong>}
        <span className={styles.message}>{getDisplayMessage(error)}</span>
      </div>
      {action && (
        <button type="button" className={styles.action} onClick={action.onClick}>
          {action.label}
        </button>
      )}
    </div>
  )
}
