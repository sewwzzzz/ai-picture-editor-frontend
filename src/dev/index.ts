import { lazy } from 'react'
import { isDev } from '@/config/env'

/**
 * 开发环境诊断工具的对外唯一入口（守卫就写在这里，不在调用方散落 isDev 判断）。
 *
 * 为什么用 `isDev ? lazy(...) : null` 而不是「模块顶层无条件 lazy + 调用方判 isDev」：
 * 生产构建里 `isDev` 被内联为 false，三元折叠成 `null`，**`lazy()` 调用本身被移除**，
 * 连带动态 import 消失 —— 该 chunk 根本不会产出。
 * 若把 lazy() 放在模块顶层无条件调用，打包器无法证明它无副作用，会保留调用并产出死 chunk。
 */
export const DevHealthPanel = isDev
  ? lazy(() => import('./HealthPanel').then((module) => ({ default: module.HealthPanel })))
  : null
