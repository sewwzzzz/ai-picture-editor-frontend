import { QueryClient } from '@tanstack/react-query'

/**
 * QueryClient 单例（稳定实例，符合目录规范 lib/ 定位）。
 * 放进 Context 只为把引用下发给 useQuery/useMutation，本身不随数据变化——
 * 数据缓存由 Query 内部维护，组件靠订阅（非 Context 推送）拿更新。
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
})
