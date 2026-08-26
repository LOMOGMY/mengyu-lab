# P4-Turnstile：反机器人验证

> 本阶段给你的留言板加上 **Cloudflare Turnstile**——Cloudflare 自家的免费人机验证。比 reCAPTCHA 干净、对用户几乎无感知、无限免费额度。

---

## 0. 当前状态

我已经把代码写好并推送到 GitHub（commit `bcbf66e`）。代码里的 site key 是占位符 `YOUR_TURNSTILE_SITE_KEY`，**部署后会报 Turnstile 加载错误**——这是预期。

接下来你做 3 个动作，留言板就完全受 Turnstile 保护了。

---

## 1. 你需要做的 3 个动作

### 动作 1：在 Cloudflare Dashboard 创建 Turnstile widget

1. 打开 <https://dash.cloudflare.com/> 并登录
2. 左侧菜单找 **Turnstile**（可能在 "Security" 区块里；如果找不到就在顶部搜索框搜 "Turnstile"）
3. 点 **Add widget**（添加 widget）
4. 填表：

   | 字段 | 值 |
   | --- | --- |
   | **Widget name** | `mengyu-lab-contact`（自己取个能认出的名字） |
   | **Hostname** | 先点 **Add hosts** → 填 `mengyu-lab.pages.dev` 和 `localhost`（后面会讲为什么） |
   | **Widget Mode** | 选 **Managed**（推荐） |
   | **Pre-clearance** | **关闭**（这个是付费功能） |

5. 点 **Create**
6. 创建成功后页面会显示两个 key：

   ```
   Site Key   ：0x4AAAAAAA...（公开的，前端用）
   Secret Key ：0x4AAAAAAA...（私有的，服务端用）
   ```

7. **复制这两个 key** 备用

---

### 动作 2：把 Site Key 填进前端

把代码里 `YOUR_TURNSTILE_SITE_KEY` 替换成你拿到的 Site Key。

1. 打开 `src/contact/index.html`
2. 找到这一行：

   ```html
   <div class="cf-turnstile" data-sitekey="YOUR_TURNSTILE_SITE_KEY" data-callback="onTurnstileSuccess"></div>
   ```

3. 把 `YOUR_TURNSTILE_SITE_KEY` 换成你的真实 Site Key

---

### 动作 3：把 Secret Key 配成 Cloudflare Secret

> ⚠️ Secret Key **不能写进代码或 git**。要用 `wrangler secret` 命令行工具。

#### 3a. 安装 wrangler（一次性）

打开终端（Git Bash 或 PowerShell），跑：

```bash
npm install -g wrangler
```

如果你的电脑没装 Node.js，先去 <https://nodejs.org/> 下载 LTS 版安装。

#### 3b. 登录 wrangler

```bash
wrangler login
```

会弹浏览器让你授权 Cloudflare 账号。

#### 3c. 设置 Secret

```bash
cd <你项目根目录>/mengyu-lab
wrangler pages secret put TURNSTILE_SECRET --project-name=mengyu-lab
```

> ⚠️ **项目名**：在 Cloudflare Dashboard Pages 项目左上角能看到，叫什么就用什么。

执行后会提示：

```
Enter a secret value: 
```

**粘贴你的 Secret Key**，按回车。看到 ✅ 就成功了。

> 💡 **为什么叫 "secret"？**
> 这个值会被 Cloudflare 加密存储，**只注入到 Function 运行时**，前端永远拿不到。即使有人看你的 git 仓库或源代码，也看不到这个值。

---

### 动作 4：推送最终代码 + 验证

1. 在 `src/contact/index.html` 改完 site key 后，commit + push：

   ```bash
   git add src/contact/index.html
   git commit -m "feat(p4): fill Turnstile site key"
   git push
   ```

2. 等 Cloudflare 重新部署（约 1-2 分钟）

3. 打开 <https://mengyu-lab.pages.dev/contact/> ，**强制刷新**（Ctrl+Shift+R）

---

## 2. 验证 P4-Turnstile 完成

**应该看到**：

- [ ] 表单下方有一个 Turnstile 验证组件（Managed 模式下，常常是空白 + 一个角标）
- [ ] 第一次进入时，可能需要等几秒让 Turnstile 加载完
- [ ] 验证通过后，「提交留言」按钮从灰色变为可点
- [ ] 提交留言 → 仍然能成功写入 D1
- [ ] 浏览器 F12 → Network → 看 `/api/contact` 请求：成功时 200，token 验证失败时 400

**反向测试**（可选，验证 Turnstile 真的在工作）：

1. 打开<https://mengyu-lab.pages.dev/contact/> → 打开 F12 → Network
2. **不要**完成 Turnstile 验证，直接用浏览器控制台（Console 标签）跑：

   ```javascript
   fetch('/api/contact', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({ name: 'test', email: 'a@b.com', message: 'hi', turnstileToken: 'fake' })
   }).then(r => r.json()).then(console.log)
   ```

3. 应该返回 `{ ok: false, error: "人机验证失败…" }` —— 说明**没有 Turnstile token 就写不进数据**，反垃圾生效 ✅

---

## 3. 常见问题

### Q1：Turnstile 显示 "Invalid site key"
**原因**：`YOUR_TURNSTILE_SITE_KEY` 没替换，或者替换错了。

**排查**：
- 看 `src/contact/index.html`，确认 sitekey 已替换成真实值
- 确认 widget 已加入 hostname `mengyu-lab.pages.dev`

### Q2：提交时报 "服务端 TURNSTILE_SECRET 未配置"
**原因**：Secret 没设成功。

**排查**：
```bash
wrangler pages secret list --project-name=mengyu-lab
```
应该看到 `TURNSTILE_SECRET: ***` 一行。如果没有，重新执行动作 3c。

### Q3：本地开发想测试
**原因**：Turnstile 默认只允许在创建 widget 时填的 hostname 跑。

**修复**：
- 创建 widget 时把 `localhost` 加入 hostname 列表
- 本地起服务：`cd src && python -m http.server 8000`
- 浏览器打开 <http://localhost:8000/contact/>，Turnstile 会以测试模式运行（不严格验证）

### Q4：Cloudflare 免费版 Turnstile 限制
**答案**：**没有限制**。Turnstile 全功能免费、无限次数，是 Cloudflare 永久免费的服务之一。

---

## 4. 完成后告诉我

回复以下任一：

> ✅ P4 完成，Turnstile 工作正常
> ❌ 卡在第 X 步，错误是：_____

---

## 5. P4 之后的可选加固（按需）

| 任务 | 作用 | 难度 |
| --- | --- | --- |
| **留言分页** | 留言超过 50 条时分页 | 中（需要 SQL OFFSET/LIMIT） |
| **IP 限流** | 同一 IP 1 分钟只能提交 1 条 | 中（Function 里维护时间戳） |
| **Cloudflare Rate Limiting** | Dashboard 配置的边缘限流 | 低（全在网页操作） |
| **Cloudflare Access** | /admin 路径加锁，用邮箱一次性登录 | 中（需要 Pages project + Access policy） |

任何一个你想做的时候跟我说。