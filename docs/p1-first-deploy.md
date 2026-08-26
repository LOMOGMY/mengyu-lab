# P1 部署到 Cloudflare Pages 完整指引

> 这一步由**你（学习者）在 Cloudflare 网页控制台手动操作**。
> 我（AI Agent）会告诉你每一步做什么、要勾什么、可能踩的坑。
> 完成之后再回来跟我说一声，我们一起验证线上效果。

---

## 0. 前置条件 ✅

- [ ] 你已经有 **GitHub 账号**（用户名 `LOMOGMY`）
- [ ] 你已经有 **Cloudflare 账号**（如果没有，去 <https://dash.cloudflare.com/sign-up> 注册，免费）
- [ ] 代码已经推送到 `https://github.com/LOMOGMY/mengyu-lab`（刚刚我们已经 push 过了）
- [ ] Cloudflare 账号和 GitHub 账号都**登录在同一个浏览器**里（避免反复跳转）

---

## 1. 创建 Cloudflare Pages 项目

1. 打开 <https://dash.cloudflare.com/> 并登录
2. 在左侧菜单找到 **Workers & Pages**（也可能叫 "Workers 和 Pages"），点进去
3. 点右上角 **Create application**（创建应用）按钮
4. 选择 **Pages** 标签页（不要选 Workers）
5. 选择 **Connect to Git**（连接到 Git），点击 **Get started** / **开始使用**

---

## 2. 授权 Cloudflare 访问你的 GitHub

> ⚠️ 这是最容易踩坑的一步，请**仔细看每一步**。

1. Cloudflare 会跳到 GitHub 让你授权
2. 选择 **All repositories**（所有仓库）或只选 `mengyu-lab`：
   - 推荐先选**单个仓库**：`Only select repositories` → 选 `mengyu-lab`
   - 理由：权限最小化原则，将来如果不想用了方便撤销
3. 看到 GitHub 提示授权成功，回到 Cloudflare

---

## 3. 选择仓库

1. 在 **Select your GitHub account / organization** 下拉框选 `LOMOGMY`
2. 在 **Select a repository** 下拉框选 `mengyu-lab`
3. 点 **Begin setup**（开始设置）

---

## 4. 配置构建设置（关键！）

这一步 Cloudflare 会让你填**构建命令**和**构建输出目录**。我们这个项目**没有用任何构建工具**，直接是静态 HTML，所以要这样填：

| 配置项 | 值 | 说明 |
| --- | --- | --- |
| **Project name**（项目名） | `mengyu-lab` | 之后你的网址会基于这个名字，例如 `mengyu-lab.pages.dev` |
| **Production branch**（生产分支） | `main` | 我们默认分支就是 `main` |
| **Framework preset**（框架预设） | **None** | 必须选 None 或 "Plain HTML"，不要选别的 |
| **Build command**（构建命令） | **留空** | 我们没有构建步骤 |
| **Build output directory**（构建输出目录） | `src` | ⚠️ 重要：必须填 `src`，因为我们的 HTML 在 `src/index.html` |

> 💡 **为什么输出目录填 `src`？**
> Cloudflare 会把这个目录下的所有文件作为网站根目录。我们的 `index.html` 在 `src/` 下，所以填 `src`。
> 如果你把 HTML 直接放在仓库根目录（项目里直接有 `index.html`），那这里就填空或填 `.`。

---

## 5. 保存并部署

1. 点 **Save and Deploy**（保存并部署）
2. Cloudflare 会开始构建，第一次大约需要 30 秒到 2 分钟
3. 看到 **Success!** 表示成功
4. 在项目页面顶部会显示你的网址，类似：
   ```
   https://mengyu-lab.pages.dev
   ```
   或者带 hash 的：
   ```
   https://<random-hash>.mengyu-lab.pages.dev
   ```

---

## 6. 第一次验证（必做！）

打开 Cloudflare 给你的网址，**应该看到**：

- [ ] 顶部有 "葛孟雨 · Ge Mengyu" 品牌名
- [ ] Hero 区显示名字、标语 "AI 算法工程师 / 大模型 & 具身智能"
- [ ] 滚动能看到「关于 / 工作经历 / 核心项目 / 学术成果 / 荣誉奖项 / 联系我」六个区块
- [ ] 顶部导航点击能平滑滚动到对应区段
- [ ] 在小屏（手机宽度）下排版正常

**如果看到**：

- ❌ 404：检查「Build output directory」是不是填成了 `src`，再触发一次部署（见第 7 步）
- ❌ 样式丢失（白板）：同上，输出目录不对
- ❌ "There is nothing here yet"：项目还没有构建完成，等 1-2 分钟刷新

---

## 7. 常见问题：怎么重新部署

以后你每次 `git push` 到 `main` 分支，Cloudflare 会**自动**重新部署（不需要你做任何事）。

如果改了配置想手动触发：

1. 进入 Pages 项目 → **Deployments** 标签
2. 点右上角 **...** → **Retry deployment**（重试部署）

---

## 8. 验证完成清单 ✅

把下面这条发给我，告诉我完成了：

> ✅ 我已经完成 P1 部署，网站访问地址是：_____
> （或者你看到的任何报错截图也行）

接下来我们会做：

- **P2**：扩展内容（多页面 / 项目详情 / 更好的排版）
- **P3**：加 Pages Functions（联系表单 API）
- **P4**：加 D1 数据库（保存表单数据）

---

## 9. 一次性收尾：截图给我看

为了我确认一切正常，麻烦你：

1. 打开部署好的网站
2. 截一张**完整页面**的图（按 Ctrl+Shift+S 或 Cmd+Shift+S）
3. 把截图发给我

我会基于截图给一些排版/配色上的微调建议。