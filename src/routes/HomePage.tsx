import { useAppStore } from '@/app/store'
import { Button } from '@/components/ui/Button/Button'

export const HomePage = () => {
  const theme = useAppStore((s) => s.theme)
  const toggleTheme = useAppStore((s) => s.toggleTheme)

  return (
    <main className="min-h-full flex items-center justify-center p-6">
      <section className="flex flex-col items-start gap-3 px-7 py-6 bg-surface text-fg border border-border rounded-card shadow-card">
        <h1 className="m-0 text-xl">AI 修图工具</h1>
        <p className="m-0 text-sm text-fg-muted">当前主题：{theme}</p>
        <Button onClick={toggleTheme}>
          切换为{theme === 'light' ? '黑夜' : '白天'}
        </Button>
      </section>
    </main>
  )
}
