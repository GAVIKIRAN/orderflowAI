/* ══ RESET & BASE ═══════════════════════════════════════════════ */
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

:root {
  /* Brand */
  --brand:        #0f6e56;
  --brand-light:  #1d9e75;
  --brand-dim:    rgba(29,158,117,0.1);
  --brand-border: rgba(29,158,117,0.25);

  /* Surface */
  --bg-app:       #0e1117;
  --bg-panel:     #13181f;
  --bg-card:      #1a2030;
  --bg-raised:    #1f2840;
  --bg-input:     #141a24;
  --bg-hover:     rgba(255,255,255,0.04);

  /* Borders */
  --border:       rgba(255,255,255,0.07);
  --border-md:    rgba(255,255,255,0.11);
  --border-hi:    rgba(255,255,255,0.18);

  /* Text */
  --text-primary:   #e8edf5;
  --text-secondary: #8b96a9;
  --text-muted:     #4f5a6e;
  --text-accent:    #1d9e75;

  /* Semantic */
  --green:      #22c55e;
  --green-dim:  rgba(34,197,94,0.12);
  --green-bd:   rgba(34,197,94,0.25);
  --blue:       #4ea8f0;
  --blue-dim:   rgba(78,168,240,0.1);
  --blue-bd:    rgba(78,168,240,0.25);
  --amber:      #f59e0b;
  --amber-dim:  rgba(245,158,11,0.1);
  --amber-bd:   rgba(245,158,11,0.25);
  --red:        #ef4444;
  --red-dim:    rgba(239,68,68,0.1);

  /* Type */
  --font:       'Inter', system-ui, sans-serif;
  --mono:       'IBM Plex Mono', monospace;

  /* Layout */
  --sidebar-w:  252px;
  --radius-sm:  6px;
  --radius-md:  10px;
  --radius-lg:  14px;
  --radius-xl:  18px;

  /* Transitions */
  --ease: 0.15s ease;
}

html, body {
  height: 100%;
  font-family: var(--font);
  font-size: 14px;
  background: var(--bg-app);
  color: var(--text-primary);
  line-height: 1.6;
  -webkit-font-smoothing: antialiased;
  overflow: hidden;
}

/* ══ SCROLLBARS ══════════════════════════════════════════════════ */
::-webkit-scrollbar { width: 4px; height: 4px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 2px; }
::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.18); }

/* ══ APP SHELL ═══════════════════════════════════════════════════ */
.app-shell {
  display: flex;
  height: 100vh;
  overflow: hidden;
}

/* ══ SIDEBAR ═════════════════════════════════════════════════════ */
.sidebar {
  width: var(--sidebar-w);
  flex-shrink: 0;
  background: var(--bg-panel);
  border-right: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* Brand */
.sidebar-brand {
  display: flex;
  align-items: center;
  gap: 11px;
  padding: 20px 18px 16px;
  border-bottom: 1px solid var(--border);
}

.brand-icon {
  width: 36px;
  height: 36px;
  border-radius: var(--radius-md);
  background: var(--brand-dim);
  border: 1px solid var(--brand-border);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--brand-light);
  font-size: 18px;
  flex-shrink: 0;
}

.brand-text {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.brand-name {
  font-size: 14px;
  font-weight: 600;
  letter-spacing: -0.3px;
  color: var(--text-primary);
}

.brand-name em {
  font-style: normal;
  color: var(--brand-light);
}

.brand-sub {
  font-size: 10px;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.6px;
  font-weight: 500;
}

/* Section labels */
.sidebar-section-label {
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.8px;
  color: var(--text-muted);
  padding: 16px 18px 6px;
}

/* Nav */
.sidebar-nav {
  padding: 0 10px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 9px;
  width: 100%;
  padding: 8px 10px;
  border: none;
  background: none;
  border-radius: var(--radius-sm);
  color: var(--text-secondary);
  font-family: var(--font);
  font-size: 13.5px;
  font-weight: 500;
  cursor: pointer;
  text-align: left;
  transition: all var(--ease);
  position: relative;
}

.nav-item i { font-size: 16px; flex-shrink: 0; }

.nav-item:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.nav-item.active {
  background: var(--brand-dim);
  color: var(--brand-light);
  border: 1px solid var(--brand-border);
}

.nav-badge {
  width: 7px; height: 7px;
  border-radius: 50%;
  margin-left: auto;
}

.nav-badge.online { background: var(--green); }

/* Quick commands */
.sidebar-divider {
  height: 1px;
  background: var(--border);
  margin: 12px 0 0;
}

.quick-cmds {
  padding: 6px 10px;
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.quick-cmd {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 7px 10px;
  border-radius: var(--radius-sm);
  color: var(--text-muted);
  font-size: 12.5px;
  cursor: pointer;
  transition: all var(--ease);
}

.quick-cmd i { font-size: 13px; flex-shrink: 0; }

.quick-cmd:hover {
  background: var(--bg-hover);
  color: var(--text-secondary);
}

/* Footer */
.sidebar-footer {
  margin-top: auto;
  padding: 12px 18px;
  border-top: 1px solid var(--border);
}

.sidebar-footer-info {
  display: flex;
  align-items: center;
  gap: 7px;
  font-size: 11.5px;
  color: var(--text-muted);
}

/* ══ DOTS ════════════════════════════════════════════════════════ */
.dot {
  width: 7px; height: 7px;
  border-radius: 50%;
  flex-shrink: 0;
}

.dot.green  { background: var(--green); }
.dot.amber  { background: var(--amber); }
.dot.blue   { background: var(--blue); }

.dot.pulse {
  animation: glow 2s ease-in-out infinite;
}

@keyframes glow {
  0%, 100% { box-shadow: 0 0 0 0 rgba(34,197,94,0.5); }
  50%       { box-shadow: 0 0 0 4px rgba(34,197,94,0); }
}

/* ══ MAIN PANEL ══════════════════════════════════════════════════ */
.main-panel {
  flex: 1;
  display: flex;
  overflow: hidden;
  position: relative;
  min-width: 0;
}

/* ══ VIEW ════════════════════════════════════════════════════════ */
.view {
  display: none;
  flex-direction: column;
  width: 100%;
  height: 100vh;
  overflow: hidden;
}

.view.active { display: flex; }

/* ══ PANEL HEADER ════════════════════════════════════════════════ */
.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 28px;
  background: var(--bg-panel);
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
  gap: 16px;
}

.header-left { display: flex; flex-direction: column; gap: 2px; }

.panel-title {
  font-size: 16px;
  font-weight: 600;
  letter-spacing: -0.3px;
  color: var(--text-primary);
}

.panel-sub {
  font-size: 12px;
  color: var(--text-muted);
}

.header-right { display: flex; align-items: center; gap: 10px; flex-shrink: 0; }

.status-pill {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: 20px;
  background: var(--green-dim);
  border: 1px solid var(--green-bd);
  font-size: 11.5px;
  color: var(--green);
  font-weight: 500;
}

.btn-secondary {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 7px 14px;
  border-radius: var(--radius-sm);
  background: var(--bg-card);
  border: 1px solid var(--border-md);
  color: var(--text-secondary);
  font-family: var(--font);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all var(--ease);
}

.btn-secondary i { font-size: 14px; }
.btn-secondary:hover { border-color: var(--border-hi); color: var(--text-primary); background: var(--bg-raised); }

/* ══ CHAT BODY ═══════════════════════════════════════════════════ */
.chat-body {
  flex: 1;
  overflow-y: auto;
  padding: 24px 28px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  background: var(--bg-app);
}

/* ── Message rows ── */
.msg-row {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  animation: msgIn 0.22s ease;
}

.msg-row.user { flex-direction: row-reverse; }

@keyframes msgIn {
  from { opacity: 0; transform: translateY(6px); }
  to   { opacity: 1; transform: translateY(0); }
}

/* Avatar */
.msg-avatar {
  width: 34px; height: 34px;
  border-radius: var(--radius-sm);
  flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
  font-size: 16px;
}

.ai-avatar {
  background: var(--brand-dim);
  border: 1px solid var(--brand-border);
  color: var(--brand-light);
}

.user-avatar {
  background: var(--blue-dim);
  border: 1px solid var(--blue-bd);
  color: var(--blue);
}

/* Message content */
.msg-content { display: flex; flex-direction: column; gap: 4px; max-width: 70%; }
.msg-row.user .msg-content { align-items: flex-end; }

.msg-meta {
  font-size: 11.5px;
  color: var(--text-muted);
  padding: 0 2px;
  display: flex; align-items: center; gap: 6px;
}

.msg-time { color: var(--text-muted); opacity: 0.7; }

/* Bubble */
.msg-bubble {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  border-top-left-radius: 4px;
  padding: 12px 16px;
  font-size: 13.5px;
  line-height: 1.65;
  color: var(--text-primary);
}

.msg-row.user .msg-bubble {
  background: var(--bg-raised);
  border-color: var(--border-md);
  border-top-left-radius: var(--radius-lg);
  border-top-right-radius: 4px;
}

.msg-bubble.success {
  background: rgba(15,110,86,0.08);
  border-color: var(--brand-border);
}

.msg-bubble.error {
  background: var(--red-dim);
  border-color: rgba(239,68,68,0.25);
}

.msg-bubble p { margin-bottom: 6px; }
.msg-bubble p:last-child { margin-bottom: 0; }
.msg-bubble strong { color: var(--brand-light); font-weight: 600; }

/* Capability grid */
.capability-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  margin-top: 12px;
}

.cap-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  background: rgba(255,255,255,0.03);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  padding: 9px 10px;
  font-size: 12.5px;
  line-height: 1.5;
  color: var(--text-secondary);
}

.cap-item i {
  font-size: 15px;
  color: var(--brand-light);
  flex-shrink: 0;
  margin-top: 1px;
}

.cap-item strong { display: block; color: var(--text-primary); font-size: 12px; }

/* ── Order card ── */
.order-card {
  margin-top: 12px;
  border: 1px solid var(--border-md);
  border-radius: var(--radius-md);
  overflow: hidden;
  background: var(--bg-app);
}

.order-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: rgba(15,110,86,0.15);
  border-bottom: 1px solid var(--brand-border);
  padding: 9px 14px;
  font-family: var(--mono);
  font-size: 11.5px;
  font-weight: 600;
  color: var(--brand-light);
  letter-spacing: 0.3px;
}

.order-card-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0;
}

.order-field {
  padding: 10px 14px;
  border-right: 1px solid var(--border);
  border-bottom: 1px solid var(--border);
}

.order-field:nth-child(3n) { border-right: none; }
.order-field:nth-last-child(-n+3) { border-bottom: none; }

.field-key {
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.6px;
  color: var(--text-muted);
  margin-bottom: 3px;
  font-weight: 600;
}

.field-val {
  font-size: 13px;
  color: var(--text-primary);
  font-weight: 500;
}

/* ── Quality log card ── */
.quality-card {
  margin-top: 12px;
  border: 1px solid var(--border-md);
  border-radius: var(--radius-md);
  overflow: hidden;
  background: var(--bg-app);
}

.quality-header {
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--green-dim);
  border-bottom: 1px solid var(--green-bd);
  padding: 9px 14px;
  font-family: var(--mono);
  font-size: 11px;
  font-weight: 600;
  color: var(--green);
}

.quality-entry {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  padding: 10px 14px;
  border-bottom: 1px solid var(--border);
}

.quality-entry:last-child { border-bottom: none; }

.q-time {
  font-family: var(--mono);
  font-size: 10.5px;
  color: var(--text-muted);
  flex-shrink: 0;
  padding-top: 1px;
  min-width: 62px;
}

.q-note {
  font-size: 13px;
  color: var(--text-secondary);
  line-height: 1.5;
}

/* ── Typing indicator ── */
.typing-indicator {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 2px;
}

.typing-indicator span {
  width: 5px; height: 5px;
  border-radius: 50%;
  background: var(--brand-light);
  animation: typeBounce 1.1s ease-in-out infinite;
  opacity: 0.6;
}

.typing-indicator span:nth-child(2) { animation-delay: 0.18s; }
.typing-indicator span:nth-child(3) { animation-delay: 0.36s; }

@keyframes typeBounce {
  0%, 80%, 100% { transform: translateY(0); opacity: 0.6; }
  40%           { transform: translateY(-5px); opacity: 1; }
}

/* ══ CHAT FOOTER ═════════════════════════════════════════════════ */
.chat-footer {
  padding: 14px 28px 18px;
  background: var(--bg-panel);
  border-top: 1px solid var(--border);
  flex-shrink: 0;
}

.input-container {
  display: flex;
  align-items: flex-end;
  gap: 8px;
  background: var(--bg-input);
  border: 1px solid var(--border-md);
  border-radius: var(--radius-lg);
  padding: 8px 8px 8px 16px;
  transition: border-color var(--ease), box-shadow var(--ease);
}

.input-container:focus-within {
  border-color: var(--brand-border);
  box-shadow: 0 0 0 3px rgba(29,158,117,0.07);
}

.chat-textarea {
  flex: 1;
  background: none;
  border: none;
  outline: none;
  resize: none;
  color: var(--text-primary);
  font-family: var(--font);
  font-size: 13.5px;
  line-height: 1.55;
  max-height: 120px;
  scrollbar-width: none;
}

.chat-textarea::placeholder { color: var(--text-muted); }

.send-btn {
  width: 34px; height: 34px;
  border-radius: var(--radius-sm);
  background: var(--brand);
  border: none;
  cursor: pointer;
  color: white;
  font-size: 15px;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
  transition: all var(--ease);
}

.send-btn:hover { background: var(--brand-light); }
.send-btn:active { transform: scale(0.94); }

.send-btn:disabled {
  background: var(--bg-card);
  color: var(--text-muted);
  cursor: not-allowed;
}

.input-hint {
  display: flex;
  align-items: center;
  gap: 5px;
  margin-top: 7px;
  font-size: 11px;
  color: var(--text-muted);
  padding-left: 2px;
}

.input-hint i { font-size: 12px; }

kbd {
  display: inline-flex;
  align-items: center;
  padding: 1px 5px;
  background: rgba(255,255,255,0.06);
  border: 1px solid var(--border-md);
  border-radius: 4px;
  font-family: var(--mono);
  font-size: 10px;
  color: var(--text-secondary);
}

/* ══ DASHBOARD BODY ══════════════════════════════════════════════ */
.dashboard-body {
  flex: 1;
  overflow-y: auto;
  padding: 24px 28px 32px;
  background: var(--bg-app);
}

/* Stats grid */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  margin-bottom: 24px;
}

.stat-tile {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 16px 18px;
  display: flex;
  align-items: center;
  gap: 14px;
  transition: border-color var(--ease), transform var(--ease);
}

.stat-tile:hover { border-color: var(--border-md); transform: translateY(-1px); }

.stat-icon {
  width: 40px; height: 40px;
  border-radius: var(--radius-md);
  display: flex; align-items: center; justify-content: center;
  font-size: 18px;
  flex-shrink: 0;
}

.stat-icon.neutral { background: rgba(255,255,255,0.04); color: var(--text-secondary); border: 1px solid var(--border); }
.stat-icon.green   { background: var(--green-dim);  color: var(--green);  border: 1px solid var(--green-bd); }
.stat-icon.blue    { background: var(--blue-dim);   color: var(--blue);   border: 1px solid var(--blue-bd); }
.stat-icon.amber   { background: var(--amber-dim);  color: var(--amber);  border: 1px solid var(--amber-bd); }

.stat-body { display: flex; flex-direction: column; gap: 2px; }

.stat-value {
  font-size: 26px;
  font-weight: 600;
  font-family: var(--mono);
  color: var(--text-primary);
  line-height: 1.1;
}

.stat-value.green  { color: var(--green); }
.stat-value.blue   { color: var(--blue); }
.stat-value.amber  { color: var(--amber); }

.stat-label {
  font-size: 11.5px;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-weight: 500;
}

/* Table section */
.table-section {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  overflow: hidden;
}

.table-header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 20px;
  border-bottom: 1px solid var(--border);
  background: var(--bg-panel);
  gap: 16px;
}

.table-heading {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 4px;
  background: var(--bg-input);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  padding: 3px;
}

.filter-btn {
  padding: 4px 12px;
  border: none;
  background: none;
  border-radius: 6px;
  color: var(--text-muted);
  font-family: var(--font);
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all var(--ease);
  white-space: nowrap;
}

.filter-btn:hover { color: var(--text-secondary); }

.filter-btn.active {
  background: var(--bg-raised);
  color: var(--text-primary);
  border: 1px solid var(--border-md);
}

.table-wrap { overflow-x: auto; }

.orders-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.orders-table thead {
  background: rgba(255,255,255,0.02);
  border-bottom: 1px solid var(--border);
}

.orders-table th {
  padding: 10px 16px;
  text-align: left;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--text-muted);
  white-space: nowrap;
}

.orders-table tbody tr {
  border-bottom: 1px solid var(--border);
  transition: background var(--ease);
}

.orders-table tbody tr:last-child { border-bottom: none; }
.orders-table tbody tr:hover { background: var(--bg-hover); }

.orders-table td {
  padding: 12px 16px;
  color: var(--text-secondary);
  vertical-align: middle;
}

.orders-table td.order-id-cell {
  font-family: var(--mono);
  font-size: 12px;
  font-weight: 600;
  color: var(--brand-light);
}

.orders-table td.part-name-cell {
  color: var(--text-primary);
  font-weight: 500;
}

.orders-table td.quality-cell {
  max-width: 220px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 12.5px;
}

.table-empty {
  text-align: center;
  padding: 40px !important;
  color: var(--text-muted);
  font-size: 13px;
}

.table-empty i { font-size: 16px; margin-right: 6px; }

/* Status badges */
.badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 3px 9px;
  border-radius: 20px;
  font-size: 11.5px;
  font-weight: 600;
  white-space: nowrap;
}

.badge .badge-dot {
  width: 5px; height: 5px;
  border-radius: 50%;
}

.badge-received {
  background: var(--amber-dim);
  color: var(--amber);
  border: 1px solid var(--amber-bd);
}
.badge-received .badge-dot { background: var(--amber); }

.badge-review {
  background: var(--blue-dim);
  color: var(--blue);
  border: 1px solid var(--blue-bd);
}
.badge-review .badge-dot { background: var(--blue); }

.badge-accepted {
  background: var(--green-dim);
  color: var(--green);
  border: 1px solid var(--green-bd);
}
.badge-accepted .badge-dot { background: var(--green); }