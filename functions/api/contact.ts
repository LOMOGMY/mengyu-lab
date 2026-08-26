// functions/api/contact.ts
// 处理「联系表单提交」的 Pages Function。
//
// 工作流：
//  1. 校验请求方法（必须是 POST）
//  2. 解析并校验 JSON body
//  3. 通过 env.DB（D1 绑定）插入到 messages 表
//  4. 返回 JSON 结果
//
// Cloudflare 会自动根据文件路径暴露：
//   POST /api/contact -> 这个文件

interface Env {
  // D1 数据库绑定（你在 Cloudflare 控制台绑定时设置的变量名）
  DB: D1Database;
}

interface ContactPayload {
  name?: unknown;
  email?: unknown;
  message?: unknown;
}

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });

const validateEmail = (s: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  // 诊断日志：确认 D1 绑定是否生效
  console.log('[contact] env keys:', Object.keys(env ?? {}));
  console.log('[contact] env.DB type:', typeof env?.DB);
  console.log('[contact] env.DB has prepare:', typeof env?.DB?.prepare);

  // 1. 校验 Content-Type
  const ct = request.headers.get('content-type') || '';
  if (!ct.includes('application/json')) {
    return json({ ok: false, error: 'Content-Type 必须是 application/json' }, 400);
  }

  // 2. 解析 JSON
  let body: ContactPayload;
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, error: 'JSON 解析失败' }, 400);
  }

  // 3. 校验字段
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const email = typeof body.email === 'string' ? body.email.trim() : '';
  const message = typeof body.message === 'string' ? body.message.trim() : '';

  if (!name || !email || !message) {
    return json({ ok: false, error: '姓名、邮箱、留言都不能为空' }, 400);
  }
  if (name.length > 50 || email.length > 100 || message.length > 1000) {
    return json({ ok: false, error: '字段长度超限' }, 400);
  }
  if (!validateEmail(email)) {
    return json({ ok: false, error: '邮箱格式不正确' }, 400);
  }

  // 4. 写入 D1（prepared statement 防 SQL 注入）
  if (!env.DB || typeof env.DB.prepare !== 'function') {
    console.error('[contact] D1 binding missing or invalid. env.DB =', env.DB);
    return json(
      {
        ok: false,
        error:
          'D1 数据库绑定未生效。请在 Cloudflare 控制台确认 Pages 项目 → Settings → Functions → D1 database bindings 里已添加 DB → mengyu-lab-messages，并触发重新部署（参考 docs/p3-form-and-d1.md）。',
        debug: {
          envKeys: Object.keys(env ?? {}),
          dbType: typeof env?.DB,
        },
      },
      500
    );
  }

  try {
    const result = await env.DB
      .prepare(
        'INSERT INTO messages (name, email, message, created_at) VALUES (?1, ?2, ?3, datetime("now"))'
      )
      .bind(name, email, message)
      .run();

    return json({
      ok: true,
      id: result.meta.last_row_id,
    });
  } catch (err) {
    // 最常见的错：表还没建（messages 表不存在）
    const msg = err instanceof Error ? err.message : String(err);
    console.error('DB insert failed:', msg);
    return json(
      {
        ok: false,
        error:
          msg.includes('no such table') || msg.includes('messages')
            ? '数据库表尚未初始化。请按 docs/p3-form-and-d1.md 第 4 步执行建表 SQL。'
            : `数据库写入失败：${msg}`,
      },
      500
    );
  }
};

// 简单健康检查：GET /api/contact 返回提示信息
export const onRequestGet: PagesFunction<Env> = () =>
  json({
    ok: true,
    hint: '请用 POST 提交 JSON: { name, email, message }',
  });