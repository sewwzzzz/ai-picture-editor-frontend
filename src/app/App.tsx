import { RouterProvider } from 'react-router-dom'
import { router } from './router'
import { AppProviders } from './providers'
import { useThemeSync } from './theme/useThemeSync'

export const App = () => {
  useThemeSync()

  return (
    <AppProviders>
      <RouterProvider router={router} />
    </AppProviders>
  )
}
