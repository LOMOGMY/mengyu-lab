// 联系表单 - 提交留言 + 拉取留言列表
// 这一段只在浏览器里运行，调用后端的 Pages Functions。

(() => {
  const form = document.getElementById('contact-form');
  const statusEl = document.getElementById('form-status');
  const submitBtn = document.getElementById('submit-btn');
  const hintEl = document.getElementById('turnstile-hint');
  const listEl = document.getElementById('messages-list');
  const countEl = document.getElementById('messages-count');
  const reloadBtn = document.getElementById('reload-messages');

  // Turnstile token 状态：用户完成验证后才有值
  let turnstileToken = '';

  // Turnstile SDK 加载完成回调（HTML 里通过 ?onload=onTurnstileLoad 指定）
  window.onTurnstileLoad = () => {
    if (hintEl) hintEl.textContent = '请完成人机验证后提交留言';
  };

  // Turnstile 验证成功回调（HTML 里通过 data-callback 指定）
  window.onTurnstileSuccess = (token) => {
    turnstileToken = token || '';
    submitBtn.disabled = !turnstileToken;
    if (hintEl) hintEl.textContent = turnstileToken
      ? '✓ 已通过人机验证'
      : '请完成人机验证后提交留言';
  };

  const setStatus = (msg, type) => {
    statusEl.textContent = msg;
    statusEl.className = `form-status show ${type}`;
  };

  const clearStatus = () => {
    statusEl.textContent = '';
    statusEl.className = 'form-status';
  };

  const escapeHtml = (s) =>
    String(s ?? '').replace(/[&<>"']/g, (c) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    }[c]));

  const formatTime = (iso) => {
    try {
      const d = new Date(iso);
      return d.toLocaleString('zh-CN', { hour12: false });
    } catch {
      return iso;
    }
  };

  // ---- 提交留言 ----
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearStatus();

    if (!turnstileToken) {
      setStatus('请先完成人机验证。', 'error');
      return;
    }

    const formData = new FormData(form);
    const payload = {
      name: String(formData.get('name') || '').trim(),
      email: String(formData.get('email') || '').trim(),
      message: String(formData.get('message') || '').trim(),
      turnstileToken,
    };

    // 简单的客户端校验（与服务端校验互为冗余）
    if (!payload.name || !payload.email || !payload.message) {
      setStatus('请完整填写所有字段。', 'error');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)) {
      setStatus('邮箱格式不正确。', 'error');
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = '提交中…';

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setStatus(data.error || `提交失败 (HTTP ${res.status})`, 'error');
        // 验证失败时重置 Turnstile，让用户重新验证
        if (window.turnstile && typeof window.turnstile.reset === 'function') {
          window.turnstile.reset();
          turnstileToken = '';
          submitBtn.disabled = true;
          if (hintEl) hintEl.textContent = '请重新完成人机验证';
        }
        return;
      }

      setStatus('提交成功！感谢你的留言。', 'success');
      form.reset();
      loadMessages(); // 刷新列表
      // 重置 Turnstile
      if (window.turnstile && typeof window.turnstile.reset === 'function') {
        window.turnstile.reset();
        turnstileToken = '';
        submitBtn.disabled = true;
        if (hintEl) hintEl.textContent = '请完成人机验证后提交留言';
      }
    } catch (err) {
      setStatus(`网络错误：${err.message}`, 'error');
      submitBtn.disabled = false;
      submitBtn.textContent = '提交留言';
    }
  });

  // ---- 拉取留言列表 ----
  const loadMessages = async () => {
    listEl.innerHTML = '<p class="muted">加载中…</p>';
    try {
      const res = await fetch('/api/messages');
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        listEl.innerHTML = `<p class="muted">加载失败：${escapeHtml(data.error || res.status)}</p>`;
        countEl.textContent = '';
        return;
      }

      const items = data.messages || [];
      countEl.textContent = items.length ? `(${items.length})` : '';

      if (items.length === 0) {
        listEl.innerHTML = '<p class="muted">还没有留言 — 来抢沙发！</p>';
        return;
      }

      listEl.innerHTML = items.map((m) => `
        <div class="message-item">
          <div class="msg-head">
            <span class="msg-name">${escapeHtml(m.name)}</span>
            <span class="msg-time">${escapeHtml(formatTime(m.created_at))}</span>
          </div>
          <div class="msg-email">${escapeHtml(m.email)}</div>
          <div class="msg-body">${escapeHtml(m.message)}</div>
        </div>
      `).join('');
    } catch (err) {
      listEl.innerHTML = `<p class="muted">网络错误：${escapeHtml(err.message)}</p>`;
    }
  };

  reloadBtn.addEventListener('click', loadMessages);
  loadMessages(); // 页面打开时自动拉一次
})();