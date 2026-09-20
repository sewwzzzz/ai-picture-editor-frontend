import { createBrowserRouter } from 'react-router-dom'
import { RootLayout } from '@/routes/RootLayout'
import { HomePage } from '@/routes/HomePage'

export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      { index: true, element: <HomePage /> },
    ],
  },
])
