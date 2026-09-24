import { useEffect } from 'react'
import { useAppStore } from '@/app/store'
import { applyTheme } from './theme-storage'

/**
 * 订阅 store.theme，同步到 <html data-theme>。
 * 换色由 CSS 级联完成，主题切换不会引起组件重渲染——
 * Zustand 里的 theme 只服务「按钮选中态」与持久化。
 * 装配层（App.tsx）调用一次即可。
 */
export const useThemeSync = (): void => {
  const theme = useAppStore((s) => s.theme)

  useEffect(() => {
    applyTheme(theme)
  }, [theme])
}
