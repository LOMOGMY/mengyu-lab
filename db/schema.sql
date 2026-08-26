-- ============================================================
-- D1 数据库 Schema（建表语句）
-- ============================================================
-- 在 Cloudflare 控制台的 D1 控制台执行这段 SQL：
--   1. 进入 Pages 项目 -> 绑定 -> D1 数据库 -> 打开控制台
--   2. 切到 "Console" 标签
--   3. 把下面的 SQL 粘贴进去 -> 执行
--
-- 表名：messages（留言）
-- 字段：
--   id          - 主键，自增
--   name        - 留言人姓名
--   email       - 邮箱
--   message     - 留言内容
--   created_at  - 留言时间（SQLite 文本时间戳，UTC）
-- ============================================================

CREATE TABLE IF NOT EXISTS messages (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  name       TEXT    NOT NULL,
  email      TEXT    NOT NULL,
  message    TEXT    NOT NULL,
  created_at TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- 索引：按时间倒序查最新留言时加速
CREATE INDEX IF NOT EXISTS idx_messages_created_at
  ON messages (created_at DESC);