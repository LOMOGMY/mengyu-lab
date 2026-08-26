// functions/api/messages.ts
// 读取留言列表（最新 50 条）。
//
//   GET /api/messages -> { ok, messages: [...] }

interface Env {
  DB: D1Database;
}

interface MessageRow {
  id: number;
  name: string;
  email: string;
  message: string;
  created_at: string;
}

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });

export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  try {
    const result = await env.DB
      .prepare(
        'SELECT id, name, email, message, created_at FROM messages ORDER BY id DESC LIMIT 50'
      )
      .all<MessageRow>();

    return json({
      ok: true,
      messages: result.results ?? [],
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('DB query failed:', msg);
    return json(
      {
        ok: false,
        messages: [],
        error:
          msg.includes('no such table') || msg.includes('messages')
            ? '数据库表尚未初始化。请按 docs/p3-form-and-d1.md 第 4 步执行建表 SQL。'
            : `数据库查询失败：${msg}`,
      },
      500
    );
  }
};