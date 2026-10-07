import { getDisplayMessage } from '@/utils/errorFields'
import { Button } from '@/components/ui/Button/Button'

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
    <div
      className="flex items-start gap-3 p-3 bg-danger-surface text-fg border border-danger rounded-control text-sm leading-[1.5]"
      role="alert"
    >
      <div className="flex-1 min-w-0">
        {title && <strong className="block font-semibold">{title}</strong>}
        <span className="break-words">{getDisplayMessage(error)}</span>
      </div>
      {action && (
        <Button variant="secondary" size="sm" className="flex-none" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  )
}
