import { Link } from 'react-router-dom'
import styles from './NotFoundPage.module.css'

/**
 * 路由兜底页：所有未匹配的路径都落到这里（见 app/router.tsx 的 `path: '*'`）。
 *
 * 骨架期就要有兜底，否则 M1 加完页面后随便输个 URL 就是白屏。
 * 这里不用 `Navigate to="/"` 静默重定向：用户输错 URL 时应明确告知，
 * 而不是被悄悄送回首页（原实现的取舍见 M0 复盘表「路由兜底」一行）。
 */
export const NotFoundPage = () => {
  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <p className={styles.code}>404</p>
        <h1 className={styles.title}>页面不存在</h1>
        <p className={styles.meta}>你访问的地址没有对应的页面，可能已被移动或从未存在。</p>
        <Link to="/" className={styles.link}>
          返回首页
        </Link>
      </section>
    </main>
  )
}
