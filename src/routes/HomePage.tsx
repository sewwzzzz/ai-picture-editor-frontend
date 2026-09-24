import { useAppStore } from '@/app/store'
import styles from './HomePage.module.css'

export const HomePage = () => {
  const theme = useAppStore((s) => s.theme)
  const toggleTheme = useAppStore((s) => s.toggleTheme)

  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <h1 className={styles.title}>AI 修图工具</h1>
        <p className={styles.meta}>当前主题：{theme}</p>
        <button type="button" className={styles.button} onClick={toggleTheme}>
          切换为{theme === 'light' ? '黑夜' : '白天'}
        </button>
      </section>
    </main>
  )
}
