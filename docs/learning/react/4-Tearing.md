# Tearing

## 含义

- 同一份外部 store，被不同组件读到了不同时间点的值，导致屏幕上出现「一部分旧、一部分新」的不一致画面。

## 解决方案

- 用两次读取检测「从渲染到提交之间 store 是否变了」，变了就同步重渲染一次把画面掰回一致，从而消灭撕裂（tearing）。

## BUG场景

- 每次返回新对象/新数组，React 会认为值一直在变 → 无限循环（经典报错 The result of getSnapshot should be cached）