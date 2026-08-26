# HANDOFF.md — 项目完整交付文档

> **本文件的目的**：把「葛孟雨个人网站」（mengyu-lab）从 0 到 1、到生产级部署的**完整流程**写在一份文档里。
>
> 任何拿到这份文档的人（或 AI Agent），按步骤执行就能复现整个项目。**所有踩过的坑都明确标注**，避免重蹈覆辙。

---

## 📑 目录

1. [项目最终成果](#1-项目最终成果)
2. [技术栈与目录结构](#2-技术栈与目录结构)
3. [零基础到生产：完整步骤](#3-零基础到生产完整步骤)
4. [关键命令清单（可直接复制）](#4-关键命令清单可直接复制)
5. [踩过的坑（避坑清单）](#5-踩过的坑避坑清单)
6. [核心概念速查](#6-核心概念速查)
7. [如何继续扩展](#7-如何继续扩展)
8. [AI Agent 使用指南](#8-ai-agent-使用指南)

---

## 1. 项目最终成果

### 1.1 在线地址
- **生产 URL**：<https://mengyu-lab.pages.dev>（Cloudflare Pages 自动部署）
- **仓库**：<https://github.com/LOMOGMY/mengyu-lab>

### 1.2 功能清单

| # | 功能 | 阶段 | 状态 |
| --- | --- | --- | --- |
| 1 | 静态个人主页（Hero / 关于 / 经历 / 项目 / 荣誉 / 联系） | P1 | ✅ |
| 2 | 多页面架构（3 个项目详情页 + 博客页） | P2 | ✅ |
| 3 | 联系表单 + Cloudflare Pages Functions 后端 | P3 | ✅ |
| 4 | Cloudflare D1 数据库存储留言 | P3 | ✅ |
| 5 | Cloudflare Turnstile 反机器人验证 | P4-Turnstile | ✅ |
| 6 | GitHub → Cloudflare 自动部署（CI/CD） | P1+ | ✅ |

### 1.3 架构总览

```
┌────────────────────────────────────────────────────────┐
│ 用户浏览器                                              │
│   访问 https://mengyu-lab.pages.dev/...                │
│   看到: HTML / CSS / JS（静态资源）                   │
│   联系页: 表单 → 提交                                  │
└────────────────────────────────────────────────────────┘
                       ↓ (HTTPS)
┌────────────────────────────────────────────────────────┐
│ Cloudflare 全球边缘网络                                  │
│   ├─ 静态资源直接返回（HTML/CSS/JS）                  │
│   └─ /api/* 路由到 Pages Functions                    │
│       ├─ /api/contact  (POST): Turnstile验证 + 写 D1 │
│       └─ /api/messages (GET):  从 D1 读留言           │
└────────────────────────────────────────────────────────┘
                       ↓
                ┌──────────────────┐
                │ D1 (SQLite)      │
                │ messages 表      │
                └──────────────────┘
```

---

## 2. 技术栈与目录结构

### 2.1 技术栈（**全程不引入框架**）

| 层 | 技术 | 理由 |
| --- | --- | --- |
| 前端 | 纯 HTML + 原生 JavaScript | 入门门槛最低，便于理解 Web 本质 |
| 样式 | 纯 CSS（手写、变量化） | 同上 |
| 后端 | TypeScript（Pages Functions） | Cloudflare 官方推荐，类型友好 |
| 数据库 | Cloudflare D1（SQLite） | 边缘分布 + 免费 + 零运维 |
| 反垃圾 | Cloudflare Turnstile | Cloudflare 自家、免费、用户无感 |
| 部署 | Cloudflare Pages + GitHub 集成 | push 即部署，CI/CD 自动化 |
| 本地开发 | Python http.server / Node serve | 零依赖，任意起一个静态服务器即可 |

### 2.2 目录结构（**最终版本**）

```text
mengyu-lab/
├── AGENTS.md               ← 项目元信息 / 协作约定（给 AI Agent 看）
├── README.md               ← 对外说明 + 本地预览
├── HANDOFF.md              ← 本文件：完整交付文档（最重要的"项目说明"）
│
├── docs/                   ← 学习教程 / 操作手册（人读）
│   ├── p1-first-deploy.md
│   ├── p2-multi-page.md
│   ├── p3-form-and-d1.md
│   └── p4-turnstile.md
│
├── db/
│   └── schema.sql          ← D1 建表 SQL（在 Cloudflare 控制台执行）
│
├── functions/              ← Cloudflare Pages Functions（必须在仓库根！）
│   └── api/
│       ├── contact.ts      ← POST /api/contact：Turnstile 验证 + 写 D1
│       └── messages.ts     ← GET  /api/messages：读留言列表
│
├── src/                    ← 静态资源（Cloudflare 的 Build output directory）
│   ├── index.html              ← 首页
│   ├── projects/               ← 项目页
│   │   ├── index.html
│   │   ├── embodied-brain.html
│   │   ├── ai-amc.html
│   │   └── rb-scheduling.html
│   ├── blog/                   ← 随笔页
│   │   └── index.html
│   ├── contact/                ← 联系表单页（含 Turnstile 组件）
│   │   └── index.html
│   ├── styles/
│   │   ├── main.css            ← 共享样式
│   │   ├── page.css            ← 详情页/列表页样式
│   │   └── contact.css         ← 联系表单样式
│   └── scripts/
│       ├── main.js             ← 首页脚本
│       └── contact.js          ← 联系表单脚本
│
├── wrangler.toml           ← Cloudflare 配置（含 D1 database_id）
└── public/                 ← 静态资源占位（图片等，目前空）
```

> ⚠️ **关键约定**：`functions/` 必须在仓库根，**不能在 src/ 里**。

---

## 3. 零基础到生产：完整步骤

按顺序执行。每一步都标注「谁来做」「在哪做」「做什么」「预期结果」。

### 步骤 0：前置条件

| 项 | 说明 |
| --- | --- |
| GitHub 账号 | 没有就去 <https://github.com> 注册 |
| Cloudflare 账号 | 没有就去 <https://dash.cloudflare.com/sign-up> 注册（免费） |
| Git | 本机装好（<https://git-scm.com/>） |
| Node.js（可选） | 仅 P4 设 Secret 时需要：<https://nodejs.org/> 下载 LTS |

### 步骤 1：创建仓库并克隆

```bash
# 在 GitHub 上创建空仓库：mengyu-lab（不要勾 README / .gitignore / License）
# 然后本地：

mkdir mengyu-lab && cd mengyu-lab
git init
git branch -M main
git remote add origin https://github.com/<你的用户名>/mengyu-lab.git
```

> ⚠️ **坑**：GitHub 默认分支是 `main`（2020 年后改了），但老教程里写的是 `master`。务必用 `main`。

### 步骤 2：写入项目文档骨架（AGENTS.md）

直接复制本仓库的 [`AGENTS.md`](./AGENTS.md) 内容到根目录。

### 步骤 3：本地预览基础（写一个最小 index.html）

```bash
mkdir -p src/styles src/scripts public
```

写一个 `src/index.html`，启动本地预览：

```bash
cd src && python -m http.server 8000
# 浏览器打开 http://localhost:8000
```

### 步骤 4：第一次部署（Cloudflare Pages + GitHub 集成）

#### 4.1 在 Cloudflare 创建 Pages 项目

1. 打开 <https://dash.cloudflare.com/> → **Workers & Pages**
2. **Create** → 选 **Pages** → **Connect to Git**
3. 选你的 GitHub 账号和 `mengyu-lab` 仓库
4. **Build settings**（最容易出错的一步）：

   | 项 | 值 |
   | --- | --- |
   | Project name | `mengyu-lab`（决定你的域名） |
   | Production branch | `main` |
   | Framework preset | **None** |
   | Build command | **留空** |
   | **Build output directory** | **`src`** ← ⚠️ 必须填 `src`，因为 HTML 在 `src/index.html` |

5. **Save and Deploy**
6. 等 1-2 分钟，看到 `Success!` 后，Cloudflare 会显示一个 URL，类似 `https://mengyu-lab.pages.dev`

> ⚠️ **坑**：Build output directory 填错（不填、填 `.`、填 `dist`）会 404 或白板。

#### 4.2 验证

打开 Cloudflare 给的 URL，看到首页内容。

#### 5.1 创建 D1 数据库

1. Cloudflare Dashboard → **Workers & Pages** → **D1**
2. **Create database**，名字：`mengyu-lab-messages`
3. 创建后**复制 Database ID**（一串 UUID）

#### 5.2 建表

1. 进入 D1 数据库 → **Console** 标签
2. 粘贴 [`db/schema.sql`](./db/schema.sql) 的内容，执行

#### 5.3 配置 wrangler.toml（**绑定由代码管，不在控制台**）

编辑仓库根的 `wrangler.toml`：

```toml
name = "mengyu-lab"
compatibility_date = "2024-09-23"
pages_build_output_dir = "./src"

[[d1_databases]]
binding = "DB"
database_name = "mengyu-lab-messages"
database_id = "<你的 D1 Database ID>"
```

> ⚠️ **坑 1**：`database_id` 一定要填，**不能注释掉**！否则 Cloudflare 会"接管"控制台 UI 但运行时 `env.DB` 是 undefined。
>
> ⚠️ **坑 2**：只要仓库里有 `wrangler.toml`，控制台的绑定 UI 就**被禁用**（提示"此项目的绑定在通过 wrangler.toml 进行管理"）。这是预期行为，不是 bug。

#### 5.4 推送代码触发重新部署

```bash
git add wrangler.toml
git commit -m "fix(p3): fill wrangler.toml d1 binding"
git push
```

#### 5.5 验证

打开 `https://mengyu-lab.pages.dev/contact/`（先有这个页面），填表 → 提交 → 在 D1 Console 跑 `SELECT * FROM messages;` 能看到数据。

### 步骤 6：加反机器人验证（Turnstile）

#### 6.1 创建 widget

1. Cloudflare Dashboard → **Turnstile** → **Add widget**
2. Widget name：`mengyu-lab-contact`
3. Hostname：加 `mengyu-lab.pages.dev` 和 `localhost`
4. Widget Mode：**Managed**
5. 创建后拿到 **Site Key**（公开）和 **Secret Key**（私有）

#### 6.2 填 Site Key 到前端

编辑 `src/contact/index.html`，把 `YOUR_TURNSTILE_SITE_KEY` 替换成真实 Site Key。

#### 6.3 设 Secret Key（用 wrangler CLI）

```bash
npm install -g wrangler        # 一次性
wrangler login                 # 一次性，浏览器授权
cd <项目根目录>
wrangler pages secret put TURNSTILE_SECRET --project-name=mengyu-lab
# 提示时粘贴 Secret Key
```

#### 6.4 推送代码

```bash
git add src/contact/index.html
git commit -m "feat(p4): fill Turnstile site key"
git push
```

#### 6.5 验证

强刷 `https://mengyu-lab.pages.dev/contact/`，看到 Turnstile 组件，加载后「提交留言」按钮变为可点。

---

## 4. 关键命令清单（可直接复制）

### 4.1 本地预览

```bash
# 进入 src/ 目录，起静态服务器
cd src && python -m http.server 8000
# 浏览器：http://localhost:8000
```

### 4.2 标准的"改代码 → 部署"循环

```bash
# 1. 编辑文件
# 2. 提交
git add -A
git commit -m "feat/fix/docs: 描述这次改动"
# 4. Cloudflare 1-2 分钟内自动部署
git push
```

### 4.3 排查 Function / D1 问题

```bash
# 看 Cloudflare Pages 项目的实时日志
wrangler pages deployment tail --project-name=mengyu-lab
```

### 4.4 wrangler 常用命令

```bash
# 登录（一次性）
wrangler login

# 列出某个项目的所有 secrets
wrangler pages secret list --project-name=mengyu-lab

# 设置 secret
wrangler pages secret put SECRET_NAME --project-name=mengyu-lab

# 触发重新部署（一般在控制台点更方便）
wrangler pages deploy --project-name=mengyu-lab
```

### 4.5 D1 调试 SQL（去 Cloudflare 控制台 Console 标签执行）

```sql
-- 看所有留言
SELECT * FROM messages ORDER BY id DESC LIMIT 50;

-- 看最近一条
SELECT * FROM messages ORDER BY id DESC LIMIT 1;

-- 按邮箱查
SELECT * FROM messages WHERE email = 'someone@example.com';

-- 删一条
DELETE FROM messages WHERE id = 1;

-- 看表结构
SELECT sql FROM sqlite_master WHERE type='table';
```

---

## 5. 踩过的坑（避坑清单）

> ⚠️ 这一节是整个项目最有价值的部分。所有踩过的坑及修复都明确列出。

### 坑 1：Functions 路径错误（HTTP 405）

| 现象 | POST /api/contact 返回 `405 Method Not Allowed` |
| --- | --- |
| 原因 | `functions/` 放在 `src/functions/`，Cloudflare Pages 只在仓库根找 `functions/` |
| 修复 | 移到仓库根：`mv src/functions functions` |
| 经验 | **框架约定 ≠ 你以为的位置**。读官方文档的「目录结构」章节 |

### 坑 2：D1 binding 没生效（HTTP 500 + `Cannot read 'prepare'`）

| 现象 | 提交留言返回 500，错误信息 `Cannot read properties of undefined (reading 'prepare')` |
| --- | --- |
| 原因 | `wrangler.toml` 里的 `[[d1_databases]]` 段缺失 `database_id` |
| 修复 | 填上正确的 D1 Database ID |
| 经验 | **配置文件里的占位符/注释比缺文件更危险**——前者骗过编译/部署，让你在错误方向排查 |

### 坑 3：wrangler.toml 锁掉控制台绑定 UI

| 现象 | 控制台 Settings → Functions → D1 database bindings 点不动，提示"由 wrangler.toml 管理" |
| --- | --- |
| 原因 | 仓库里有 wrangler.toml 时 Cloudflare 自动接管绑定 |
| 修复 | 这是预期行为，所有绑定都通过 wrangler.toml 管理 |
| 经验 | **见到「XXX 由 YYY 管理」提示，第一反应是去看 YYY，不是 XXX** |

### 坑 4：Build output directory 配错 → 404 / 白板

| 现象 | 部署成功但访问 URL 是 404 或白板 |
| --- | --- |
| 原因 | Build output directory 填错（不填 / 填 `.` / 填 `dist`），而 HTML 实际在 `src/` |
| 修复 | 必须填 `src`（因为 `src/index.html` 是入口） |
| 经验 | **每个静态框架的输出目录约定不同**：Vite 默认 `dist`、Next 默认 `.next`、我们这里 `src` |

### 坑 5：Turnstile site key 用占位符 → "Invalid site key"

| 现象 | 表单加载了 Turnstile 容器但显示 "Invalid site key" |
| --- | --- |
| 原因 | 代码里 `YOUR_TURNSTILE_SITE_KEY` 占位符没替换 |
| 修复 | 替换成真实 Site Key（公开的那个），commit + push |
| 经验 | **占位符是开发期临时用的，最终必须替换** |

### 坑 6：Secret Key 不能写在代码里

| 现象 | 把 TURNSTILE_SECRET 直接写进 wrangler.toml 并 push 到 GitHub |
| --- | --- |
| 后果 | 任何人能看你的 git 历史，拿到你的 Secret |
| 修复 | 用 `wrangler pages secret put` 单独设置，wrangler 自动加密存储并只在 Function 运行时注入 |
| 经验 | **任何带 "secret / key / token" 关键字的东西都不能进 git** |

### 坑 7：Cloudflare 部署状态缓存

| 现象 | 改完代码 + push 后看不到效果 |
| --- | --- |
| 原因 | 浏览器缓存了旧版本 |
| 修复 | 强制刷新：Ctrl+Shift+R (Windows/Linux) / Cmd+Shift+R (Mac) |
| 经验 | 部署 → 浏览器拉新版本之间永远有缓存问题，调试时永远先强刷 |

---

## 6. 核心概念速查

| 概念 | 一句话解释 |
| --- | --- |
| **静态网站** | 浏览器直接请求 HTML，服务器原样返回。没有后端逻辑 |
| **Pages Functions** | Cloudflare 边缘运行的 TypeScript 函数。文件路径 = URL 路径 |
| **D1** | Cloudflare 的边缘 SQLite 数据库，绑定到 Pages 项目后通过 `env.DB` 访问 |
| **Binding（绑定）** | Cloudflare 把资源（D1 / KV / R2 / AI）注入到 Function 运行时的机制 |
| **Wrangler** | Cloudflare 官方 CLI，用于本地开发、部署、设 Secret |
| **wrangler.toml** | 项目的 Cloudflare 配置文件（绑定、构建目录等）。存在时控制台 UI 被禁用 |
| **Turnstile** | Cloudflare 自家人机验证，免费、无限、用户几乎无感知 |
| **Secret** | 通过 `wrangler secret put` 设置的敏感值，加密存储，git 里看不到 |
| **Site Key / Secret Key** | Turnstile 的双密钥对：Site Key 公开（前端），Secret Key 私有（后端） |
| **CI/CD** | Continuous Integration / Continuous Deployment。本项目里就是 `git push` → Cloudflare 自动部署 |
| **Prepared Statement** | SQL 防注入的标准做法：用 `?1, ?2` 占位符，参数通过 `.bind()` 传入 |

---

## 7. 如何继续扩展

### 7.1 推荐优先级

| 任务 | 价值 | 难度 | 涉及 |
| --- | --- | --- | --- |
| 留言分页 | 数据多了不卡 | ⭐⭐ | SQL OFFSET/LIMIT、前端分页按钮 |
| IP 限流 | 防滥用 | ⭐⭐ | Function 里维护时间戳 / Cloudflare Rate Limiting Rules |
| Cloudflare Access | 给 /admin 加邮箱鉴权 | ⭐⭐ | Dashboard 配置 + 一个 /admin 页面 |
| 自定义域名 | 用你的域名（mengyulab.com 之类） | ⭐ | Cloudflare DNS + 域名注册商 |
| Cloudflare Analytics | 看访问数据 | ⭐ | Dashboard 自动开启 |
| 博客系统 | Markdown → 博客 | ⭐⭐⭐ | 静态生成或 D1 存内容 |

### 7.2 标准扩展流程

1. 在 [docs/](docs/) 里找类似的过往阶段文档作为参考
2. 用 EnterPlanMode 让 AI Agent 给出方案
3. 写代码 → 本地预览 → commit → push → Cloudflare 自动部署 → 验证
4. 写一个新的 `docs/pN-*.md` 文档，给未来的自己或他人参考

---

## 8. AI Agent 使用指南

> 这一节是给「未来可能接手这个项目的 AI Agent」看的。

### 8.1 项目元信息

- **目的**：学习型项目，重点在「完整跑通写代码 → 部署 → 更新 → 再部署循环」
- **用户**：初学者，对 Cloudflare / D1 / Pages Functions 无基础
- **协作约定**：AI 写代码 + 解释原理，用户在 Cloudflare/GitHub 控制台做配置类操作
- **平台**：全程 Cloudflare（Pages + Functions + D1 + Turnstile）

### 8.2 接手前必读

1. 本文件 [`HANDOFF.md`](./HANDOFF.md)
2. [`AGENTS.md`](./AGENTS.md)（项目元信息、协作约定）
3. [`docs/`](docs/) 里所有阶段文档（每个坑、每个 Cloudflare 操作都有详细指引）
4. 关键文件清单（见本文件 §2.2）

### 8.3 接手时的标准动作

1. 读 `AGENTS.md` 了解背景
2. 读 `docs/` 里跟当前任务相关的阶段文档
3. 任何 Cloudflare / wrangler 配置改动前，**先列出所有「用户必须手动在控制台做的步骤」**
4. 写代码时**主动加诊断日志**（如 `console.log` 关键状态），方便用户反馈时定位
5. 改 `wrangler.toml` 时**双重检查** `database_id`、binding 名等关键字段（见 §5 坑 2）
6. **永远不要**把 secret / token 写进 git 仓库

### 8.4 遇到 bug 时的诊断顺序

1. 看 Cloudflare Pages 项目的 **Logs** 标签（wrangler pages deployment tail 也能看）
2. 看浏览器 F12 → Network → 相关请求的响应
3. 看 wrangler.toml 配置是否完整
4. 看 Cloudflare 控制台绑定是否生效
5. 比对 `docs/` 里过往阶段文档，看是不是老问题复发

### 8.5 不要做的事

- ❌ 不要替用户在 Cloudflare 控制台点（他们需要亲手操作来学习）
- ❌ 不要把任何 Secret 写进代码或 commit 信息
- ❌ 不要「框架约定 ≠ 你的位置」（Functions 必须仓库根，不在 src/）
- ❌ 不要 commit 时把 `.claude/` 加进去（已被 `.gitignore` 排除）
- ❌ 不要假设用户理解术语——每个新概念先用类比讲清楚

---

## 9. 总结：这个项目最值得复用的经验

1. **学习项目的正确打开方式**：用 AI 写代码、自己亲手点控制台，形成完整闭环
2. **「文档先行」**：AGENTS.md / HANDOFF.md / 各阶段 docs，让任何接手的人/AI 都能跑通
3. **「坑要写进文档」**：踩过的每个坑都明确写下来，未来的自己不会再踩
4. **「框架约定要主动读」**：Cloudflare Pages 的 Functions 路径、wrangler.toml 的 binding 行为，都是平台约定，不读文档就会踩坑
5. **「Secret 永远不进 git」**：用 wrangler secret put，永远不要写进 wrangler.toml 或代码
6. **「devops 循环要会跑」**：本地改 → commit → push → Cloudflare 自动部署 → 浏览器强刷验证

---

> **最后**：这份文档是「项目最重要的交付物」之一。**未来加任何新阶段**，都按这个模板更新：先写 docs/pN-*.md 讲清怎么做，再写代码，最后 commit + push。如果未来你或别的 Agent 能看完这份文档独立完成同样的项目，说明它合格。
>
> **变更日志**：

| 日期 | 变更 | 作者 |
| --- | --- | --- |
| 2026-08-26 | 初始版本（P0–P4 Turnstile 全部完成） | AI Agent（与你协作） |