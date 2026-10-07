/**
 * 按钮样式契约（单一来源）：variant / size / active / block。
 * 纯函数返回 className，<button> 与 react-router <Link> 都能复用，
 * 避免每个页面手写一遍同样的工具类。
 * 所有色值走 @theme token（bg-primary / text-fg / border-border …），换主题自动翻转。
 */
export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'
export type ButtonSize = 'sm' | 'md' | 'lg'

export interface ButtonStyleOptions {
  /** 视觉变体；默认 primary */
  variant?: ButtonVariant
  /** 尺寸；默认 md */
  size?: ButtonSize
  /** 选中/按下态（如导航当前项）：覆盖 variant 的背景与文字色为 accent 高亮 */
  active?: boolean
  /** 占满父容器宽度 */
  block?: boolean
  /** 额外类名（如 flex-none、disabled: 覆盖） */
  className?: string
}

const BASE =
  'inline-flex items-center justify-center gap-2 [font:inherit] rounded-control border border-transparent cursor-pointer transition-colors select-none disabled:opacity-50 disabled:cursor-not-allowed'

const SIZE: Record<ButtonSize, string> = {
  sm: 'text-xs px-2.5 py-1.5',
  md: 'text-sm px-4 py-2',
  lg: 'text-base px-5 py-2.5',
}

const VARIANT: Record<ButtonVariant, string> = {
  primary: 'bg-primary text-primary-fg border-border hover:opacity-90',
  secondary: 'bg-surface text-fg border-border hover:border-fg-muted',
  ghost: 'bg-transparent text-fg border-transparent hover:bg-accent',
  danger: 'bg-danger text-primary-fg border-transparent hover:opacity-90',
}

const ACTIVE = 'bg-accent text-accent-fg border-transparent'

export function buttonStyles(options: ButtonStyleOptions = {}): string {
  const { variant = 'primary', size = 'md', active = false, block = false, className = '' } = options
  return [BASE, SIZE[size], active ? ACTIVE : VARIANT[variant], block ? 'w-full' : '', className]
    .filter(Boolean)
    .join(' ')
}
