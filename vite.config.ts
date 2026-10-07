import { fileURLToPath, URL } from 'node:url'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  // 默认代理到后端 7302，与后端 .env 对齐；可用 VITE_PROXY_TARGET 覆盖
  const proxyTarget = env.VITE_PROXY_TARGET ?? 'http://127.0.0.1:7302'

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    server: {
      // 显式绑 127.0.0.1：绕开 Vite 默认只监听 ::1（IPv6）导致 IPv4/部分工具访问不到的坑
      // strictPort：端口被占用直接报错，而非静默换到 7302（会撞后端）
      host: '127.0.0.1',
      port: 7301,
      strictPort: true,
      // 转发到后端并保持同源：认证用 httpOnly Cookie，同源才会自动携带
      // 浏览器 http://127.0.0.1:7301/api/ -> vite proxy http://127.0.0.1:7302/api/ -> 后端
      proxy: {
        // 普通 JSON 接口：响应是有限的短响应，代理默认缓冲无害（攒完即发，用户无感），
        // 故无需像 /events 那样关缓冲。
        '/api': {
          target: proxyTarget,
          changeOrigin: true,
        },
        // SSE 进度推送：后端 events router 故意挂在 /api 外（/events）。
        // 关掉缓冲，让事件即时下发，否则会在代理层积压、前端收不到实时进度。
        '/events': {
          target: proxyTarget,
          changeOrigin: true,
          configure: (proxy) => {
            proxy.on('proxyRes', (proxyRes) => {
              proxyRes.headers['Cache-Control'] = 'no-cache, no-transform'
              proxyRes.headers['X-Accel-Buffering'] = 'no'
            })
          },
        },
      },
    },
  }
})
