# AGENTS.md — 前端 AI 协作总入口（L0 常驻层）

> 本文件**每次对话都会加载**，因此刻意保持精简，**只放铁律与索引**。
> 完整规范正文一律放在 `docs/rules/` 下，按需查阅（L1 按需层）。

## 项目概况

- 项目：`ai-picture-editor-frontend`（AI 修图工具前端）
- 技术栈：Vite ^7 / React ^19.2 / TypeScript ^5.9
- 主参考规范：[bulletproof-react](https://github.com/alan2207/bulletproof-react)
- 设计文档：`docs/prd/`、`docs/功能分解/`

## 铁律（任何情况不得违反）

1. 在 `ai-picture-editor-frontend/` 下**新建 / 移动 / 重命名文件前**，先查 [`docs/rules/directory-structure.md`](./docs/rules/directory-structure.md)。
2. 跨 feature 只能经 `features/<name>/index.ts` 导入，**禁止直穿内部文件**。
3. **禁止** `helpers.ts` / `common.ts` / `misc.ts` 这类无语义文件。
4. 目录嵌套**不超过 3–4 层**。
5. `components/` 只放**无业务逻辑**的通用 UI；业务组件归 feature。
6. 有状态 / 需初始化的封装放 `lib/`；纯函数放 `utils/`。
7. `routes/` 与 `pages/` **二选一**，不得同时存在。
8. 只被一个 feature 用的东西留在该 feature 内，**出现第二次复用才提升**到顶层。

## 规则索引（按需查阅）

| 关注点 | 文件 | 何时读 |
| --- | --- | --- |
| 目录结构 | [`docs/rules/directory-structure.md`](./docs/rules/directory-structure.md) | 新建 / 移动 / 重命名文件时 |

## 规范文件的三层结构

| 层级 | 载体 | 加载时机 | 内容 |
| --- | --- | --- | --- |
| **L0 常驻** | 本文件 `AGENTS.md` | 每次对话 | 铁律（≤ 20 条）+ 规则索引 |
| **L1 按需** | `docs/rules/*.md` | AI 判断相关时 | 关注点的完整规范（≤ 300 行） |
| **L2 就近** | `src/features/<name>/AGENTS.md` | 仅在该目录工作时 | 超大模块的局部 / 例外约定 |

## 如何新增一条规范

1. 在 `docs/rules/` 新建 `<关注点>.md`，按五段式写：**背景 → 规则 → 正确示例 → 反例 → 自检清单**，控制在 300 行内。
2. 若含不可协商项，把最关键的 1–2 条提炼进本文件「铁律」，**铁律总数控制在 20 条内**。
3. 在「规则索引」表补一行。
4. 需要 IDE 侧自动加载时，在 `.codebuddy/rules/` 增加对应规则文件并配置 `globs`。
5. **按「关注点」拆分，不按业务模块拆分**（模块会增长，关注点稳定）；超大模块改用 L2 就近文件。

## 相关约束

- 后端源码可看（对接文档）；**前端源码禁看**（考题，复盘前），详见 [`docs/prd/ROADMAP.md`](./docs/prd/ROADMAP.md) 的源码边界纪律。
