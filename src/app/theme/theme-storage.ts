import type { ThemeMode } from '@/app/store'

/**
 * 主题的存储与 DOM 落地。
 * 用独立的裸 key（而非 Zustand persist 的存储），让 index.html 的内联脚本
 * 在首帧前就能读出同一个值，不必依赖 store 的内部格式。
 */
const STORAGE_KEY = 'app-theme'

const isThemeMode = (value: unknown): value is ThemeMode => value === 'light' || value === 'dark'

export const readStoredTheme = (): ThemeMode | null => {
  try {
    const value = localStorage.getItem(STORAGE_KEY)
    return isThemeMode(value) ? value : null
  } catch {
    return null
  }
}

/** 初始值优先级：localStorage（用户手动选过）> 系统偏好 > light */
export const getInitialTheme = (): ThemeMode => {
  const stored = readStoredTheme()
  if (stored) return stored
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

/** 把主题落到 <html data-theme>：颜色变化由 CSS 级联完成，组件不重渲染 */
export const applyTheme = (theme: ThemeMode): void => {
  const root = document.documentElement
  root.dataset.theme = theme
  root.style.colorScheme = theme
  try {
    localStorage.setItem(STORAGE_KEY, theme)
  } catch {
    /* 隐私模式下不可写，忽略 */
  }
}
