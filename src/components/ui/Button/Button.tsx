import type { ButtonHTMLAttributes } from 'react'
import { buttonStyles, type ButtonSize, type ButtonVariant } from './buttonStyles'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  /** 选中/按下态（如导航当前项） */
  active?: boolean
  /** 占满父容器宽度 */
  block?: boolean
}

/**
 * 通用按钮：样式完全由 `buttonStyles` 决定，保持项目内按钮视觉一致。
 * 需要渲染成链接时，不要用本组件，直接给 <Link className={buttonStyles(...)}> 即可。
 */
export function Button({
  variant,
  size,
  active,
  block,
  className,
  type = 'button',
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={buttonStyles({ variant, size, active, block, className })}
      {...rest}
    />
  )
}
