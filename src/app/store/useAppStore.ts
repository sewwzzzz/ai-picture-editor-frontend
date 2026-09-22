import { create } from 'zustand'

export type ThemeMode = 'light' | 'dark'

interface AppState {
  theme: ThemeMode
  setTheme: (theme: ThemeMode) => void
  toggleTheme: () => void
}

/**
 * 全局 UI 状态（M0 占位）：仅放跨 feature 共享、且非服务端真相的客户端状态。
 * 模块级单例——无需 Provider，组件外用 `useAppStore.getState()` 也可读。
 * 业务领域状态后续放 `features/<name>/stores/`，不要堆到这里。
 */
export const useAppStore = create<AppState>((set) => ({
  theme: 'light',
  setTheme: (theme) => set({ theme }),
  toggleTheme: () => set((s) => ({ theme: s.theme === 'light' ? 'dark' : 'light' })),
}))
