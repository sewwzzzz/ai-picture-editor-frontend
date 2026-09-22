import { RouterProvider } from 'react-router-dom'
import { router } from './router'
import { AppProviders } from './providers'

export const App = () => {
  return (
    <AppProviders>
      <RouterProvider router={router} />
    </AppProviders>
  )
}
