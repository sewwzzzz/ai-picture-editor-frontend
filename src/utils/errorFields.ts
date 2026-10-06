import { ApiError } from '@/lib/api-client'

/**
 * 从统一错误里取某个字段的文案（422 的 `fields`）。
 * 非 ApiError、或该字段无错 → undefined，**不回退**到整体文案（避免同一句话在表单里重复出现）。
 * 纯函数：只做查找，不解析 `message` 文案做分支（见 error-handling.md R2）。
 */
export function getFieldMessage(error: unknown, field: string): string | undefined {
  if (!(error instanceof ApiError)) return undefined
  return error.fields?.find((f) => f.field === field)?.message
}

/** 把 422 的 `fields` 摊平成 `{ 字段名: 文案 }`，供表单一次性绑定多个控件。 */
export function toFieldMessages(error: unknown): Record<string, string> {
  if (!(error instanceof ApiError) || !error.fields) return {}
  return error.fields.reduce<Record<string, string>>((acc, f) => {
    acc[f.field] = f.message
    return acc
  }, {})
}

/** 取可展示文案：ApiError 用其 `message`（后端 detail 原样呈现），其它错误给中文兜底。 */
export function getDisplayMessage(error: unknown, fallback = '操作失败，请稍后重试'): string {
  return error instanceof ApiError ? error.message : fallback
}
