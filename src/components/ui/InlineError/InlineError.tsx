import { getDisplayMessage, getFieldMessage } from '@/utils/errorFields'
import styles from './InlineError.module.css'

interface InlineErrorProps {
  error: unknown
  /** 字段名：传了则只取该字段的 422 文案；不传则取错误整体文案（如登录 401、上传 413） */
  field?: string
  /** 供表单控件用 aria-describedby 关联，读屏时能播报错 */
  id?: string
}

/**
 * L1 表单内联红字（error-handling.md 第 6 节）：
 * 422 字段级、413 上传超限、以及 R5 要求的登录/注册 401，都在控件下内联展示。
 * 无文案时返回 null，调用方无需先判空。
 */
export function InlineError({ error, field, id }: InlineErrorProps) {
  const message = field ? getFieldMessage(error, field) : getDisplayMessage(error)
  if (!message) return null
  return (
    <p className={styles.error} id={id} role="alert">
      {message}
    </p>
  )
}
