# React List

## 路由渲染

1. URL事件 → router 重算 state → 回调 setState → Provider 组合并渲染 → 组件树

## 状态管理

1. 统一数据源，避免数据散落 -- 数据同步

2. 解耦修改状态与展示视图 -- 数据修改

3. 状态变化可预测，可追踪。"触发动作 → 修改状态 → 视图更新"单向数据流（如 Redux、Vuex、Pinia）-- 数据修改

4. 跨组件/路由共享与持久化 -- 数据存活 

## 理解组件中传入的Context

### 组件

`<Provider value={...}>`

### Context

```
Context 对象（createContext 返回）
├─ $$typeof         类型标记（REACT_CONTEXT_TYPE），React 识别它是 Context
├─ _currentValue    【客户端】当前值槽（最近 Provider 的 value 引用）
├─ _currentValue2   【服务端】当前值槽（SSR 用）
├─ _threadCount     并发渲染的线程记账（内部用）
├─ Provider         <Ctx.Provider> 的元素类型（把 value 写进上面槽位，常用）
└─ Consumer         <Ctx.Consumer> 的元素类型（_context 反指回本对象去读值，不常用）
```

#### 扮演的角色

##### 稳定实例（遥控器）

1. 典型

    - store

    - QueryClient

    - navigator(history)

2. 特点

    - 引用不变化
    
    - 必须自己订阅，数据更新无法自动推送


##### 会变的状态（画面）

1. 典型

    - theme('light'|'dark'或者主题对象)

2. 特点

    - 引用变化，变量变化

    - 值变了[驱动重渲染的根本原因]，重渲染

### 关系

```
                       XProvider （1）
                   自定义组件，如 RouterProvider
                     render() 返回 JSX
                              │
                              │ 1 : *  组成（render 返回）
         ┌────────────────────┼────────────────────┐
         ▼                    ▼                    ▼
   Ctx.Provider A       Ctx.Provider B       Ctx.Provider C


```

> 由此可得一个组件中可以同时存在不同角色的Context，例如React Router 的 RouterContext 和 LocationContext

### 目的

1. 渲染范围由组件 -> 多个Context


## 状态管理机制原理

### **表 B：机制视角（理解原理看这张）**

| 方案 | 依赖怎么注入 | ① 数据路径（值怎么到组件） | ② 通知机制（怎么触发重渲染） |
| --- | --- | --- | --- |
| **A. Context + useReducer** | `<Ctx.Provider value={{state,dispatch}}>`——**state 本身就在 Context 值里** | `useContext` 直接返回 | **Context 值引用变化** → 自动重渲染所有 consumer（①②耦合，故粗粒度） |
| **B. Zustand** | 无注入：`import` 模块单例 | 订阅后 `getSnapshot` 现读 + selector | `useSyncExternalStore`（v4 用 WithSelector shim，v5 用 React 内置） |
| **C. Redux（react-redux）** | `<Provider>` 注入 **store 稳定引用** | `useSelector` → `getSnapshot` 现读 + selector | `useSyncExternalStore(WithSelector)`（v8 / v9） |
| **D. Jotai** | StoreContext 注入 **store 稳定引用**（无 Provider 时取默认全局 store） | `useAtom` → 读 atom 当前值 |  **`useReducer` + `store.sub()`** 自行触发，**非** `useSyncExternalStore` |
| **E. Valtio** | 无注入：`import` 模块级 proxy | `useSnapshot` → 订阅后 `getSnapshot` 现读 | `useSyncExternalStore` |

**关键结论**：

1. **「需 Provider」的本质** = 这个库通过 **React 树**传依赖，还是通过 **ES module 单例**传依赖。
2. **Context 里装什么决定它的角色**：装**稳定引用** → 只做注入（Redux / Jotai）；装**会变的状态** → 兼作更新通道（方案 A）；两者都装 → React Router（非状态库）。
3. **只有方案 A 把「变化的 state」放进 Context 值**，所以粗粒度、画布会卡；其余四者都把变化移出 Context，改由订阅送达。
4. **`useSyncExternalStore(subscribe, getSnapshot)` 天生把两件事分开**：`subscribe` = ②通知，`getSnapshot` = ①数据路径；细粒度来自 selector + `Object.is` bail-out。
5. **Redux 的 store 通常也是模块单例**，但 react-redux **刻意不让你直接 import**，而要求经 Provider 注入——换取 scope 隔离 / SSR / 测试可替换。这与 Zustand「直接 import」是**设计取舍，不是能力差异**。
6. **全局 store 不是 React 自带的**，是库（jotai 的 `defaultStore`）或你（`create()` / `proxy()`）建的模块单例。

### Tearing

#### 含义

- 同一份外部 store，被不同组件读到了不同时间点的值，导致屏幕上出现「一部分旧、一部分新」的不一致画面。

#### 解决方案

- 用两次读取检测「从渲染到提交之间 store 是否变了」，变了就同步重渲染一次把画面掰回一致，从而消灭撕裂（tearing）。

#### BUG场景

- 每次返回新对象/新数组，React 会认为值一直在变 → 无限循环（经典报错 The result of getSnapshot should be cached）