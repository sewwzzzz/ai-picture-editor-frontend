# 目录结构规范

> 本文件是目录结构规范的**唯一真源**。
> 上游索引：[`AGENTS.md`](../../AGENTS.md)（L0 常驻：铁律 + 规则索引）
> 参考规范：[bulletproof-react](https://github.com/alan2207/bulletproof-react)
> 技术栈：Vite ^7 / React ^19.2 / TypeScript ^5.9

## 适用范围

`ai-picture-editor-frontend/src/` 下所有文件的创建、移动、重命名。

---

## 1. 目录结构（`src/` 顶层）

```
src/
├─ app/          # 应用层：应用装配与启动
├─ assets/       # 全局静态资源
├─ components/   # 跨 feature 复用的共享组件
├─ config/       # 全局配置与环境变量
├─ features/     # 业务模块（代码主体）
├─ hooks/        # 跨 feature 复用的共享 hooks
├─ lib/          # 第三方库封装 / 需初始化的可复用库
├─ routes/       # 路由与页面装配（或 pages/）
├─ types/        # 跨模块的全局类型
└─ utils/        # 纯工具函数（无状态）
```

## 2. 逐层详解：哪一层放什么

### `app/` — 应用层（只装配，不放业务）

- **放什么**：`App.tsx` 根组件、全局 Provider 聚合（Theme / Query / Store / Router）、`router` 路由实例、`store` 全局状态配置、`styles` 全局样式与主题变量。
- **不放什么**：任何业务组件、任何具体业务接口请求。
- **判断口径**：这一层回答的是「应用怎么跑起来」，不是「应用做什么」。

### `assets/` — 全局静态资源

- **放什么**：图片、字体、图标、SVG 等静态文件。
- **不放什么**：仅某个 feature 使用的资源 —— 那些放 `features/<name>/assets/`。
- **判断口径**：被 ≥2 个 feature 用到的资源才提到全局。

### `components/` — 跨 feature 共享组件（其下常有 `ui/`）

- **放什么**：**无业务逻辑**的通用 UI 组件（Button、Modal、Input、Layout、Toast 等），纯展示 + 受控交互。
- **不放什么**：任何与业务实体相关的内容（如 `AssetCard`、`LayerItem`）—— 那些属于 feature。
- **判断口径**：这个组件换一个产品还能用吗？能 → `components`；不能 → feature。

### `config/` — 全局配置

- **放什么**：从环境变量读取并导出的配置常量（如后端 base URL、代理前缀）、全局常量。
- **不放什么**：散落在各处的魔法字符串；业务级开关（放对应 feature 内）。

### `features/` — 业务模块（**代码主体**）

- **放什么**：按业务域划分的模块。绝大多数代码应落在这里，每个 feature 自成一体。
- **不放什么**：被多个 feature 共享的东西（那些提升到 `components/`、`hooks/`、`lib/`）。
- **判断口径**：它是不是「用户关心的一个业务能力」？是 → 一个 feature。

### `hooks/` — 跨 feature 共享 hooks

- **放什么**：被 ≥2 个 feature 使用的自定义 hook（如 `useTheme`、`useDebounce`）。
- **不放什么**：只在单个 feature 内用的 hook → `features/<name>/hooks/`。

### `lib/` — 第三方库封装 / 需初始化的可复用库

- **放什么**：**有状态、有依赖、需要初始化配置**的封装，例如 axios/fetch 请求实例（含统一错误与 401 拦截）、Query Client、SSE 客户端、Konva 封装。
- **与 `utils/` 的区别**：`lib` 有外部依赖或内部状态；`utils` 是纯函数。
- **不放什么**：纯计算函数（那些去 `utils/`）。

### `routes/`（或 `pages/`）— 路由与页面

- **放什么**：页面级组件，职责是**把 features/components 拼成一个页面**，以及页面的加载态、错误边界。
- **`routes/` vs `pages/`**：配置式路由用 `routes/`（路由对象 + 页面组件同层）；文件式路由用 `pages/`（文件名即路径）。二者取其一，不要同时存在。
- **不放什么**：具体业务逻辑 —— 页面只做装配，逻辑下沉到 feature。

### `types/` — 全局类型

- **放什么**：跨模块共享的 TS 类型/接口（全局通用 DTO、后端通用响应结构）。
- **不放什么**：feature 专属领域类型 → `features/<name>/types/`。

### `utils/` — 纯工具函数

- **放什么**：无状态、无副作用、无外部依赖的纯函数（格式化、校验、坐标换算）。
- **不放什么**：`helpers.ts` / `common.ts` 这类杂物抽屉 —— 官方规范明确反对，每个文件要有单一聚焦领域。

## 3. 每个 feature 的内部结构（统一约定）

```
src/features/<feature-name>/
├─ api/         # 该 feature 的接口请求与 query hooks
├─ assets/      # 仅该 feature 使用的静态资源
├─ components/  # 仅该 feature 使用的组件
├─ hooks/       # 仅该 feature 使用的 hooks
├─ stores/      # 该 feature 的状态
├─ types/       # 该 feature 的领域类型
├─ utils/       # 该 feature 的内部工具函数
└─ index.ts     # 公共 API：对外唯一入口
```

- **公共 API 规则**：其他模块只能从 `features/<name>` 的 `index.ts` 导入，**禁止直穿内部文件**（如 `features/auth/components/LoginForm`）。
- **只暴露必要的东西**：不要用 `export * from './...'` 通配导出。

## 4. 拿不准时的判定规则（自上而下判断）

1. 只被**一个** feature 用 → 放该 feature 内部。
2. 被 **≥2 个** feature 用 → 提升顶层（`components/` `hooks/` `lib/` `utils/` `types/`）。
3. 含**业务含义** → `features/`；**无业务含义** → `components/` 或 `lib/`。
4. **有状态/需初始化** → `lib/`；**纯函数** → `utils/`。
5. 仍不确定 → 先就近放在使用处，等出现第二次复用时再提升（React 官方的 colocation 原则）。

## 5. 明确禁止的反例

- ❌ 在 `components/` 里写业务逻辑（如直接调接口、读 store）。
- ❌ feature 之间互相 import 内部文件，绕开 `index.ts`。
- ❌ 把所有页面平铺、不拆 feature（会迅速膨胀失控）。
- ❌ 出现 `helpers.ts` / `common.ts` / `misc.ts` 这类无语义文件。
- ❌ 目录嵌套超过 3–4 层（React 官方明确建议）。

## 6. 自检清单

新建文件后逐项确认：

- [ ] 放置目录符合第 1 节顶层划分
- [ ] 若属某 feature，已放入该 feature 对应子目录（第 3 节）
- [ ] 未被 ≥2 处复用的东西没有提前提升到顶层
- [ ] 文件名有明确语义，不是 `helpers` / `common` / `misc`
- [ ] 跨 feature 引用走的是 `index.ts`
- [ ] 嵌套层级未超过 3–4 层
