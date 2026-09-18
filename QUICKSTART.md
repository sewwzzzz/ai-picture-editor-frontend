# 启动与使用指南（Quickstart）

本文档面向**开发者**，介绍如何在本地启动本项目的前后端、进行基础配置，并完成一次完整的 AI 修图流程。

> 项目整体介绍（功能、架构、教程）请见根目录 `README.md`。

## 1. 技术栈与端口

| 角色 | 技术 | 默认端口 | 说明 |
| --- | --- | --- | --- |
| 前端 | React 19 + Konva + Vite | `7301` | 开发服务器，代理 `/api`、`/events` 到后端 |
| 后端 | FastAPI + SQLAlchemy | `7302` | REST API 与 SSE 进度推送 |
| 数据库 | PostgreSQL 17 | `7311` | 业务数据（用户、会话、图层 JSONB） |
| 缓存/队列 | Redis 7 | `7312` | ARQ 异步任务、Pub/Sub 进度 |
| 对象存储 | MinIO | `7313` / `7314` | 图片资源（API 端口 / 控制台） |

依赖服务默认账号（见 `docker-compose.yml` 与 `.env.example`）：

- PostgreSQL：`retouch` / `retouch_dev`，库名 `retouch`
- Redis：无密码
- MinIO：`retouch` / `retouch_dev`，桶 `retouch`

## 2. 环境要求

### 本机工具链（必须）
- **Python** ≥ 3.13（后端使用 `uv` 管理依赖，已附带 `uv.lock`）
- **Node.js** ≥ 22（前端）
- **uv**：<https://docs.astral.sh/uv/>

### 必需依赖服务（必须，至少各一个实例）
后端运行时强依赖以下三个服务，缺一不可：
- **PostgreSQL** 17：业务数据（用户、会话、图层 JSONB）
- **Redis** 7：ARQ 异步任务队列、Pub/Sub 进度推送
- **MinIO**（兼容 S3 的对象存储）：图片资源存储

> 这三个服务**不一定**要用 Docker。你可以：
> - 用 **Docker / Docker Compose** 一键拉起（推荐，见第 3 节），或
> - 在本地**直接安装** PostgreSQL、Redis、MinIO，再在 `.env` 中把 `DATABASE_URL` / `REDIS_URL` / `S3_ENDPOINT` 指向本机地址。
>
> 无论哪种方式，服务都必须先启动，后端才能正常连接。默认端口分别为 `7311` / `7312` / `7313`（见 `.env.example` 与 `docker-compose.yml`）。

## 3. 方式一：使用 Docker Compose（推荐，最快）

仓库已提供 `docker-compose.yml`，可直接拉起全部依赖服务；应用与 Worker 仅在 `deploy` profile 下启用（构建镜像后运行）。

### 3.1 仅启动依赖服务（本地前后端开发）

```bash
# 在项目根目录
docker compose up -d postgres redis minio
```

这会启动 PostgreSQL（7311）、Redis（7312）、MinIO（7313 / 7314）。随后按「方式二」在本地运行前后端即可，无需自己安装数据库。

### 3.2 一键启动全部（含后端与 Worker）

适合体验完整部署，需先准备根目录 `.env`（见第 4 节）：

```bash
cp .env.example .env   # 按需修改
docker compose --profile deploy up -d --build
```

- 后端 API：`http://localhost:7302`
- API 文档：`http://localhost:7302/api/docs`
- 前端：构建产物由后端同源托管，访问 `http://localhost:7302/`
- MinIO 控制台：`http://localhost:7314`

> 注意：`deploy` profile 的 `app` / `worker` 镜像由根目录 `Dockerfile` 构建（多阶段：先构建前端 `dist`，再安装 Python 依赖）。

## 4. 方式二：本地前后端开发（最常用）

### 4.1 准备配置文件

在项目根目录创建 `.env`（可在 `.env.example` 基础上修改）：

```bash
cp .env.example .env
```

关键变量说明：

| 变量 | 默认值 | 说明 |
| --- | --- | --- |
| `DATABASE_URL` | `postgresql+asyncpg://retouch:retouch_dev@localhost:7311/retouch` | 本地需指向 `localhost:7311` |
| `REDIS_URL` | `redis://localhost:7312` | 指向本地 Redis |
| `S3_ENDPOINT` | `http://localhost:7313` | MinIO 地址 |
| `S3_PUBLIC_ENDPOINT` | 空（同 `S3_ENDPOINT`） | 浏览器访问签名 URL 的地址 |
| `S3_ACCESS_KEY` / `S3_SECRET_KEY` | `retouch` / `retouch_dev` | MinIO 凭证 |
| `JWT_SECRET` | `dev-only-...` | 生产环境务必替换为随机值 |
| `IMAGE_PROVIDER` | `mock` | `mock`（本地占位图，无费用）或 `dashscope`（真实模型） |
| `DASHSCOPE_API_KEY` | 空 | 接真实模型时填写 |
| `TEXT_TO_IMAGE_MODEL` / `IMAGE_EDIT_MODEL` / `PLANNER_MODEL` | qwen-image-3.0-pro / qwen-image-edit-max / qwen-plus | 模型名 |
| `MATTING_PROVIDER` | `auto` | `auto`（有 rembg 用 rembg，否则四角抠图）/ `corner` |
| `OCR_PROVIDER` | `auto` | `auto`（有 rapidocr 则拆文字层）/ `none` |

> 默认 `IMAGE_PROVIDER=mock`，**无需任何 API Key 即可跑通文生图与编辑流程**（使用本地占位图）。接入真实模型时把 `IMAGE_PROVIDER` 改为 `dashscope` 并填 `DASHSCOPE_API_KEY`。

### 4.2 启动后端

```bash
cd backend

# 安装依赖（含全部可选依赖：cv + agent）。仅基础依赖可去掉 --all-extras
uv sync --all-extras

# 执行数据库迁移（创建表结构）
uv run alembic upgrade head

# 终端 1：启动 API 服务
uv run python -m app            # 或：uv run uvicorn app.main:app --host 127.0.0.1 --port 7302 --reload

# 终端 2：启动 ARQ 异步 Worker（抠图、扩图、生图等耗时任务依赖它）
uv run arq app.worker.WorkerSettings
```

- API 根地址：`http://127.0.0.1:7302`
- 交互式 API 文档：`http://127.0.0.1:7302/api/docs`

> 生产部署命令（对应 `deploy` profile）：`uvicorn app.main:app --host 0.0.0.0 --port 7302`，Worker：`arq app.worker.WorkerSettings`。

### 4.3 启动前端

```bash
cd frontend

npm install        # 或 npm ci（已有 lock）
npm run dev        # 启动 Vite 开发服务器
```

访问 `http://127.0.0.1:7301`。

前端通过 Vite 的 `proxy` 将 `/api` 与 `/events` 转发到后端 `7302`，因此 Cookie 与 SSE 同源，无需额外跨域配置。`vite.config.ts` 已固定 `host: 127.0.0.1`、`port: 7301`、`strictPort: true`。

## 5. 使用流程

1. **注册 / 登录**：前端右上角进入登录页，注册账号后登录（JWT 以 httpOnly Cookie 保存）。
2. **文生图**：在创作页输入提示词，AI 生成 4 张候选图（SSE 实时推送进度），选中一张进入编辑器。
3. **自然语言修图**：在对话框输入一句话（如「把背景换成海滩」「提高亮度和饱和度」），AI Agent 会规划步骤并调用编辑工具。复杂需求会生成多步计划，可确认执行、单步重试或取消。
4. **手动编辑**：使用工具栏的 21 种工具（抠图、调色、裁剪、旋转、AI 换背景 / 扩图、超分等），支持图层拆分、智能点选（SAM）、局部编辑、前后对比滑杆。
5. **结果保存**：编辑结果通过 MinIO 存储，图层结构以 JSONB 持久化。

## 6. 常见问题

- **迁移报错 / 表不存在**：确认 `.env` 中 `DATABASE_URL` 指向的 PostgreSQL 已启动，且已执行 `uv run alembic upgrade head`。
- **任务一直 pending（无进度）**：忘记启动 `arq` Worker。耗时任务需后端 `worker` 进程消费 Redis 队列。
- **图片无法显示**：检查 MinIO 是否启动、`S3_PUBLIC_ENDPOINT` 是否能被浏览器访问（本地通常为 `http://localhost:7313`）。
- **SSE 进度中断 / 缓冲**：开发环境走 Vite 代理；生产环境 `/events` 为独立路由，反向代理需关闭缓冲。
- **想用真实 AI 模型**：将 `IMAGE_PROVIDER` 设为 `dashscope`，填写 `DASHSCOPE_API_KEY`，并按需调整模型名。

## 7. 目录简览

```
backend/                 FastAPI 后端
  app/
    main.py              应用入口、路由挂载、静态托管
    config.py            配置（pydantic-settings，读 .env）
    worker.py            ARQ Worker 入口
    routers/             API 路由（auth/assets/runs/sessions/batches/events/health）
    agent/ services/ tools/ tasks/ models/ providers/
  migrations/            Alembic 迁移
  pyproject.toml         依赖定义（uv）
frontend/                React 前端
  src/                  页面与组件
  vite.config.ts         开发服务器与代理配置
docker-compose.yml      依赖服务编排
Dockerfile              多阶段构建（前端 + 后端）
.env.example            环境变量样例
```
