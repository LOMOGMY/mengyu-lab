# P2 多页面架构与自动部署

> 本阶段的目标是把单页扩展为「首页 + 项目列表/详情 + 博客」，同时让你体验**Cloudflare Pages 的自动部署**——一次 push，线上自动更新。

---

## 1. P2 包含的新页面

- `/projects/` — 项目列表页
- `/projects/embodied-brain.html` — EmbodiedBrain 详情
- `/projects/ai-amc.html` — AI-AMC 详情
- `/projects/rb-scheduling.html` — 簇间 RB 调度详情
- `/blog/` — 随笔 / 博客列表页
- 首页「核心项目」卡片和导航都已改为跳转到对应详情页

---

## 2. 自动部署：第一次见证它工作

我们刚刚 `git push` 完，回到 Cloudflare 控制台：

1. 进入你的 Pages 项目 → **Deployments** 标签
2. 你会看到一条**新的部署**正在运行（标题类似 `d72390f feat(site): ...`）
3. 等约 30 秒到 2 分钟，状态变为 ✅ Success
4. 打开 https://mengyu-lab.pages.dev **强制刷新**（Ctrl/Cmd + Shift + R）

你应该看到：

- [ ] 顶部导航多出「项目」「随笔」两个入口
- [ ] 首页「核心项目」标题右上角有个箭头「→」
- [ ] 点击首页任意项目卡片，**会跳到对应详情页**
- [ ] 顶部「随笔」链接可进入博客页
- [ ] 详情页顶部有「← 返回项目列表」链接

---

## 3. 验证完成清单 ✅

部署成功后请回复：

> ✅ P2 完成，可以点击首页项目卡片跳转到详情页

或贴一张详情页的截图。

---

## 4. P2 之后：怎么继续「更新 → 部署」循环

这是这次学习**最重要的内化部分**。接下来任何阶段，你的工作流都一样：

```text
1. 本地编辑 src/ 下的文件
2. 在浏览器看效果（可选，用 python -m http.server 起本地预览）
3. git add .
4. git commit -m "feat/fix/docs: ..."
5. git push
6. Cloudflare 几秒到几分钟后自动部署
7. 访问 https://mengyu-lab.pages.dev 看线上效果（带 Ctrl+Shift+R 强制刷新）
```

**不需要再登录 Cloudflare**。Pages 永远盯着 `main` 分支，push 即部署。

---

## 5. P3 预告：加 Pages Functions + 联系表单

P3 我们会：

1. 在 `src/contact/` 加一个表单（姓名 / 邮箱 / 留言）
2. 在 `functions/api/contact.ts` 写一个 Cloudflare Pages Function（API endpoint）
3. 表单提交 → 调用 API → API 把数据写入 **D1 数据库**
4. 你填一张表 → 数据真的进了数据库（我们在 Pages 控制台装一个 wrangler 命令查看）

到那一步，你就完整理解了 **静态站 + Serverless + 数据库** 的现代 Web 三件套 🚀