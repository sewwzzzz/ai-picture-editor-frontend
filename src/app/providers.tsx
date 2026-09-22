import type { ReactNode } from 'react'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from '@/lib/query-client'

/**
 * 全局 Provider 聚合：目前只有 QueryClientProvider（Zustand 无需 Provider）。
 * RouterProvider 在 App.tsx 内作为 children 传入，保持 router 实例唯一出处。
 */
export const AppProviders = ({ children }: { children: ReactNode }) => {
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}
