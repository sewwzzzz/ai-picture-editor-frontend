先核对一下当前依赖和之前定下的目录约定，确保方案和已有决策一致。
`package.json` 目前只有路由，状态管理还没装；文档里「搭建状态管理框架」一节（85 行）也是空的。下面按文档已有的「选项 + 单选 + 理由」风格给出方案。

先说一个关键前提：**状态分两类，选型要分开看**：
- **客户端状态（Client State）**：当前工具、选区、图层树、面板开关——纯前端、可变的 UI 状态。
- **服务端状态（Server State）**：SSE 进度（M5）、AI 生成结果（M7）、对话（M8）、计划（M9）——来自后端、要缓存、要订阅。

编辑器这类应用最坑的就是**把服务端状态塞进全局 store**，导致手动写缓存/失效/竞态。所以现代标准是**两者分层**。

## 候选方案

### 客户端状态（核心决策）

| 方案 | 包体积 | 样板量 | 需 Provider | 细粒度更新 | 本项目契合度 |
| --- | --- | --- | --- | --- | --- |
| **A. Context + useReducer** | 0（内置） | 中 | ✅ | ❌ 整树重渲染 | 低：画布高频更新会卡 |
| **B. Zustand** | ~1KB | 极低 | ❌ | ✅ 选择器+transient | **高：推荐** |
| **C. Redux Toolkit** | ~12KB | 高（slice/action） | ✅ | ✅ | 中：企业规范但样板重 |
| **D. Jotai** | ~3KB | 低（原子） | ❌ | ✅ 原子级 | 高：编辑器场景也很顺 |
| **E. Valtio** | ~5KB | 低（Proxy 可变） | ❌ | ✅ 代理追踪 | 高：画布可变对象友好 |

### 服务端状态（配套决策，M1+ 才需要）

| 方案 | 用途 | 本项目契合度 |
| --- | --- | --- |
| **TanStack Query** | fetch/ mutation 缓存 + SSE 订阅封装 | **高：推荐配套** |
| **手写在 Zustand** | 自己管理 loading/缓存/失效 | 低：重复造轮子、易出竞态 |
| **XState** | 把 M5 进度/M7 任务流写成状态机 | 中：复杂异步流可选，M0 不必 |

## 推荐

**核心用 Zustand（方案 B）；等 M1 起服务端状态出现，再叠加 TanStack Query。两者职责不重叠，不是二选一。**

理由（针对本项目具体特征）：

1. **画布高频更新（M3 最大痛点）**：拖拽/绘制时每帧都在变，`Context` 会让整棵树重渲染直接卡死；Zustand 的 `useStore(selector)` 只订阅用到的字段，配合 transient 更新（`setState` 不触发 React 渲染、用 `subscribe` 直接喂给 Konva）能扛住。Jotai/Valtio 也行，但 Zustand 心智负担最低。

2. **工具注册表（M4）天然适配**：所有工具在一处定义、被工具栏/画布/属性面板多处消费——Zustand 的 `getState()` 还能在 React 之外（如 Konva 事件回调、SSE 监听器）直接读状态，这是 Context 做不到的。

3. **样板最少、与文档约定一致**：`app/store/` 放全局 store、`features/*/stores/` 放模块 store，Zustand 的 `create()` 一个函数就完事；无需 Provider 包裹，接入 `App.tsx` 零侵入。

4. **与 React 19 兼容、生态最大**：Zustand 是 bulletproof-react 推荐栈之一，社区方案多，踩坑可搜。

5. **服务端状态交给 TanStack Query**：M5 的 SSE 进度、M7/M8/M9 的接口数据，用 Query 的缓存/重试/失效开箱即用；SSE 用 `queryClient.setQueryData` 在 `onmessage` 里增量更新即可。这样 Zustand 只装"UI 真相"、Query 装"后端真相"，边界清晰。

**为什么不选 Redux Toolkit**：能力够但 slice/action/selector 样板在 13 个模块里会显著拖慢开发，本项目没有"强规范审计"诉求；**为什么 Jotio/Valtio 落选**：能力等价甚至某些点更优，但 Zustand 的"全局可读 + 无 Provider + 生态最大"综合最稳。

## M0 落地范围（不超 PRD）

M0 不接任何真实业务，只需把**框架桩**建好：
- 装 `zustand`（M0 即可装；TanStack Query 等 M1 有接口再装）。
- `src/app/store/` 放一个 `useAppStore`（含 `theme` 等全局 UI 状态占位），通过 `index.ts` 暴露——这正是目录规范里 `app/store` 的落点。
- 不写任何业务 store，留给后续 `features/*/stores/`。

---

需要的话，我可以把上面这套「方案 + 单选理由 + M0 实现范围」写入 `docs/功能分解/M0-前端骨架.md` 的「搭建状态管理框架」一节（沿用路由那一节的格式），或直接把 M0 的 `zustand` 桩（`app/store/useAppStore.ts` + 装包）建出来。你选哪种？



下面把这几个对比维度逐个拆开讲，并用「同一个计数器」在各库里的写法做对照，这样能一眼看出差异。

---

## 1. 样板量（Boilerplate）

**意思**：为了"让状态跑起来"，你**不得不写的重复/模板代码**有多少。样板越少，加一个新状态越快。

对比同款计数器，各库要写的代码量：

```tsx
// Zustand：2 行核心
const useCount = create(s => ({ count: 0, inc: () => s.set(s => ({ count: s.count + 1 })) }))

// Jotai：1 行原子
const countAtom = atom(0)

// Valtio：1 行代理对象
const state = proxy({ count: 0 })

// Redux Toolkit：要写 slice（见下）
```

```tsx
// React Context：要写 reducer + Provider + 自定义 hook
const Ctx = createContext(null)
function reducer(s, a) { return a.type === 'inc' ? { count: s.count + 1 } : s }
// 还得在根部 <Ctx.Provider value={useReducer(reducer, {count:0})}>
```

**结论**：Redux/Context 样板明显重；Zustand/Jotai/Valtio 接近"写多少用多少"。

---

## 2. slice / action（Redux Toolkit 的概念）

**slice（切片）**：把一个业务领域的状态 + 修改逻辑**打包成一块**。比如"用户模块"一个 slice，"图层模块"一个 slice。

**action（动作）**：一个描述"要发生什么"的对象，派发（dispatch）给它来改状态。

```tsx
// 一个 counter slice = 状态 + reducers + 自动生成的 actions
const counterSlice = createSlice({
  name: 'counter',
  initialState: { count: 0 },
  reducers: {
    increment: (state) => { state.count += 1 },   // reducer
  },
})
export const { increment } = counterSlice.actions        // ← action 创建器
// 使用：dispatch(increment())
```

**要点**：Redux 里你**不能直接改 state**，必须先定义 action，再 `dispatch(action)`，由 reducer 算出新 state。这套"定义→派发→reducer"的仪式就是它样板重的来源。Zustand 把 action 直接写成 store 里的一个方法，省掉了这一层。

---

## 3. 原子（Atom，Jotai 的概念）

**原子**：状态的**最小独立单元**——一个 `atom()` 就是一小块状态。组件只订阅自己关心的那个原子，互不牵连。

```tsx
const countAtom = atom(0)            // 一个原子
const userAtom = atom({ name: '' }) // 另一个独立原子

// 组件里只取它需要的
function Counter() {
  const [count, setCount] = useAtom(countAtom)  // 只订阅 countAtom
  return <button onClick={() => setCount(c => c + 1)}>{count}</button>
}
```

**要点**：状态不再是"一个大仓库"，而是**一堆可拼装的乐高小块**。哪块变了，只重渲染引用那块的组件。这正是它"细粒度"的来源。

---

## 4. Proxy 可变（Valtio 的概念）

**Proxy（代理）**：Valtio 用一个 JS `Proxy` 包住普通对象，让你**像写普通变量一样直接改它**，改了就自动触发重渲染——不用 `setState`、不用 action。

```tsx
import { proxy, useSnapshot } from 'valtio'
const state = proxy({ count: 0 })   // 普通对象，被 Proxy 包裹

function Counter() {
  const snap = useSnapshot(state)    // 读快照（订阅）
  return <button onClick={() => { state.count++ }}>{snap.count}</button>
  //                         ↑ 直接改！不用 setState / dispatch
}
```

**要点**：和 Redux"状态不可变、必须派发 action"**正好相反**——Valtio 是"可变、直接改"。对画布/Konva 这种本身就是可变对象模型的场景很自然。

---

## 5. 需 Provider（Needs Provider）

**意思**：你**必须在应用根部包一层组件**，store 才能被内部组件访问到。(为什么？)

| 库 | 要不要 Provider | 写法 |
| --- | --- | --- |
| Redux | ✅ 要 `<Provider store>` | 根部包裹 |
| Context | ✅ 要 `<Ctx.Provider>` | 根部包裹 |
| Jotai | ✅ 要 `<Provider>`（多数情况） | 根部包裹 |
| Valtio | ✅ 要 `<ValtioProvider>`（可选） | 通常包 |
| **Zustand** | ❌ **不需要** | store 在组件外 `create()`，全局直接 `useX()` |

**为什么重要**：
- 要 Provider 的库，组件必须在 Provider **下方**才能用；SSR/测试/在 React 之外的回调（如 Konva 事件、SSE `onmessage`）里读状态会很麻烦。
- Zustand **不需要 Provider**，store 是模块级单例，在任何地方（包括 React 外的普通函数）都能 `useAppStore.getState()` 直接读——这对编辑器的画布事件回调很关键。

---

## 6. 细粒度更新（Fine-grained updates）

**意思**：状态某字段变了，**只重渲染真正用到它的那个组件**，而不是整棵树。

这恰恰是 **Context 的最大痛点**：

```tsx
// Context 陷阱：Theme 变了，连 Count 组件也跟着重渲染！
<Ctx.Provider value={{ theme, count }}>
  <ThemeButton />   {/* 只用 theme */}
  <Counter />       {/* 只用 count */}
</Ctx.Provider>
// count 一变 → 整个 Provider 下所有消费者（含 ThemeButton）全重渲染
```

各库怎么做到细粒度：

```tsx
// Zustand：selector 只订阅 count → 只有用 count 的组件重渲染
const count = useAppStore(s => s.count)

// Jotai：原子级，改了 countAtom 只有订阅它的组件动
const [count] = useAtom(countAtom)

// Valtio：snapshot 只追踪被读的属性
const snap = useSnapshot(state); snap.count
```

**为什么编辑器必须看这个**：画布拖拽时每帧都在改坐标，如果是 Context 那一套，整页（导航、面板、工具栏）每帧全重渲染 → 直接卡死。细粒度更新让"只动画布、不动面板"成为可能。

---

## 一张表收口

| 维度 | 解释 | 本项目为什么关心 |
| --- | --- | --- |
| 样板量 | 起状态要写多少模板 | 13 个模块，越少越省事 |
| slice/action | Redux 的"状态包+派发动作"模式 | 仪式重，但强规范 |
| 原子 | Jotai 的最小状态单元 | 天然细粒度、好拆分 |
| Proxy 可变 | Valtio 直接改对象 | 贴合画布可变模型 |
| 需 Provider | 是否根部包裹才能用 | 影响 React 外读状态（SSE/画布回调） |
| 细粒度更新 | 只重渲染用到的组件 | 画布高频更新不卡的关键 |

**一句话**：这六个词都是用来回答同一个问题——"加状态要写多少、改一处会拖垮多少、在 React 外好不好取"。Zustand 在这六项里综合最均衡（样板少、不需 Provider、细粒度），所以它被推荐。


承接上一轮——我刚说「RouterProvider 把新 location 放进 Context」，这里就讲清 Context 里到底装了什么。

## 短答

Context 里装的是**被注入的那个共享对象**。归纳起来只有两类内容：

1. **稳定的实例引用**（store、history、queryClient）→ 用于注入
2. **会变的当前状态**（location、theme 值、router.state）→ 用于更新

而**装的是哪一类，正好决定了 Context 是否兼作更新通道**——这就是上一轮那个区分的根因。

---

## React Router 的 Context（我们选的方案）

RR 里**不是一个 Context，而是一组内部 Context**（以 `UNSAFE_` 前缀导出，表示内部实现、不建议业务直接用）：

| Context | 装什么 | 供哪个 hook 读 |
|---|---|---|
| `UNSAFE_NavigationContext` | `{ basename, navigator(history 对象), static, future }` —— **导航 API** | `useNavigate()` |
| `UNSAFE_LocationContext` | `{ location, navigationType }` —— **当前地址** | `useLocation()` |
| `UNSAFE_RouteContext` | `{ outlet, matches, isDataRoute }` —— **匹配到的路由记录** | `useParams()`、`useOutlet()` |
| `UNSAFE_DataRouterContext` | router 实例本身 | — |
| `UNSAFE_DataRouterStateContext` | router 当前 state：`{ location, navigation, loaderData, actionData, errors, ... }` | `useNavigation()`、`useLoaderData()`、`useRouteError()` |

**关键点**：RR 的 Context 里**两类东西都有**——

- `navigator`（history 对象）= **稳定实例** → 纯注入，从不变化
- `location` / `router.state` = **会变的状态** → 这就是「Context 值变化触发重渲染」的来源

这正好把上一轮漏洞 1 的链路补全了：

```
router.subscribe() 感知导航
      ↓
RouterProvider 把新 state 塞进 LocationContext / DataRouterStateContext
      ↓
Context 值变了 → 所有 consumer 重渲染
```

---

## 对比 Redux 的 Context

`ReactReduxContext` 里装的是：

```
{ store, subscription, serverState }
```

- `store` 是**稳定引用**——创建后几乎永不变化
- 所以 **Redux 的 Context 里没有「会变的状态值」**，Context 几乎不变 → 更新只能靠 `useSyncExternalStore`

**这就是 RR 与 Redux 的分水岭**：
- RR 的 Context 里有个**会变的 `location`** → Context 天然是更新通道
- Redux 的 Context 里只有**不变的 `store`** → Context 只做注入

---

## 横向对照

| Provider | Context 里装什么 | 性质 | 是否兼作更新通道 |
|---|---|---|---|
| React Router | history 实例 **+** 会变的 location / router.state | 两类都有 | ✅ 是（后半段） |
| Redux | store 实例（稳定） | 只有稳定实例 | ❌ 否 |
| ThemeProvider | `{ theme, setTheme }` —— 当前值 + setter | 会变的值 | ✅ 是 |
| QueryClientProvider | QueryClient 实例 | 稳定实例 | ❌ 否 |
| Valtio（ValtioProvider，可选） | 仅 scope 边界 | 作用域 | ❌ 否 |
| Zustand 默认 | **无 Context** | 模块单例 | — |

---

## 归纳成一句话

**Context 装什么，就决定它扮演什么角色**：

- 只装**稳定实例** → Context 是纯注射器（Redux / Query）
- 只装**会变的状态** → Context 同时是更新通道（Theme）
- **两者都装** → 既注入又更新（**React Router**）

所以上一轮说的「有的库靠 Context 更新、有的不靠」，根因不是设计哲学不同，而是**它们往 Context 里放的东西性质不同**——RR 放了个会变的 `location` 进去，Redux 没有。

---

补充一句：如果你问的是 **React Context 对象本身的构成**，那它只有 `createContext()` 返回的那点东西——`{ Provider, Consumer, displayName }` 及内部维护的当前值，本身不存数据；**数据都在你传给 `<Provider value={...}>` 的那个 `value` 里**，上面表格讲的就是各库往这个 `value` 里放了什么。



承接上一轮的两类划分，这里讲清它们各自**扮演什么角色**。

## 一句话

| | 作用 | 回答的问题 |
|---|---|---|
| **实例引用** | 给你**操作入口**（去哪拿、怎么改） | 「我该找谁办事？」 |
| **会变的状态** | 给你**当前值 + 变化通知** | 「现在是什么？」 |

---

## 实例引用：注入「能力」

例如 Redux 的 `store`、RR 的 `navigator`(history)、`QueryClient`。

**作用**：
1. **让你调用方法**——`store.dispatch()`、`navigate('/editor')`、`queryClient.fetchQuery()`。
2. **让你按需取数据**——`store.getState()` 拿到当前快照。
3. **划定权限边界**——只有 Provider 下方的组件才拿得到这个入口。

**关键特性**：
- 它**自身不变**（创建后引用稳定）→ 放进 Context 也**不会引起重渲染**。
- 但——**拿到引用 ≠ 拿到数据，更 ≠ 拿到变化通知**。

```tsx
const store = useStore()   // 拿到遥控器
// store 还是那个 store，但里面 count 已经从 0 变成 5 了 —— 组件不会因此重渲染
```

想让组件跟着变，必须**自己再去订阅**（`useSyncExternalStore` / `useSelector`）。这就是 Redux 为什么非得配 `useSyncExternalStore`——Context 只递了遥控器，没递画面。

---

## 会变的状态：注入「当前值」并自动推送

例如 RR 的 `location`、Theme 的 `theme`。

**作用**：
1. **直接渲染**——`<div>{theme}</div>`、根据 `location.pathname` 决定渲染哪个页面。
2. **变化即推送**——值一变，Context 自动通知**所有 consumer** 重渲染，组件**被动接收**，不用自己订阅。

**关键特性**：
- 它**会变** → 变化**就是**重渲染信号。
- 代价：**粗粒度**——所有读它的组件一起重渲染，无法只挑关心的字段。

---

## 核心差异：拉 vs 推

这才是两者最本质的分工区别：

| | 实例引用（订阅 / 拉） | 会变状态（Context / 推） |
|---|---|---|
| 数据怎么到手 | 自己订阅、自己取 | 自动推给你 |
| **重渲染粒度** | **细**——selector 只订阅关心的字段 | **粗**——凡读必重渲染 |
| 谁决定重渲染 | 组件自己（订阅了才渲染） | Context（无法筛选） |
| 代价 | 要写订阅代码 | 无需额外代码，但可能**过度重渲染** |

**这正好解释了你 `xx.md` 第 6 节「细粒度更新」**：Redux / Zustand 之所以选「实例引用 + `useSyncExternalStore`」而不是「把状态塞进 Context」，就是为了绕开 Context 的粗粒度推送——让改 `count` 只重渲染 `Counter`，而不是整棵树。

---

## 两个类比

- **遥控器 vs 画面**：实例引用是**遥控器**（拿着能换台，遥控器本身不变）；会变状态是**电视画面**（直接看到内容，画面一变你就看到新内容）。
- **账号 vs 余额**：实例引用是**银行账号**（不变，凭它存取）；会变状态是**余额**（会变，变了要刷新显示）。

---

## 为什么 RR 两个都要

| 放的东西 | 类型 | 为什么需要 |
|---|---|---|
| `navigator` (history) | 实例引用 | 需要**调用** `navigate()` 跳转——这是「能力」 |
| `location` / `router.state` | 会变状态 | 需要**根据地址渲染**不同页面，且地址一变就要重渲染 |

缺任何一个都不行：只有 navigator 而没有 location 进 Context，页面不会随导航刷新；只有 location 而没有 navigator，就没法触发跳转。

---

## 落回本项目（实用结论）

自己写 Provider 时按这个分：

| 放什么 | 适合场景 |
|---|---|
| **实例引用** | 「能力型」依赖——请求 client、store、Konva 封装；**且追求细粒度性能** |
| **会变状态** | 「全局且不频繁变」的值——theme、locale、用户信息；图省事 |
| ❌ **别放** | **高频变化的状态**——画布缩放、鼠标坐标、拖拽中间态 |

最后一条对 AI 修图工具尤其要紧：`zoom`、`cursor`、`dragging` 这类**每帧都在变**的东西塞进 Context，会让整棵树跟着重渲染，画布直接卡死。这类应该走 **Zustand/Valtio 的订阅**（细粒度，只有真正用它的组件重渲染）。

这也和 `xx.md` 第 6 节、以及「画布事件回调要在 React 外读状态」那条的结论是一致的。需要我把「拉 vs 推 / 高频状态别进 Context」这条落进 `xx.md` 吗？