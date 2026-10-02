## Safe vs Idempotent

| 性质 | 含义 | 方法 | 决策 |
| --- | --- | --- | --- |
| Safe（安全）| 第一次执行就不改变服务器状态（纯读）| GET HEAD OPTIONS TRACE | Query 还是 Mutation |
| Idempotent（幂等）| 重复执行 N 次 == 执行 1 次（终态相同）| 上面 4 个 + PUT DELETE | 失败能不能自动重试 |

> POST 也可以是 Query，GET 也可以是Mutation

## 那"Idempotent but unsafe"的 PUT/DELETE 为什么仍不能当 Query？

1. 最关键原因：写操作不能被当作"随时可以重新执行的读"，因为两次执行间可能有新的中间操作已经改变了幂等的结果，重新执行会覆盖/误删。