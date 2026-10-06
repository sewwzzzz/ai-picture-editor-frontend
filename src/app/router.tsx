import { createBrowserRouter } from 'react-router-dom'
import { RootLayout } from '@/routes/RootLayout'
import { HomePage } from '@/routes/HomePage'
import { NotFoundPage } from '@/routes/NotFoundPage'

export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      { index: true, element: <HomePage /> },
      // 兜底务必放在最后：任何未匹配的路径都落到 404，避免白屏。
      // M1 加页面时新路由都写在它前面即可。
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])
