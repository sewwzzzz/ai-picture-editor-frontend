import { useAppStore } from '@/app/store'

export const HomePage = () => {
  const theme = useAppStore((s) => s.theme)
  const toggleTheme = useAppStore((s) => s.toggleTheme)

  return (
    <div>
      <h1>Home</h1>
      <p>当前主题：{theme}</p>
      <button onClick={toggleTheme}>切换主题</button>
    </div>
  )
}
