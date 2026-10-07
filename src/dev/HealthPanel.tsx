import type { ReactNode } from 'react'
import type { ApiError } from '@/lib/api-client'
import { PROBE_LABELS, unhealthyProbes, useHealthQuery, type HealthResponse } from '@/lib/health'
import { Button } from '@/components/ui/Button/Button'

/**
 * 健康检查失败的展示文案：按 `code` 分派（error-handling.md 的 R4），
 * 既不用 `status` 散写 if，也不解析后端文案做分支。
 */
const describeHealthError = (error: ApiError): string => {
  switch (error.code) {
    case 'NETWORK':
    case 'TIMEOUT':
      return '无法连接后端服务，请确认后端已启动'
    case 'SERVER':
      return '后端服务异常，暂时不可用'
    default:
      return error.message || '健康检查失败'
  }
}

/**
 * 探针明细：健康检查**成功（200）也可能不健康**，
 * 判定依据是响应体各项是否以 "ok" 开头，而不是状态码。
 */
const ProbeResult = ({ health }: { health: HealthResponse }) => {
  const unhealthy = unhealthyProbes(health)

  if (unhealthy.length === 0) {
    return <p className="m-0 text-[13px] text-success">后端服务正常</p>
  }

  return (
    <>
      <p className="m-0 text-[13px] text-warning">部分依赖不可用，相关功能可能受影响</p>
      <ul className="m-0 pl-[18px] text-[13px] text-fg-muted font-mono break-all">
        {unhealthy.map((probe) => (
          <li key={probe}>
            {PROBE_LABELS[probe]}：{health[probe]}
          </li>
        ))}
      </ul>
    </>
  )
}

/**
 * 后端健康面板（**仅开发环境**）。
 * 健康检查只是联调手段，不进正式项目：由 `src/dev/index.ts` 以懒加载导出，
 * 装配处用 `isDev` 守卫 —— 生产构建里连这个 chunk 都不会产出。
 */
export const HealthPanel = () => {
  const { data, error, isPending, isFetching, refetch } = useHealthQuery()

  let body: ReactNode = null
  if (isPending) {
    body = <p className="m-0 text-[13px] text-fg-muted">正在检查后端服务…</p>
  } else if (error) {
    body = (
      <>
        <p className="m-0 text-[13px] text-danger">{describeHealthError(error)}</p>
        <p className="m-0 text-[13px] text-fg-muted">GET /api/health · {error.code}</p>
      </>
    )
  } else if (data) {
    body = <ProbeResult health={data} />
  }

  return (
    <section className="fixed right-4 bottom-4 z-[9999] max-w-[320px] flex flex-col gap-2 p-4 bg-surface text-fg border border-border rounded-card shadow-card" aria-live="polite">
      <div className="flex items-center justify-between gap-3">
        <h2 className="m-0 text-sm">后端服务（DEV）</h2>
        <Button
          variant="secondary"
          active
          size="sm"
          className="disabled:opacity-60 disabled:cursor-default"
          onClick={() => void refetch()}
          disabled={isFetching}
        >
          {isFetching ? '检查中…' : '重新检查'}
        </Button>
      </div>
      {body}
    </section>
  )
}
