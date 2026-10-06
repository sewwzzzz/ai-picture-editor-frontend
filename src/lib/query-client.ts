import { QueryClient } from '@tanstack/react-query'
import { ApiError } from './api-client'

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
      // 仅对「可重试」错误退避重试，最多 2 次：401/404/409/413/422（retryable=false）
      // 不会白跑第二次请求；5xx、网络/超时（retryable=true）才进入重试。
      // 落实 error-handling.md R6 / 第 7 节，补 M0 复盘「预期失败的查询」漏项。
      retry: (failureCount, error) =>
        error instanceof ApiError && error.retryable && failureCount < 2,
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 30_000),
    },
    // Mutation 一律不自动重试：网络层失败时服务端可能已受理，重试会产生重复任务。
    mutations: {
      retry: false,
    },
  },
})
