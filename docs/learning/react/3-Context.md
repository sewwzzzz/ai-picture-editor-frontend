
# Context

## 组件

`<Provider value={...}>`

## 实体

```
Context 对象（createContext 返回）
├─ $$typeof         类型标记（REACT_CONTEXT_TYPE），React 识别它是 Context
├─ _currentValue    【客户端】当前值槽（最近 Provider 的 value 引用）
├─ _currentValue2   【服务端】当前值槽（SSR 用）
├─ _threadCount     并发渲染的线程记账（内部用）
├─ Provider         <Ctx.Provider> 的元素类型（把 value 写进上面槽位，常用）
└─ Consumer         <Ctx.Consumer> 的元素类型（_context 反指回本对象去读值，不常用）
```

### 扮演的角色

#### 稳定实例（遥控器）

1. 典型

    - store

    - QueryClient

    - navigator(history)

2. 特点

    - 引用不变化
    
    - 必须自己订阅，数据更新无法自动推送


#### 会变的状态（画面）

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