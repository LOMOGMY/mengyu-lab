# mengyu-lab

葛孟雨 (Ge Mengyu) 的个人网站项目 — 一个用于学习「写代码 → 部署 → 更新 → 再部署」全流程的纯前端实践。

## 在线预览

部署到 Cloudflare Pages 之后会在这里更新 URL（默认会是 `https://mengyu-lab.pages.dev`）。

## 本地预览

```bash
cd src
python -m http.server 8000
# 然后浏览器打开 http://localhost:8000
```

或使用 Node：

```bash
cd src
npx serve
```

## 项目结构

```text
mengyu-lab/
├── AGENTS.md            ← 项目背景与协作约定（给 AI Agent 看）
├── README.md            ← 本文件
├── HANDOFF.md           ← ⭐ 完整交付文档（最重要！所有坑、命令、流程）
├── docs/                ← 各阶段图文教程
├── db/
│   └── schema.sql       ← D1 建表语句（在 Cloudflare 控制台执行）
├── wrangler.toml        ← Cloudflare Pages 配置
└── src/                 ← 网站源代码
    ├── index.html              ← 首页
    ├── projects/               ← 项目页
    │   ├── index.html
    │   ├── embodied-brain.html
    │   ├── ai-amc.html
    │   └── rb-scheduling.html
    ├── blog/                   ← 随笔/博客页
    │   └── index.html
    ├── contact/                ← 联系表单页（P3 新增）
    │   └── index.html
    ├── functions/              ← Cloudflare Pages Functions（P3 新增）
    │   └── api/
    │       ├── contact.ts      ← POST /api/contact
    │       └── messages.ts     ← GET /api/messages
    ├── styles/
    │   ├── main.css            ← 共享样式
    │   ├── page.css            ← 详情页/列表页样式
    │   └── contact.css         ← 联系表单样式
    └── scripts/
        ├── main.js             ← 首页脚本
        └── contact.js          ← 联系表单脚本
```

## 技术栈

- HTML5 / CSS3 / 原生 JavaScript（无构建工具）
- 部署平台：Cloudflare Pages

详细学习路径见 [`AGENTS.md`](./AGENTS.md)；完整的"从 0 到生产"步骤、所有踩坑清单见 [`HANDOFF.md`](./HANDOFF.md)。