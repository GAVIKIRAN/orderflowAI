// ── View switching ──────────────────────────────────────────────
function showView(name) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('view-' + name).classList.add('active');
  document.querySelector(`[data-view="${name}"]`).classList.add('active');
  if (name === 'dashboard') loadDashboard();
}

// ── Chat helpers ────────────────────────────────────────────────
const chatMessages = () => document.getElementById('chatMessages');

function scrollBottom() {
  const el = chatMessages();
  el.scrollTop = el.scrollHeight;
}

function appendMsg(role, html, extraClass = '') {
  const div = document.createElement('div');
  div.className = `msg ${role} ${extraClass}`.trim();
  const avatarText = role === 'user' ? 'YOU' : 'AI';
  div.innerHTML = `
    <div class="msg-avatar">${avatarText}</div>
    <div class="msg-bubble">${html}</div>
  `;
  chatMessages().appendChild(div);
  scrollBottom();
  return div;
}

function showTyping() {
  const div = document.createElement('div');
  div.className = 'msg bot';
  div.id = 'typingIndicator';
  div.innerHTML = `
    <div class="msg-avatar">AI</div>
    <div class="msg-bubble">
      <div class="typing-dots"><span></span><span></span><span></span></div>
    </div>
  `;
  chatMessages().appendChild(div);
  scrollBottom();
}

function removeTyping() {
  const el = document.getElementById('typingIndicator');
  if (el) el.remove();
}

// ── Status badge helper ─────────────────────────────────────────
function statusBadge(status) {
  const map = {
    'Received': 'received',
    'In Review': 'review',
    'Accepted': 'accepted'
  };
  const cls = map[status] || 'received';
  return `<span class="badge ${cls}"><span class="badge-dot"></span>${status}</span>`;
}

// ── Render an order card ────────────────────────────────────────
function renderOrderCard(order) {
  const fields = [
    { key: 'Part', val: order.part_name || '—' },
    { key: 'Material', val: order.material || '—' },
    { key: 'Quantity', val: order.quantity ? `${order.quantity} units` : '—' },
    { key: 'Specs', val: order.specs || '—' },
    { key: 'Deadline', val: order.deadline || '—' },
    { key: 'Status', val: statusBadge(order.status) }
  ];
  return `
    <div class="order-card">
      <div class="order-card-header">📦 ORDER CARD #${order.id}</div>
      <div class="order-card-body">
        ${fields.map(f => `
          <div class="order-field">
            <div class="key">${f.key}</div>
            <div class="val">${f.val}</div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

// ── Render quality logs ─────────────────────────────────────────
function renderQualityCard(order) {
  if (!order.quality_logs || order.quality_logs.length === 0) return '';
  return `
    <div class="quality-card">
      <div class="quality-card-header">🛡️ QUALITY LOG — Order #${order.id}</div>
      ${order.quality_logs.map(log => `
        <div class="quality-entry">
          <div class="quality-time">⏰ ${log.time}</div>
          <div class="quality-note">${log.note}</div>
        </div>
      `).join('')}
    </div>
  `;
}

// ── Handle chat response ────────────────────────────────────────
function handleResponse(data) {
  const type = data.type;

  if (type === 'order_created') {
    const html = `<p>${data.message}</p>` + renderOrderCard(data.order);
    appendMsg('bot success', html);
  }
  else if (type === 'status_updated') {
    const html = `<p>${data.message}</p>` + renderOrderCard(data.order) + renderQualityCard(data.order);
    appendMsg('bot success', html);
  }
  else if (type === 'quality_logged') {
    const html = `<p>${data.message}</p>` + renderQualityCard(data.order);
    appendMsg('bot success', html);
  }
  else if (type === 'order_info') {
    const html = `<p>${data.message}</p>` + renderOrderCard(data.order) + renderQualityCard(data.order);
    appendMsg('bot', html);
  }
  else if (type === 'order_list') {
    const orderCards = (data.orders || []).map(renderOrderCard).join('');
    const html = `<p>${data.message}</p>` + (orderCards || '<p>No orders yet.</p>');
    appendMsg('bot', html);
  }
  else if (type === 'error') {
    appendMsg('bot error', `<p>${data.message}</p>`);
  }
  else {
    appendMsg('bot', `<p>${data.message || 'Unexpected response.'}</p>`);
  }
}

// ── Send message ────────────────────────────────────────────────
async function sendMessage() {
  const input = document.getElementById('chatInput');
  const btn = document.getElementById('sendBtn');
  const text = input.value.trim();
  if (!text) return;

  appendMsg('user', `<p>${escapeHtml(text)}</p>`);
  input.value = '';
  autoResize(input);

  btn.disabled = true;
  showTyping();

  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: text })
    });
    const data = await res.json();
    removeTyping();
    handleResponse(data);
  } catch (err) {
    removeTyping();
    appendMsg('bot error', `<p>❌ Could not reach server. Is Flask running?</p>`);
  } finally {
    btn.disabled = false;
    input.focus();
  }
}

// ── Keyboard ────────────────────────────────────────────────────
function handleKey(e) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
}

function autoResize(el) {
  el.style.height = 'auto';
  el.style.height = Math.min(el.scrollHeight, 120) + 'px';
}

// ── Dashboard ───────────────────────────────────────────────────
async function loadDashboard() {
  try {
    const res = await fetch('/api/orders');
    const orders = await res.json();
    renderDashboard(orders);
  } catch (err) {
    document.getElementById('ordersTableBody').innerHTML =
      '<tr><td colspan="7" class="empty-row">❌ Failed to load orders.</td></tr>';
  }
}

function renderDashboard(orders) {
  const total    = orders.length;
  const review   = orders.filter(o => o.status === 'In Review').length;
  const accepted = orders.filter(o => o.status === 'Accepted').length;
  const received = orders.filter(o => o.status === 'Received').length;

  document.getElementById('statTotal').textContent    = total;
  document.getElementById('statReview').textContent   = review;
  document.getElementById('statAccepted').textContent = accepted;
  document.getElementById('statReceived').textContent = received;

  const tbody = document.getElementById('ordersTableBody');

  if (orders.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" class="empty-row">No orders yet. Place one in Chat →</td></tr>';
    return;
  }

  // Sort by id descending
  const sorted = [...orders].sort((a, b) => b.id - a.id);

  tbody.innerHTML = sorted.map(o => {
    const latestQuality = o.quality_logs && o.quality_logs.length
      ? o.quality_logs[o.quality_logs.length - 1].note
      : '—';
    return `
      <tr>
        <td><span class="order-id">#${o.id}</span></td>
        <td>${escapeHtml(o.part_name)}</td>
        <td>${escapeHtml(o.material || '—')}</td>
        <td>${o.quantity}</td>
        <td>${escapeHtml(o.deadline || '—')}</td>
        <td>${statusBadge(o.status)}</td>
        <td class="quality-cell">${escapeHtml(latestQuality)}</td>
      </tr>
    `;
  }).join('');
}

// ── Utilities ───────────────────────────────────────────────────
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
