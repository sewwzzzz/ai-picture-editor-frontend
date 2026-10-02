import { Suspense } from 'react'
import { RouterProvider } from 'react-router-dom'
import { router } from './router'
import { AppProviders } from './providers'
import { useThemeSync } from './theme/useThemeSync'
import { DevHealthPanel } from '@/dev'

export const App = () => {
  useThemeSync()

  return (
    <AppProviders>
      <RouterProvider router={router} />
      {/* 生产构建里 DevHealthPanel 为 null：面板与其 chunk 都不会产出（守卫见 src/dev/index.ts） */}
      {DevHealthPanel && (
        <Suspense fallback={null}>
          <DevHealthPanel />
        </Suspense>
      )}
    </AppProviders>
  )
}
