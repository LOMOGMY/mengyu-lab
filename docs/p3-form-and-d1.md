# P3 完整指引：联系表单 + Pages Functions + D1 数据库

> ⚠️ **这是到目前为止最重要的一步。** 它把"纯前端静态站"扩展为"静态 + Serverless + 数据库"的完整现代 Web 应用。
>
> 本阶段你需要亲自在 Cloudflare 控制台完成 4 个关键动作。代码部分我已经写好了；本指引会**一步一步**告诉你怎么操作。

---

## 0. 在开始之前：理解我们要构建什么

```
┌──────────────────────────────────────────────────────────────┐
│ 用户浏览器                                                    │
│   打开 https://mengyu-lab.pages.dev/contact/                 │
│   看到表单 → 填入 → 点提交 → JS fetch → /api/contact →       │
│   服务端校验 → 写入 D1 → 返回成功 → 刷新留言列表             │
└──────────────────────────────────────────────────────────────┘
```

**4 件新东西**：
1. `src/contact/index.html` — 联系表单页面（已写好）
2. `functions/api/contact.ts` — POST 端点，接收表单数据、写入 D1（已写好）
3. `functions/api/messages.ts` — GET 端点，读取留言列表（已写好）
4. **D1 数据库** — 实际存储留言的地方（**你需要去控制台创建**）

**关键概念（务必先理解）**：
- **绑定（Binding）**：你的 Function 代码里 `context.env.DB` 这个变量，默认是空的。必须去 Cloudflare 控制台把 D1 数据库"绑"到这个 Pages 项目上，绑定后代码才能拿到 `env.DB` 这个对象。
- **不用纠结 wrangler 命令**：P3 我们用 Cloudflare 控制台的网页操作完成所有事情，不要求你用命令行。

**⚠️ Functions 必须放在仓库根（不是 src/ 里）**

> Cloudflare Pages 寻找 Functions 的路径约定：`/functions` 必须在项目根，**不在 Build output directory（如 `src/`、`dist/`）里**。
>
> 这个坑我们一开始踩了：把 `functions/` 放在了 `src/functions/`，结果是 POST 报 HTTP 405（Cloudflare 找不到 Function，只能返回默认的 405 Method Not Allowed）。
>
> 最终目录布局：
> ```text
> mengyu-lab/
> ├── functions/            ← Pages Functions（仓库根）
> │   └── api/
> │       ├── contact.ts
> │       └── messages.ts
> ├── src/                  ← 静态资源（Build output directory）
> │   ├── index.html
> │   └── contact/index.html
> └── wrangler.toml
> ```

---

## 1. 代码已就绪 ✅

我已经把所有代码写好并 push 到 GitHub（commit 见推送记录）。

如果你的 Cloudflare Pages 项目仍然连着 GitHub 仓库，那么**这次 push 已经触发了一次重新部署**。但这次部署会失败 —— 因为 D1 还没建。

这是预期。**继续往下走**，把 D1 建好就行。

---

## 2. 你需要做的 4 个动作（按顺序）

### 动作 1：打开 Cloudflare Dashboard

1. 打开 <https://dash.cloudflare.com/> 并登录
2. 在左侧菜单选择 **Workers & Pages**（如果找不到，搜索 "D1" 也能找到入口）
3. 进入 D1 区域

---

### 动作 2：创建 D1 数据库

1. 点 **Create database**（创建数据库）按钮
2. **Database name** 输入：`mengyu-lab-messages`
   - ⚠️ **注意**：这个名字后面会出现在绑定配置里。保持简单，全小写+连字符，不要用中文或空格。
3. 点 **Create**
4. 创建完成后，**记下页面显示的 Database ID**（一串 UUID，类似 `a1b2c3d4-e5f6-...`）。
   - 这个 ID 现在**用不上**，但下面会用到 wrangler.toml 本地开发配置（先不管）。
5. 你会进入 D1 数据库详情页，左侧有 **Console** 标签

---

### 动作 3：在 D1 Console 里执行建表 SQL

> 📖 **这一步在做什么？**
> 数据库刚建好，里面是空的（没有表）。我们要建一张叫 `messages` 的表来存留言。
> "建表" 在 SQL 里就是 CREATE TABLE，就像新建一个 Excel 工作簿并定义列名。

1. 在 D1 数据库详情页，点左侧 **Console** 标签
2. 你会看到一个 SQL 输入框
3. 把 [`db/schema.sql`](../db/schema.sql) 里的所有内容**完整复制粘贴**进去：

   ```sql
   CREATE TABLE IF NOT EXISTS messages (
     id         INTEGER PRIMARY KEY AUTOINCREMENT,
     name       TEXT    NOT NULL,
     email      TEXT    NOT NULL,
     message    TEXT    NOT NULL,
     created_at TEXT    NOT NULL DEFAULT (datetime('now'))
   );

   CREATE INDEX IF NOT EXISTS idx_messages_created_at
     ON messages (created_at DESC);
   ```

4. 点 **Execute**（或 Run）执行
5. 下方应显示 `Success` 或 `2 rows affected`（两条语句）
6. 在 Console 里输入 `SELECT name FROM sqlite_master WHERE type='table';` 并执行，验证能看到 `messages` 表

---

### 动作 4：把 D1 绑定到 Pages 项目（最关键的一步）

> 📖 **这一步在做什么？**
> 建好数据库、建好表了，但你的 Pages 项目**还不知道**这个数据库存在。
> 你要"绑"一下，告诉 Cloudflare："我这个 Pages 项目要用这个 D1 数据库，对应变量名叫 `DB`"。
> 绑完后，你 Function 代码里的 `context.env.DB` 才会真的指向这个数据库。

**⚠️ 重要：先看你的项目里有没有 `wrangler.toml`！**

| 情况 | 怎么做 |
| --- | --- |
| 仓库根目录**没有** `wrangler.toml` | 在 Cloudflare 控制台 → Settings → D1 database bindings 添加（控制台 UI 可用） |
| 仓库根目录**有** `wrangler.toml` | 控制台 UI **会被禁用**，必须在 `wrangler.toml` 里配置。下方有详细步骤 |

**情况 A：控制台管理（无 wrangler.toml）**

1. 进入 Pages 项目 → **Settings**（设置）标签
2. 在左侧菜单找到 **Functions** 区块
3. 找到 **D1 database bindings**（或 "D1 数据库绑定"）
4. 点 **Add binding**（添加绑定）或 **Edit**（编辑）
5. **Variable name**（变量名）输入 **`DB`**
   - ⚠️ **必须大写 `DB`**，因为代码里写的是 `env.DB`。变量名一旦定下来，要改就得同时改代码。
6. **D1 database**（数据库）下拉框选你刚才创建的 `mengyu-lab-messages`
7. 点 **Save** 保存

**情况 B：wrangler.toml 管理（有 wrangler.toml——本项目是这种）**

我们的项目根目录有 `wrangler.toml`，所以**所有绑定必须写在里面**，控制台 UI 会显示「此项目的绑定在通过 wrangler.toml 进行管理」。

`wrangler.toml` 关键段落：

```toml
[[d1_databases]]
binding = "DB"                              # 在 Function 里叫 env.DB
database_name = "mengyu-lab-messages"       # 数据库名
database_id = "23e80796-c308-4fdb-9514-..."  # 在 D1 控制台查
```

**怎么查 database_id**：
1. Cloudflare Dashboard → **Workers & Pages** → **D1**
2. 点 `mengyu-lab-messages` 数据库
3. **Database ID** 字段就是它（一串 UUID）

**常见坑**：`wrangler.toml` 里如果 `database_id` 被注释掉（`#` 开头）或填错，Cloudflare 部署时**不会报错**（因为文件语法合法），但运行时 `env.DB` 会是 undefined。提交后**必须确认 wrangler.toml 里的 ID 跟你 D1 控制台看到的一致**。

---

### 动作 5：触发 Cloudflare 重新部署

绑定 D1 后，**必须重新部署一次代码**，Functions 才能拿到绑定。

有两种方式：

**方式 A：自动（推荐）**
- 回到 Cloudflare Pages 项目 → **Deployments** 标签
- 通常绑定改动会自动触发一次新部署；等一会儿看是否出现新记录
- 如果没自动触发，用方式 B

**方式 B：手动**
- **Deployments** → 找到最新一条部署 → 右侧 **...** → **Retry deployment**（重试部署）
- 也可以直接 `git commit --allow-empty -m "chore: trigger redeploy after D1 binding"` 然后 `git push`

等约 30 秒到 2 分钟，部署完成。

---

## 3. 验证 P3 完成

部署完成后打开 <https://mengyu-lab.pages.dev/contact/>，应该看到：

- [ ] 表单页面正常加载（姓名、邮箱、留言三个字段）
- [ ] 下方"最近的留言"区显示「还没有留言 — 来抢沙发！」或「加载中…」
- [ ] 填写一条留言 → 点提交 → 看到「提交成功！」绿色提示
- [ ] 提交后页面自动刷新留言列表，**你的留言出现在最顶部**
- [ ] 刷新页面，留言仍然在（数据真的进了数据库，没丢）

**额外验证**（进阶）：

- [ ] 回 Cloudflare D1 Console，执行 `SELECT * FROM messages;`，能看到你刚才提交的那条数据
- [ ] 再提交几条，列表里按时间倒序显示

---

## 4. 常见问题排查

### Q1：提交时显示 "数据库表尚未初始化…"
**原因**：D1 里还没建 `messages` 表，或者建表 SQL 没成功执行。

**排查**：
- 去 D1 Console 执行 `SELECT name FROM sqlite_master WHERE type='table';`
- 如果列表里没有 `messages`，回去执行动作 3

### Q2：提交时显示 "D1 数据库绑定未生效" 或 "Cannot read properties of undefined (reading 'prepare')"
**原因**：`env.DB` 是 undefined，绑定没生效。

**排查（按顺序）**：

1. **检查 wrangler.toml**
   - 如果项目根有 `wrangler.toml`，确认 `[[d1_databases]]` 段里的 `database_id` 是填好的、正确的
   - 去 D1 控制台核对 UUID 一致

2. **检查控制台状态**
   - 进 Pages 项目 → Settings → Functions → D1 database bindings
   - 如果提示「此项目的绑定在通过 wrangler.toml 进行管理」，说明绑定归 wrangler 管，**控制台是空的、不能操作**
   - 这种情况下只能改 wrangler.toml

3. **重新部署**
   - 改完 wrangler.toml 后，Cloudflare **不会自动**重新部署（push 才触发）
   - 用 `git push` 推送，等待新部署

4. **浏览器强制刷新**（Ctrl+Shift+R），缓存的旧 Function 可能还在跑

### Q3：访问 /contact/ 报 404
**原因**：可能 Cloudflare 在重新部署。

**排查**：
- 看 Deployments 标签，确认最新部署状态是 Success
- 强制刷新浏览器（Ctrl+Shift+R）

### Q4：留言列表一直显示 "加载中…"
**原因**：`/api/messages` 接口报错（大概率 D1 没绑好或表没建）。

**排查**：
- 浏览器 F12 → Network → 找到 `/api/messages` 请求 → 看响应内容
- 如果看到 `数据库表尚未初始化…`，按 Q1 处理
- 如果看到 `数据库查询失败`，按 Q2 处理

### Q5：看到 "Pages Functions not enabled" 之类的提示
**原因**：极少数情况下 Pages 项目没启用 Functions。

**修复**：在 Pages 项目 → Settings → Functions → **Compatibility flags** 区域，确认 Production 兼容性已开启。一般默认就是开的。

### Q6：控制台点击"添加绑定"按钮没反应
**原因**：项目根目录有 `wrangler.toml`，控制台 UI 被锁定。

**修复**：所有绑定都写到 `wrangler.toml` 里，参见动作 4 的「情况 B」。

---

## 5. 完成后请告诉我

回复以下任一：

> ✅ P3 完成，我可以提交留言，刷新后留言还在
> ❌ 卡在第 X 步，错误信息是：_____

---

## 6. P4 预告

P4（最后一个核心阶段）会做：

1. 给留言加**反垃圾保护**（Cloudflare Turnstile —— Cloudflare 自家的免费人机验证，比 reCAPTCHA 干净）
2. 留言列表加**分页**（一次加载太多留言会很慢）
3. 加一个**简单的管理后台**：用 Cloudflare Access 保护（学到这里会再讲）

但在那之前，先把 P3 跑通！🎉