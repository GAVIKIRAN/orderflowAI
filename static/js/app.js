// ═══════════════════════════════════════════════════════
// STATE
// ═══════════════════════════════════════════════════════

let allOrders    = [];
let allInventory = [];

// ═══════════════════════════════════════════════════════
// CHAT
// ═══════════════════════════════════════════════════════

async function sendMessage() {
    const input   = document.getElementById("chatInput");
    const message = input.value.trim();
    if (!message) return;

    addMessage(message, "user");
    input.value = "";
    input.style.height = "auto";

    const typingId = addTyping();

    try {
        const response = await fetch("/api/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message }),
        });
        const data = await response.json();
        removeTyping(typingId);

        // ── FIX: Handle HTTP errors (e.g. 400 insufficient stock) ──
        if (!response.ok) {
            addMessage(data.message || "An error occurred.", "ai");
            // If it's an insufficient stock error, show a styled warning card
            if (data.insufficient_stock) {
                renderStockWarning(data);
            }
            return;
        }

        if (data.inventory && Array.isArray(data.inventory)) {
            renderInventoryPicker(data.message, data.inventory);
        } else if (data.orders) {
            renderOrderList(data.orders);
        } else if (data.order) {
            renderOrderCard(data.order);
            loadDashboard();
            if (document.getElementById("view-inventory")?.classList.contains("active")) {
                loadInventoryView();
            }
        } else if (data.inventory_item || data.item) {
            renderInventoryCard(data.inventory_item || data.item);
        } else {
            addMessage(data.message || JSON.stringify(data), "ai");
            if (data.message && (
                data.message.includes("Consumed") ||
                data.message.includes("Stock") ||
                data.message.includes("Reorder") ||
                data.message.includes("status set")
            )) {
                loadDashboard();
                if (document.getElementById("view-inventory")?.classList.contains("active")) {
                    loadInventoryView();
                }
            }
        }
    } catch (err) {
        removeTyping(typingId);
        addMessage("⚠️ Error: " + err.message, "ai");
    }
}

// ── FIX: Styled insufficient-stock warning card in chat ──
function renderStockWarning(data) {
    const container = document.getElementById("chatMessages");
    const div = document.createElement("div");
    div.className = "msg-row ai";
    div.innerHTML = `
        <div class="msg-content">
            <div class="msg-bubble stock-warning-card">
                <div class="stock-warning-header">
                    <span class="stock-warning-icon">⚠️</span>
                    <strong>Insufficient Stock</strong>
                </div>
                <div class="stock-warning-body">
                    <div class="stock-warning-row">
                        <span class="stock-label">Part</span>
                        <span class="stock-val">${data.part_name || "—"}</span>
                    </div>
                    <div class="stock-warning-row">
                        <span class="stock-label">Requested</span>
                        <span class="stock-val qty-low">${data.requested} ${data.unit || "pcs"}</span>
                    </div>
                    <div class="stock-warning-row">
                        <span class="stock-label">Available</span>
                        <span class="stock-val qty-ok">${data.available} ${data.unit || "pcs"}</span>
                    </div>
                </div>
                <div class="stock-warning-hint">
                    Try ordering ${data.available} or fewer units, or wait for a restock.
                </div>
            </div>
        </div>`;
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
}

function addMessage(text, sender) {
    const container = document.getElementById("chatMessages");
    const div = document.createElement("div");
    div.className = `msg-row ${sender}`;
    div.innerHTML = `
        <div class="msg-content">
            <div class="msg-bubble">${text.replace(/\n/g, "<br>")}</div>
        </div>`;
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
}

function addTyping() {
    const id        = "typing-" + Date.now();
    const container = document.getElementById("chatMessages");
    container.innerHTML += `
        <div class="msg-row ai" id="${id}">
            <div class="msg-content">
                <div class="msg-bubble">
                    <div class="typing-indicator"><span></span><span></span><span></span></div>
                </div>
            </div>
        </div>`;
    container.scrollTop = container.scrollHeight;
    return id;
}

function removeTyping(id) {
    const el = document.getElementById(id);
    if (el) el.remove();
}

// Inventory picker (shown when ordered item isn't found)
function renderInventoryPicker(msg, items) {
    const container = document.getElementById("chatMessages");

    if (!items.length) {
        const div = document.createElement("div");
        div.className = "msg-row ai";
        div.innerHTML = `
            <div class="msg-content">
                <div class="msg-bubble">
                    <p>${msg}</p>
                    <p style="color:var(--amber);margin-top:8px">
                        ⚠️ Your inventory is empty. 
                        <a href="#" onclick="showView('inventory');return false;" style="color:var(--brand-light)">
                            Go to Inventory tab
                        </a> to add items first.
                    </p>
                </div>
            </div>`;
        container.appendChild(div);
        container.scrollTop = container.scrollHeight;
        return;
    }

    const rows = items.map(it => {
        const isLow = it.quantity <= (it.reorder_at || 0);
        return `
        <tr class="inv-pick-row" onclick="injectCmd('Order ${it.quantity > 0 ? Math.min(50, it.quantity) : 1} ${it.part_name}')">
            <td class="inv-pick-id">#${it.id}</td>
            <td class="inv-pick-name">${it.part_name}</td>
            <td>${it.material || "—"}</td>
            <td class="inv-pick-qty ${isLow ? "low" : ""}">${it.quantity} ${it.unit}${isLow ? " ⚠" : ""}</td>
        </tr>`;
    }).join("");

    const div = document.createElement("div");
    div.className = "msg-row ai";
    div.innerHTML = `
        <div class="msg-content" style="max-width:90%">
            <div class="msg-bubble">
                <p>${msg}</p>
                <div class="inv-picker-wrap">
                    <div class="inv-picker-label"><i class="ti ti-package"></i> Available Inventory — click a row to order</div>
                    <table class="inv-picker-table">
                        <thead><tr>
                            <th>ID</th><th>Part</th><th>Material</th><th>Stock</th>
                        </tr></thead>
                        <tbody>${rows}</tbody>
                    </table>
                </div>
            </div>
        </div>`;
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
}

function renderOrderList(orders) {
    if (!orders.length) { addMessage("No orders found.", "ai"); return; }
    const rows = orders.map(o => `
        <tr>
            <td class="order-id-cell">#${o.id}</td>
            <td>${o.part_name || "—"}</td>
            <td>${o.quantity ?? "—"}</td>
            <td>${o.deadline || "—"}</td>
            <td>${statusBadge(o.status)}</td>
        </tr>`).join("");

    const container = document.getElementById("chatMessages");
    const div = document.createElement("div");
    div.className = "msg-row ai";
    div.innerHTML = `
        <div class="msg-content" style="max-width:90%">
            <div class="msg-bubble">
                <div class="inline-table-wrap">
                    <table class="inline-table">
                        <thead><tr><th>ID</th><th>Part</th><th>Qty</th><th>Deadline</th><th>Status</th></tr></thead>
                        <tbody>${rows}</tbody>
                    </table>
                </div>
            </div>
        </div>`;
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
}

function renderOrderCard(o) {
    const stockNote = (o.new_stock !== undefined)
        ? `<div class="order-field"><div class="field-key">Stock Remaining</div><div class="field-val ${o.new_stock <= 10 ? 'qty-low' : 'qty-ok'}">${o.new_stock}</div></div>`
        : "";

    addMessage(`
        <div class="order-card">
            <div class="order-card-header">
                <span>Order #${o.id}</span>
                ${statusBadge(o.status)}
            </div>
            <div class="order-card-grid">
                <div class="order-field"><div class="field-key">Part</div><div class="field-val">${o.part_name || "—"}</div></div>
                <div class="order-field"><div class="field-key">Material</div><div class="field-val">${o.material || "—"}</div></div>
                <div class="order-field"><div class="field-key">Quantity Ordered</div><div class="field-val">${o.quantity ?? "—"}</div></div>
                <div class="order-field"><div class="field-key">Deadline</div><div class="field-val">${o.deadline || "—"}</div></div>
                <div class="order-field"><div class="field-key">Status</div><div class="field-val">${statusBadge(o.status)}</div></div>
                ${stockNote}
            </div>
        </div>`, "ai");
}

function renderInventoryCard(item) {
    const pct     = item.reorder_at ? Math.round((item.quantity / (item.reorder_at * 10)) * 100) : 0;
    const lowFlag = item.quantity <= item.reorder_at;
    addMessage(`
        <div class="order-card">
            <div class="order-card-header">
                <span><i class="ti ti-package"></i> Inventory #${item.id} — ${item.part_name}</span>
                ${lowFlag ? '<span class="badge badge-received">⚠ Low Stock</span>' : '<span class="badge badge-accepted">● In Stock</span>'}
            </div>
            <div class="order-card-grid">
                <div class="order-field"><div class="field-key">Material</div><div class="field-val">${item.material || "—"}</div></div>
                <div class="order-field"><div class="field-key">Quantity</div><div class="field-val">${item.quantity} ${item.unit}</div></div>
                <div class="order-field"><div class="field-key">Reorder At</div><div class="field-val">${item.reorder_at} ${item.unit}</div></div>
                <div class="order-field" style="grid-column:span 3">
                    <div class="field-key">Stock Level</div>
                    <div class="stock-bar-wrap"><div class="stock-bar" style="width:${Math.min(100,pct)}%;background:${lowFlag?'var(--amber)':'var(--green)'}"></div></div>
                </div>
            </div>
        </div>`, "ai");
}

function handleKey(event) {
    if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        sendMessage();
    }
}

function autoResize(el) {
    el.style.height = "auto";
    el.style.height = el.scrollHeight + "px";
}

function injectCmd(text) {
    showView("chat");
    const input = document.getElementById("chatInput");
    input.value = text;
    input.focus();
}

// ═══════════════════════════════════════════════════════
// ADD INVENTORY ITEM
// ═══════════════════════════════════════════════════════

async function addInventoryItem() {
    const part_name = document.getElementById("inv-part-name").value.trim();
    const resultEl  = document.getElementById("addInventoryResult");

    if (!part_name) {
        resultEl.style.color = "var(--red)";
        resultEl.textContent = "❌ Part name is required";
        return;
    }

    const payload = {
        part_name,
        material:   document.getElementById("inv-material").value.trim(),
        unit:       document.getElementById("inv-unit").value.trim() || "pcs",
        quantity:   parseInt(document.getElementById("inv-qty").value) || 0,
        reorder_at: parseInt(document.getElementById("inv-reorder").value) || 10,
        barcode:    document.getElementById("inv-barcode").value.trim() || null,
        rfid_tag:   document.getElementById("inv-rfid").value.trim() || null,
    };

    try {
        const res  = await fetch("/api/inventory", {
            method:  "POST",
            headers: { "Content-Type": "application/json" },
            body:    JSON.stringify(payload),
        });
        const data = await res.json();

        resultEl.style.color = res.ok ? "var(--green)" : "var(--red)";
        resultEl.textContent = data.message;

        if (res.ok) {
            clearAddForm();
            loadInventoryView();
            loadDashboard();
        }
    } catch (err) {
        resultEl.style.color = "var(--red)";
        resultEl.textContent = "Error: " + err.message;
    }
}

function clearAddForm() {
    ["inv-part-name", "inv-material", "inv-barcode", "inv-rfid"].forEach(
        id => { document.getElementById(id).value = ""; }
    );
    document.getElementById("inv-qty").value     = "0";
    document.getElementById("inv-reorder").value = "10";
    document.getElementById("inv-unit").value    = "pcs";
    document.getElementById("addInventoryResult").textContent = "";
}

// ═══════════════════════════════════════════════════════
// DELETE INVENTORY ITEM
// ═══════════════════════════════════════════════════════

async function deleteInventoryItem(id, name) {
    if (!confirm(`Delete "${name}" from inventory?\nThis will fail if orders reference this item.`)) return;

    try {
        const res  = await fetch(`/api/inventory/${id}`, { method: "DELETE" });
        const data = await res.json();
        alert(data.message);
        if (res.ok) {
            loadInventoryView();
            loadDashboard();
        }
    } catch (err) {
        alert("Error: " + err.message);
    }
}

// ═══════════════════════════════════════════════════════
// VIEW SWITCHING
// ═══════════════════════════════════════════════════════

function showView(view) {
    document.querySelectorAll(".view").forEach(v => v.classList.remove("active"));
    document.querySelectorAll(".nav-item").forEach(b => b.classList.remove("active"));

    const target = document.getElementById("view-" + view);
    if (target) target.classList.add("active");

    const navBtn = document.querySelector(`.nav-item[data-view="${view}"]`);
    if (navBtn) navBtn.classList.add("active");

    if (view === "dashboard") loadDashboard();
    if (view === "inventory") loadInventoryView();
}

// ═══════════════════════════════════════════════════════
// DASHBOARD
// ═══════════════════════════════════════════════════════

async function loadDashboard() {
    try {
        const [ordRes, invRes] = await Promise.all([
            fetch("/api/orders"),
            fetch("/api/inventory"),
        ]);
        allOrders    = await ordRes.json();
        allInventory = await invRes.json();

        document.getElementById("statTotal").innerText    = allOrders.length;
        document.getElementById("statReceived").innerText = allOrders.filter(o => o.status === "Received").length;
        document.getElementById("statReview").innerText   = allOrders.filter(o => o.status === "In Review").length;
        document.getElementById("statAccepted").innerText = allOrders.filter(o => o.status === "Accepted").length;

        const el = document.getElementById("statLowStock");
        if (el) el.innerText = allInventory.filter(i => i.quantity <= i.reorder_at).length;

        renderOrders(allOrders);
        renderInventorySummary(allInventory);
    } catch (err) {
        console.error("Dashboard error:", err);
    }
}

// ═══════════════════════════════════════════════════════
// INVENTORY VIEW
// ═══════════════════════════════════════════════════════

async function loadInventoryView() {
    try {
        const res    = await fetch("/api/inventory");
        allInventory = await res.json();
        renderInventoryTable(allInventory);
    } catch (err) {
        console.error("Inventory error:", err);
    }
}

function renderInventorySummary(items) {
    const tbody = document.getElementById("inventorySummaryBody");
    if (!tbody) return;

    if (!items.length) {
        tbody.innerHTML = `<tr><td colspan="7" class="table-empty">No inventory items yet — go to Inventory tab to add some.</td></tr>`;
        return;
    }

    tbody.innerHTML = items.map(item => {
        const low = item.quantity <= item.reorder_at;
        return `
        <tr>
            <td class="order-id-cell">#${item.id}</td>
            <td class="part-name-cell">${item.part_name}</td>
            <td>${item.material || "—"}</td>
            <td class="${low ? "qty-low" : "qty-ok"}">${item.quantity} ${item.unit}</td>
            <td>${item.reorder_at}</td>
            <td>${low ? stockBadge("low") : stockBadge("ok")}</td>
            <td>
                <button class="table-action-btn ${item.quantity === 0 ? 'btn-disabled' : ''}"
                    onclick="quickOrder(${item.id}, '${item.part_name.replace(/'/g,"\\'")}', ${item.quantity})"
                    ${item.quantity === 0 ? 'disabled title="No stock available"' : ''}>
                    <i class="ti ti-plus"></i> Order
                </button>
            </td>
        </tr>`;
    }).join("");
}

function renderInventoryTable(items) {
    const tbody = document.getElementById("inventoryTableBody");
    if (!tbody) return;

    if (!items.length) {
        tbody.innerHTML = `<tr><td colspan="10" class="table-empty">No inventory items yet. Use the form above to add your first item.</td></tr>`;
        return;
    }

    tbody.innerHTML = items.map(item => {
        const low = item.quantity <= item.reorder_at;
        const pct = item.reorder_at
            ? Math.min(100, Math.round((item.quantity / (item.reorder_at * 8)) * 100))
            : 50;
        return `
        <tr>
            <td class="order-id-cell">#${item.id}</td>
            <td class="part-name-cell">${item.part_name}</td>
            <td>${item.material || "—"}</td>
            <td>${item.unit}</td>
            <td class="${low ? "qty-low" : "qty-ok"}">${item.quantity}</td>
            <td>${item.reorder_at}</td>
            <td>
                <div class="mini-bar-wrap">
                    <div class="mini-bar" style="width:${pct}%;background:${low ? 'var(--amber)' : 'var(--green)'}"></div>
                </div>
            </td>
            <td>${low ? stockBadge("low") : stockBadge("ok")}</td>
            <td>
                <button class="table-action-btn ${item.quantity === 0 ? 'btn-disabled' : ''}"
                    onclick="quickOrder(${item.id}, '${item.part_name.replace(/'/g,"\\'")}', ${item.quantity})"
                    ${item.quantity === 0 ? 'disabled title="No stock available"' : ''}>
                    <i class="ti ti-plus"></i> Order
                </button>
            </td>
            <td>
                <button class="table-action-btn delete-btn" onclick="deleteInventoryItem(${item.id}, '${item.part_name.replace(/'/g,"\\'")}')">
                    <i class="ti ti-trash"></i>
                </button>
            </td>
        </tr>`;
    }).join("");
}

function stockBadge(type) {
    if (type === "low") return `<span class="badge badge-received"><span class="badge-dot"></span>Low Stock</span>`;
    return `<span class="badge badge-accepted"><span class="badge-dot"></span>In Stock</span>`;
}

// ── FIX: quickOrder now accepts availableStock and validates before submitting ──
async function quickOrder(inventoryId, partName, availableStock) {
    // Guard: zero stock
    if (availableStock === 0) {
        alert(`❌ "${partName}" is out of stock. No orders can be placed until restocked.`);
        return;
    }

    const qty = prompt(
        `How many "${partName}" to order?\n(Available stock: ${availableStock})`,
        Math.min(50, availableStock)
    );
    if (!qty || isNaN(parseInt(qty))) return;

    const qtyNum = parseInt(qty);

    // ── FIX: Client-side guard before even hitting the server ──
    if (qtyNum <= 0) {
        alert("❌ Order quantity must be greater than 0.");
        return;
    }
    if (qtyNum > availableStock) {
        alert(
            `❌ Insufficient stock for "${partName}".\n` +
            `Requested: ${qtyNum} | Available: ${availableStock}\n\n` +
            `Please enter a quantity of ${availableStock} or less.`
        );
        return;
    }

    try {
        const res  = await fetch("/api/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message: `Order ${qtyNum} of inventory item #${inventoryId} ${partName}` }),
        });
        const data = await res.json();

        // ── FIX: Handle server-side insufficient stock too ──
        if (!res.ok || data.insufficient_stock) {
            alert(data.message || "❌ Insufficient stock. Order not placed.");
            return;
        }

        alert(data.message || "✅ Order placed!");
        loadDashboard();
        loadInventoryView();
    } catch (err) {
        alert("Error: " + err.message);
    }
}

// ═══════════════════════════════════════════════════════
// ORDERS TABLE
// ═══════════════════════════════════════════════════════

function renderOrders(orders) {
    const tbody = document.getElementById("ordersTableBody");
    if (!tbody) return;
    if (!orders.length) {
        tbody.innerHTML = `<tr><td colspan="7" class="table-empty">No orders yet.</td></tr>`;
        return;
    }
    tbody.innerHTML = orders.map(o => `
        <tr data-status="${o.status}">
            <td class="order-id-cell">#${o.id}</td>
            <td class="part-name-cell">${o.part_name || "—"}</td>
            <td>${o.material || "—"}</td>
            <td>${o.quantity ?? "—"}</td>
            <td>${o.deadline || "—"}</td>
            <td>${statusBadge(o.status)}</td>
            <td>
                <div class="status-btn-group">
                    <button class="status-step-btn ${o.status === 'Received'  ? 'active' : ''}" onclick="setOrderStatus(${o.id}, 'Received',  this)">Received</button>
                    <button class="status-step-btn ${o.status === 'In Review' ? 'active' : ''}" onclick="setOrderStatus(${o.id}, 'In Review', this)">In Review</button>
                    <button class="status-step-btn ${o.status === 'Accepted'  ? 'active' : ''}" onclick="setOrderStatus(${o.id}, 'Accepted',  this)">Accepted</button>
                </div>
            </td>
        </tr>`).join("");
}

async function setOrderStatus(orderId, status, btn) {
    try {
        const res  = await fetch(`/api/orders/${orderId}/status`, {
            method:  "PATCH",
            headers: { "Content-Type": "application/json" },
            body:    JSON.stringify({ status }),
        });
        const data = await res.json();
        if (res.ok) {
            loadDashboard();
        } else {
            alert(data.message);
        }
    } catch (err) {
        alert("Error: " + err.message);
    }
}

function statusBadge(status) {
    const map = { Received: "badge-received", "In Review": "badge-review", Accepted: "badge-accepted" };
    return `<span class="badge ${map[status] || "badge-received"}"><span class="badge-dot"></span>${status}</span>`;
}

function filterTable(status, btn) {
    document.querySelectorAll(".filter-btn").forEach(b => b.classList.remove("active"));
    if (btn) btn.classList.add("active");
    document.querySelectorAll("#ordersTableBody tr").forEach(row => {
        row.style.display = (status === "all" || row.dataset.status === status) ? "" : "none";
    });
}

// ═══════════════════════════════════════════════════════
// AUDIO
// ═══════════════════════════════════════════════════════

function playBeep(type) {
    try {
        const ctx  = new (window.AudioContext || window.webkitAudioContext)();
        const osc  = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        if (type === "success") {
            osc.type = "sine";
            osc.frequency.setValueAtTime(880, ctx.currentTime);
            osc.frequency.setValueAtTime(1320, ctx.currentTime + 0.1);
            gain.gain.setValueAtTime(0.35, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
            osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.35);
        } else {
            osc.type = "sawtooth";
            osc.frequency.setValueAtTime(220, ctx.currentTime);
            gain.gain.setValueAtTime(0.25, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
            osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.4);
        }
    } catch {}
}

// ═══════════════════════════════════════════════════════
// USB RFID SCANNER ENGINE
// ═══════════════════════════════════════════════════════

const RFID = (() => {
    const SCAN_GAP   = 80;
    const MIN_LENGTH = 4;
    let buffer = "", lastTime = 0, timer = null, enabled = true;

    function reset() { buffer = ""; if (timer) { clearTimeout(timer); timer = null; } }
    function flush() { const tag = buffer.trim(); reset(); if (tag.length >= MIN_LENGTH) handleRFIDScan(tag); }

    document.addEventListener("keydown", (e) => {
        if (!enabled) return;
        const active   = document.activeElement;
        const isTyping = active && (
            active.tagName === "TEXTAREA" ||
            (active.tagName === "INPUT" && active.id !== "rfidInput")
        );
        if (isTyping) return;

        const now = Date.now();
        if (now - lastTime > SCAN_GAP && buffer.length > 0) reset();
        lastTime = now;

        if (e.key === "Enter") { if (buffer.length >= MIN_LENGTH) flush(); return; }
        if (e.key.length === 1) {
            buffer += e.key;
            if (timer) clearTimeout(timer);
            timer = setTimeout(flush, SCAN_GAP + 20);
        }
    });

    return {
        enable()    { enabled = true;  updateRFIDStatus("listening"); },
        disable()   { enabled = false; updateRFIDStatus("paused");    },
        toggle()    { enabled ? RFID.disable() : RFID.enable();       },
        isEnabled() { return enabled;                                  },
    };
})();

// ═══════════════════════════════════════════════════════
// RFID SCAN → consume inventory + maybe trigger reorder
// ═══════════════════════════════════════════════════════

async function handleRFIDScan(tag) {
    setRFIDScanning(true);
    updateRFIDLastTag(tag);

    const rfidInput = document.getElementById("rfidInput");
    if (rfidInput) rfidInput.value = tag;

    try {
        const res  = await fetch(`/api/rfid/${encodeURIComponent(tag)}/scan`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ qty: 1 }),
        });
        const data = await res.json();

        // ── FIX: Handle insufficient stock from RFID scan ──
        if (!res.ok) {
            playBeep("error");
            const reason = data.insufficient_stock
                ? `Insufficient stock (${data.available} available)`
                : (data.message || "Tag not found");
            showRFIDResult(null, tag, null, reason);
            addRFIDLog(tag, null, reason);
            setRFIDScanning(false);
            return;
        }

        if (data.message?.includes("not found")) {
            playBeep("error");
            showRFIDResult(null, tag, null, "Tag not found");
            addRFIDLog(tag, null, "Tag not found");
            setRFIDScanning(false);
            return;
        }

        playBeep("success");
        showRFIDResult(data.item, tag, data);
        addRFIDLog(tag, data.item, data.message);

        if (data.reorder?.triggered) showReorderAlert(data.item, data.reorder);

        if (document.getElementById("view-dashboard")?.classList.contains("active")) loadDashboard();
        if (document.getElementById("view-inventory")?.classList.contains("active"))  loadInventoryView();

    } catch (err) {
        playBeep("error");
        showRFIDResult(null, tag, null, "Error: " + err.message);
        addRFIDLog(tag, null, "Error: " + err.message);
    }

    setRFIDScanning(false);
}

function showReorderAlert(item, reorder) {
    const log = document.getElementById("rfidEventLog");
    if (!log) return;
    const div = document.createElement("div");
    div.className = "rfid-reorder-alert";
    div.innerHTML = `
        <i class="ti ti-alert-triangle"></i>
        <strong>Auto-Reorder Triggered!</strong>
        ${item.part_name} — ${reorder.reorder_qty} units ordered (stock: ${reorder.current_stock})`;
    log.prepend(div);
}

async function lookupRFID() {
    const tag = document.getElementById("rfidInput").value.trim();
    if (!tag) { alert("Please scan or enter an RFID tag"); return; }
    await handleRFIDScan(tag);
}

function updateRFIDStatus(state) {
    const dot  = document.getElementById("rfidStatusDot");
    const text = document.getElementById("rfidStatusText");
    const btn  = document.getElementById("rfidToggleBtn");
    if (!dot || !text) return;
    const states = {
        listening: { cls: "rfid-dot--active",  label: "Listening for RFID tag…", btn: "⏸ Pause"  },
        scanning:  { cls: "rfid-dot--scanning", label: "Reading tag…",            btn: null        },
        paused:    { cls: "rfid-dot--paused",   label: "Scanner paused",          btn: "▶ Resume"  },
    };
    const s = states[state] || states.paused;
    dot.className = `rfid-dot ${s.cls}`;
    text.textContent = s.label;
    if (btn && s.btn) btn.textContent = s.btn;
}

function setRFIDScanning(active) {
    const panel = document.getElementById("rfidScanPanel");
    if (panel) panel.classList.toggle("rfid-panel--scanning", active);
    updateRFIDStatus(active ? "scanning" : (RFID.isEnabled() ? "listening" : "paused"));
}

function updateRFIDLastTag(tag) {
    const el = document.getElementById("rfidLastTag");
    if (el) el.textContent = tag;
}

// ── FIX: showRFIDResult accepts optional errorReason for better messaging ──
function showRFIDResult(item, tag, data, errorReason) {
    const result = document.getElementById("rfidScanResult");
    if (!result) return;

    if (!item) {
        result.className = "rfid-result rfid-result--error";
        result.innerHTML = `
            <div class="rfid-result__icon">✗</div>
            <div class="rfid-result__body">
                <div class="rfid-result__title">${errorReason || "Tag not found"}</div>
                <div class="rfid-result__sub">${tag}</div>
            </div>`;
        return;
    }

    const low = item.quantity <= item.reorder_at;
    result.className = `rfid-result ${low ? "rfid-result--warning" : "rfid-result--success"}`;
    result.innerHTML = `
        <div class="rfid-result__icon">${low ? "⚠" : "✓"}</div>
        <div class="rfid-result__body">
            <div class="rfid-result__title">${item.part_name}</div>
            <div class="rfid-result__sub">
                ${item.material || "—"} · Consumed 1 · Stock now: <strong>${item.quantity} ${item.unit}</strong>
            </div>
            <div class="rfid-result__status">
                ${low ? stockBadge("low") : stockBadge("ok")}
                ${data?.reorder?.triggered
                    ? `<span class="badge badge-review" style="margin-left:6px"><span class="badge-dot"></span>Auto-Reorder Triggered</span>`
                    : ""}
            </div>
        </div>`;
}

function addRFIDLog(tag, item, note) {
    const log = document.getElementById("rfidEventLog");
    if (!log) return;
    const empty = log.querySelector(".rfid-log-empty");
    if (empty) empty.remove();

    const time  = new Date().toLocaleTimeString();
    const entry = document.createElement("div");
    entry.className = "rfid-log-entry";
    entry.innerHTML = `
        <span class="rfid-log__time">${time}</span>
        <span class="rfid-log__tag">${tag}</span>
        <span class="rfid-log__note">${item ? item.part_name + " · " + note : note}</span>`;
    log.prepend(entry);
    while (log.children.length > 30) log.removeChild(log.lastChild);
}

function toggleRFIDScanner() { RFID.toggle(); }

function clearRFIDLog() {
    const log = document.getElementById("rfidEventLog");
    if (log) log.innerHTML = `<div class="rfid-log-empty">Log cleared — waiting for tags…</div>`;
}

// ═══════════════════════════════════════════════════════
// BARCODE
// ═══════════════════════════════════════════════════════

async function lookupBarcode() {
    const code = document.getElementById("barcodeInput").value.trim();
    if (!code) { alert("Please scan or enter a barcode"); return; }

    try {
        const res  = await fetch(`/api/barcode/${encodeURIComponent(code)}/scan`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ qty: 1 }),
        });
        const data = await res.json();

        // ── FIX: Handle insufficient stock from barcode scan ──
        if (!res.ok) {
            document.getElementById("scanResult").innerHTML = `
                <div class="scan-card scan-card--low">
                    <h3>❌ ${data.insufficient_stock ? "Insufficient Stock" : "Error"}</h3>
                    <p>${data.message}</p>
                    ${data.insufficient_stock ? `<p><strong>Available:</strong> ${data.available} | <strong>Requested:</strong> ${data.requested}</p>` : ""}
                </div>`;
            return;
        }

        showScanResult(data.item || data, data);
        loadDashboard();
        if (document.getElementById("view-inventory")?.classList.contains("active")) {
            loadInventoryView();
        }
    } catch (err) {
        document.getElementById("scanResult").innerHTML =
            `<div class="scan-card"><p>Error: ${err.message}</p></div>`;
    }
}

let qrScanner = null;

function startBarcodeCamera() {
    const reader = document.getElementById("reader");
    reader.style.display = "block";
    if (qrScanner) qrScanner.stop().catch(() => {});
    qrScanner = new Html5Qrcode("reader");
    qrScanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: 250 },
        (decodedText) => {
            document.getElementById("barcodeInput").value = decodedText;
            lookupBarcode();
            qrScanner.stop().then(() => { reader.style.display = "none"; });
        }
    ).catch(err => {
        reader.style.display = "none";
        alert("Could not access camera: " + err);
    });
}

function showScanResult(item, data) {
    const result = document.getElementById("scanResult");
    if (!item || item.message) {
        result.innerHTML = `
            <div class="scan-card">
                <h3>Not Found</h3>
                <p>${item ? item.message : "Unknown error"}</p>
            </div>`;
        return;
    }
    const low = item.quantity <= item.reorder_at;
    result.innerHTML = `
        <div class="scan-card ${low ? "scan-card--low" : ""}">
            <h3>📦 ${item.part_name}</h3>
            <p><strong>Material:</strong> ${item.material || "—"}</p>
            <p><strong>Stock after scan:</strong> <span class="${low ? "qty-low" : "qty-ok"}">${item.quantity} ${item.unit}</span></p>
            <p><strong>Reorder threshold:</strong> ${item.reorder_at} ${item.unit}</p>
            ${data?.reorder?.triggered
                ? `<div class="reorder-pill">🔔 Auto-Reorder triggered — ${data.reorder.reorder_qty} units ordered!</div>`
                : ""}
        </div>`;
}

// ═══════════════════════════════════════════════════════
// KEYBOARD SHORTCUTS
// ═══════════════════════════════════════════════════════

document.getElementById("rfidInput").addEventListener("keypress", e => {
    if (e.key === "Enter") lookupRFID();
});
document.getElementById("barcodeInput").addEventListener("keypress", e => {
    if (e.key === "Enter") lookupBarcode();
});

// ═══════════════════════════════════════════════════════
// INIT
// ═══════════════════════════════════════════════════════

window.onload = function () {
    loadDashboard();
    updateRFIDStatus("listening");
    document.getElementById("chatInput").focus();
};
// ═══════════════════════════════════════════════════════════════════
// MANAGEMENT TO MEET DEMAND  — append to app.js
// ═══════════════════════════════════════════════════════════════════

// ── State ──────────────────────────────────────────────────────────
let demandHorizon  = 30;   // days
let demandOpen     = false;
let demandLoaded   = false;

// ── Toggle accordion & lazy-load data ─────────────────────────────
function toggleDemandSection() {
    demandOpen = !demandOpen;
    const body    = document.getElementById("demandBody");
    const header  = document.querySelector(".demand-section-header");
    body.classList.toggle("open", demandOpen);
    header.classList.toggle("open", demandOpen);
    if (demandOpen && !demandLoaded) {
        loadAllDemand();
        demandLoaded = true;
    }
}

// ── Horizon picker ─────────────────────────────────────────────────
function setHorizon(days, btn) {
    demandHorizon = days;
    document.querySelectorAll(".horizon-btn").forEach(b => b.classList.remove("active"));
    if (btn) btn.classList.add("active");
    if (demandOpen) {
        loadForecast();
        loadGapAnalysis();
    }
}

// ── Master loader ──────────────────────────────────────────────────
async function loadAllDemand() {
    await Promise.all([
        loadForecast(),
        loadGapAnalysis(),
        loadProductionPlans(),
        loadSuppliers(),
    ]);
}

// ── ① DEMAND FORECAST ─────────────────────────────────────────────
async function loadForecast() {
    const el = document.getElementById("forecastList");
    if (!el) return;
    el.innerHTML = `<div class="demand-loading"><i class="ti ti-loader"></i> Loading…</div>`;

    try {
        const res  = await fetch("/api/demand/forecast");
        const data = await res.json();

        if (!data.length) {
            el.innerHTML = `<div class="demand-empty"><i class="ti ti-package-off"></i>No inventory items yet.</div>`;
            updateAlertBadge([]);
            return;
        }

        el.innerHTML = data.map(item => {
            const need     = demandHorizon === 7  ? item.forecast_7d
                           : demandHorizon === 30 ? item.forecast_30d
                           : Math.round(item.avg_daily_use * demandHorizon);
            const hasCover = item.days_until_stockout !== null;
            const coverCls = !hasCover                        ? "forecast-num ok"
                           : item.days_until_stockout <  7    ? "forecast-num critical"
                           : item.days_until_stockout < 30    ? "forecast-num warn"
                           :                                    "forecast-num ok";
            const coverTxt = hasCover
                ? `${item.days_until_stockout}d until stockout`
                : "No consumption data";

            const trendCls = { rising: "trend-rising", falling: "trend-falling",
                                stable: "trend-stable",  "no data": "trend-nodata" }[item.trend] || "trend-nodata";
            const trendIcon = item.trend === "rising"  ? "↑"
                            : item.trend === "falling" ? "↓"
                            : item.trend === "stable"  ? "→" : "—";

            // Sparkline
            const maxH = Math.max(...(item.history.map(h => h.consumed)), 1);
            const bars = item.history.length
                ? item.history.slice(-14).map(h => {
                    const pct = Math.round((h.consumed / maxH) * 100);
                    return `<div class="spark-bar" style="height:${Math.max(pct,8)}%" title="${h.day}: ${h.consumed}"></div>`;
                  }).join("")
                : `<div style="color:var(--text-muted);font-size:11px;width:100%;text-align:center;padding-top:6px">No scan history</div>`;

            return `
            <div class="forecast-item">
                <div>
                    <div class="forecast-item-name">${item.part_name}</div>
                    <div class="forecast-item-sub">
                        ${item.material || "—"} &nbsp;·&nbsp;
                        <strong>${item.avg_daily_use}</strong>/day avg
                    </div>
                    <div class="sparkline-wrap">${bars}</div>
                </div>
                <div class="forecast-item-nums">
                    <div class="${coverCls}">${need} ${item.unit}</div>
                    <div style="font-size:10.5px;color:var(--text-muted)">${demandHorizon}d need</div>
                    <span class="trend-pill ${trendCls}">${trendIcon} ${item.trend}</span>
                    <div style="font-size:10.5px;color:var(--text-muted);margin-top:3px">${coverTxt}</div>
                </div>
            </div>`;
        }).join("");

        updateAlertBadge(data);
    } catch (err) {
        el.innerHTML = `<div class="demand-empty">Error: ${err.message}</div>`;
    }
}

// ── ② GAP ANALYSIS ────────────────────────────────────────────────
async function loadGapAnalysis() {
    const tbody = document.getElementById("gapTableBody");
    if (!tbody) return;
    tbody.innerHTML = `<tr><td colspan="6" class="demand-loading"><i class="ti ti-loader"></i> Analysing…</td></tr>`;

    try {
        const res  = await fetch(`/api/demand/gap-analysis?days=${demandHorizon}`);
        const data = await res.json();

        if (!data.length) {
            tbody.innerHTML = `<tr><td colspan="6" class="demand-empty">No inventory data.</td></tr>`;
            return;
        }

        tbody.innerHTML = data.map(item => {
            const gapCls  = item.gap < 0               ? "gap-num gap-neg"
                          : item.gap < item.reorder_at  ? "gap-num gap-warn"
                          :                               "gap-num gap-pos";
            const gapPfx  = item.gap >= 0 ? "+" : "";
            const covTxt  = item.coverage_days !== null ? `${item.coverage_days}d` : "∞";
            const badgeCls = { ok: "gap-status-badge gap-ok",
                                warning: "gap-status-badge gap-warning",
                                critical: "gap-status-badge gap-critical" }[item.status];
            const icon    = { ok: "✓", warning: "⚠", critical: "✗" }[item.status];
            const pending = item.pending_orders > 0
                ? `<span style="color:var(--blue);font-size:10px;margin-left:4px">+${item.pending_orders} on order</span>` : "";

            return `
            <tr>
                <td>
                    <div style="font-weight:600;color:var(--text-primary);font-size:12.5px">${item.part_name}</div>
                    <div style="font-size:10.5px;color:var(--text-muted)">${item.material || "—"}</div>
                </td>
                <td class="gap-num">${item.current_stock} <span style="font-size:10px;color:var(--text-muted)">${item.unit}</span>${pending}</td>
                <td class="gap-num">${item.projected_demand} <span style="font-size:10px;color:var(--text-muted)">${item.unit}</span></td>
                <td class="${gapCls}">${gapPfx}${item.gap}</td>
                <td>
                    <div class="coverage-wrap">
                        <span class="coverage-days ${item.coverage_days !== null && item.coverage_days < 14 ? 'gap-warn' : ''}">${covTxt}</span>
                        ${item.supplier ? `<span style="font-size:10px;color:var(--text-muted)">${item.supplier.lead_days}d lead</span>` : ""}
                    </div>
                </td>
                <td><span class="${badgeCls}">${icon} ${item.status}</span></td>
            </tr>`;
        }).join("");
    } catch (err) {
        tbody.innerHTML = `<tr><td colspan="6" class="demand-empty">Error: ${err.message}</td></tr>`;
    }
}

// ── ③ PRODUCTION PLANNING ─────────────────────────────────────────
async function loadProductionPlans() {
    const el = document.getElementById("prodPlanList");
    if (!el) return;
    el.innerHTML = `<div class="demand-loading"><i class="ti ti-loader"></i> Loading…</div>`;

    try {
        const res  = await fetch("/api/demand/production-plan");
        const data = await res.json();

        if (!data.length) {
            el.innerHTML = `<div class="demand-empty"><i class="ti ti-calendar-off"></i>No production plans yet.</div>`;
            return;
        }

        el.innerHTML = data.map(p => {
            const dateRange = [p.start_date, p.end_date].filter(Boolean).join(" → ") || "No dates set";
            return `
            <div class="plan-item" id="plan-${p.id}">
                <div>
                    <div class="plan-item-name">${p.part_name}</div>
                    <div class="plan-item-dates">${dateRange}${p.notes ? " · " + p.notes : ""}</div>
                </div>
                <div class="plan-item-qty">${p.target_qty} ${p.unit || "pcs"}</div>
                <select class="plan-status-sel" onchange="updatePlanStatus(${p.id}, this.value)">
                    ${["Planned","In Progress","Complete","On Hold"].map(s =>
                        `<option ${p.status === s ? "selected" : ""}>${s}</option>`
                    ).join("")}
                </select>
                <button class="plan-del-btn" onclick="deletePlan(${p.id})" title="Delete">
                    <i class="ti ti-trash"></i>
                </button>
            </div>`;
        }).join("");
    } catch (err) {
        el.innerHTML = `<div class="demand-empty">Error: ${err.message}</div>`;
    }
}

async function addProductionPlan() {
    const part  = document.getElementById("pp-part").value.trim();
    const qty   = document.getElementById("pp-qty").value.trim();
    const msg   = document.getElementById("ppMsg");

    if (!part || !qty) { msg.style.color = "var(--red)"; msg.textContent = "❌ Part & qty required"; return; }

    try {
        const res  = await fetch("/api/demand/production-plan", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                part_name:  part,
                target_qty: parseInt(qty),
                start_date: document.getElementById("pp-start").value,
                end_date:   document.getElementById("pp-end").value,
            }),
        });
        const data = await res.json();
        msg.style.color   = res.ok ? "var(--green)" : "var(--red)";
        msg.textContent   = data.message;
        if (res.ok) {
            ["pp-part","pp-qty","pp-start","pp-end"].forEach(id => { document.getElementById(id).value = ""; });
            loadProductionPlans();
        }
    } catch (err) {
        msg.style.color = "var(--red)"; msg.textContent = "Error: " + err.message;
    }
}

async function updatePlanStatus(id, status) {
    await fetch(`/api/demand/production-plan/${id}`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ status }),
    });
}

async function deletePlan(id) {
    if (!confirm("Delete this production plan?")) return;
    await fetch(`/api/demand/production-plan/${id}`, { method: "DELETE" });
    loadProductionPlans();
}

// ── ④ SUPPLIER LEAD TIMES ─────────────────────────────────────────
async function loadSuppliers() {
    const el = document.getElementById("supplierList");
    if (!el) return;
    el.innerHTML = `<div class="demand-loading"><i class="ti ti-loader"></i> Loading…</div>`;

    try {
        const res  = await fetch("/api/demand/suppliers");
        const data = await res.json();

        if (!data.length) {
            el.innerHTML = `<div class="demand-empty"><i class="ti ti-truck-off"></i>No suppliers yet.</div>`;
            return;
        }

        el.innerHTML = data.map(s => {
            const leadCls = s.lead_days <= 5  ? "lead-fast"
                          : s.lead_days <= 14 ? "lead-medium"
                          :                     "lead-slow";
            const relPct  = Math.min(100, s.reliability);
            const relCol  = relPct >= 90 ? "var(--green)"
                          : relPct >= 70 ? "var(--amber)"
                          :                "var(--red)";
            return `
            <div class="supplier-item">
                <div>
                    <div class="supplier-name">${s.name}</div>
                    <div class="supplier-part">${s.part_name || s.inv_part_name || "—"}</div>
                    <div class="reliability-bar-wrap" title="${relPct}% reliability">
                        <div class="reliability-bar" style="width:${relPct}%;background:${relCol}"></div>
                    </div>
                    <div style="font-size:10px;color:var(--text-muted);margin-top:2px">${relPct}% reliability</div>
                </div>
                <span class="lead-pill ${leadCls}">
                    <i class="ti ti-clock"></i> ${s.lead_days}d lead
                </span>
                <span style="font-size:11px;color:var(--text-muted)">${s.contact || ""}</span>
                <button class="plan-del-btn" onclick="deleteSupplier(${s.id})" title="Remove">
                    <i class="ti ti-trash"></i>
                </button>
            </div>`;
        }).join("");
    } catch (err) {
        el.innerHTML = `<div class="demand-empty">Error: ${err.message}</div>`;
    }
}

async function addSupplier() {
    const name = document.getElementById("sup-name").value.trim();
    const msg  = document.getElementById("supMsg");

    if (!name) { msg.style.color = "var(--red)"; msg.textContent = "❌ Supplier name required"; return; }

    try {
        const res  = await fetch("/api/demand/suppliers", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                name,
                part_name:   document.getElementById("sup-part").value.trim(),
                lead_days:   parseInt(document.getElementById("sup-lead").value) || 7,
                reliability: parseInt(document.getElementById("sup-rel").value)  || 90,
            }),
        });
        const data = await res.json();
        msg.style.color = res.ok ? "var(--green)" : "var(--red)";
        msg.textContent = data.message;
        if (res.ok) {
            ["sup-name","sup-part"].forEach(id => { document.getElementById(id).value = ""; });
            document.getElementById("sup-lead").value = "7";
            document.getElementById("sup-rel").value  = "90";
            loadSuppliers();
        }
    } catch (err) {
        msg.style.color = "var(--red)"; msg.textContent = "Error: " + err.message;
    }
}

async function deleteSupplier(id) {
    if (!confirm("Remove this supplier?")) return;
    await fetch(`/api/demand/suppliers/${id}`, { method: "DELETE" });
    loadSuppliers();
}

// ── Alert badge helper ─────────────────────────────────────────────
function updateAlertBadge(forecastData) {
    const badge = document.getElementById("demandAlertBadge");
    if (!badge) return;
    const critical = forecastData.filter(
        i => i.days_until_stockout !== null && i.days_until_stockout < 7
    ).length;
    if (critical > 0) {
        badge.textContent = `⚠ ${critical} at risk`;
        badge.style.background = "var(--red-dim)";
        badge.style.borderColor = "var(--red-bd)";
        badge.style.color = "var(--red)";
    } else {
        badge.textContent = "All clear";
        badge.style.background = "";
        badge.style.borderColor = "";
        badge.style.color = "";
    }
}

// ── Hook into existing loadDashboard so data refreshes when dashboard reloads ──
const _origLoadDashboard = loadDashboard;
loadDashboard = async function () {
    await _origLoadDashboard();
    // If section is open, refresh demand data too
    if (demandOpen) loadAllDemand();
};
// ═══════════════════════════════════════════════════════════════════
// FUTURE PREDICTIONS PANEL  — append to app.js
// ═══════════════════════════════════════════════════════════════════

// ── State ────────────────────────────────────────────────────────
let predHorizon   = 30;
let predOpen      = false;
let predLoaded    = false;
let predData      = [];
let predExpanded  = new Set();   // which item cards are expanded

// ── Toggle accordion ──────────────────────────────────────────────
function togglePredSection() {
    predOpen = !predOpen;
    const body   = document.getElementById("predBody");
    const header = document.querySelector(".pred-section-header");
    body.classList.toggle("open", predOpen);
    header.classList.toggle("open", predOpen);
    if (predOpen && !predLoaded) {
        loadPredictions();
        predLoaded = true;
    }
}

// ── Horizon picker ────────────────────────────────────────────────
function setPredHorizon(days, btn) {
    predHorizon = days;
    document.querySelectorAll(".pred-horizon-btn").forEach(b => b.classList.remove("active"));
    if (btn) btn.classList.add("active");
    if (predOpen) loadPredictions();
}

// ── Main loader ───────────────────────────────────────────────────
async function loadPredictions() {
    const grid = document.getElementById("predGrid");
    if (!grid) return;

    grid.innerHTML = `
        <div class="pred-loading-state">
            <div class="pred-loader-ring"></div>
            <span>Running regression models…</span>
        </div>`;

    try {
        const res  = await fetch(`/api/demand/predictions?days=${predHorizon}`);
        predData   = await res.json();

        if (!predData.length) {
            grid.innerHTML = `
                <div class="pred-empty">
                    <i class="ti ti-chart-off"></i>
                    Add inventory items to enable predictions.
                </div>`;
            updatePredBadge([]);
            return;
        }

        updatePredBadge(predData);
        renderPredGrid(predData);

    } catch (err) {
        grid.innerHTML = `<div class="pred-empty" style="color:var(--red)">Error: ${err.message}</div>`;
    }
}

// ── Render the full predictions grid ─────────────────────────────
function renderPredGrid(items) {
    const grid = document.getElementById("predGrid");
    if (!grid) return;

    // Summary row at the top
    const critical = items.filter(i => i.reorder_rec.urgency === "critical").length;
    const high     = items.filter(i => i.reorder_rec.urgency === "high").length;
    const noData   = items.filter(i => !i.has_data).length;

    grid.innerHTML = `
        <div class="pred-summary-row">
            <div class="pred-summary-chip pred-chip-critical">
                <i class="ti ti-alert-circle"></i>
                <strong>${critical}</strong> Critical
            </div>
            <div class="pred-summary-chip pred-chip-high">
                <i class="ti ti-alert-triangle"></i>
                <strong>${high}</strong> High Risk
            </div>
            <div class="pred-summary-chip pred-chip-ok">
                <i class="ti ti-circle-check"></i>
                <strong>${items.length - critical - high}</strong> Stable
            </div>
            <div class="pred-summary-chip pred-chip-nodata" style="${noData ? '' : 'opacity:.45'}">
                <i class="ti ti-database-off"></i>
                <strong>${noData}</strong> No scan data
            </div>
        </div>
        <div class="pred-cards" id="predCards">
            ${items.map(item => renderPredCard(item)).join("")}
        </div>`;
}

// ── Render a single prediction card ──────────────────────────────
function renderPredCard(item) {
    const urg   = item.reorder_rec.urgency;
    const urgCls = { critical: "pred-urg-critical", high: "pred-urg-high",
                     medium: "pred-urg-medium",    low: "pred-urg-low" }[urg] || "pred-urg-low";

    const urgLabel  = { critical: "🔴 Critical", high: "🟠 High Risk",
                        medium: "🟡 Watch",     low: "🟢 Stable" }[urg] || "🟢 Stable";

    const stockPct  = item.reorder_at
        ? Math.min(100, Math.round((item.current_stock / (item.reorder_at * 8)) * 100))
        : 50;
    const stockCol  = item.current_stock === 0             ? "var(--red)"
                    : item.current_stock <= item.reorder_at ? "var(--amber)"
                    : "var(--green)";

    // Forecast bar (visual comparison of stock vs demand)
    const fk      = predHorizon <= 7 ? "7d" : predHorizon <= 14 ? "14d" : predHorizon <= 30 ? "30d" : predHorizon <= 60 ? "60d" : "90d";
    const fc      = item.forecast[fk] || item.forecast["30d"];
    const maxVal  = Math.max(item.current_stock, fc.hi, 1);
    const stockW  = Math.round((item.current_stock / maxVal) * 100);
    const demandW = Math.round((fc.demand / maxVal) * 100);
    const hiW     = Math.round((fc.hi / maxVal) * 100);

    const stockoutTxt = item.stockout.days
        ? `<span class="${item.stockout.days <= 14 ? 'pred-stockout-warn' : 'pred-stockout-ok'}">
               Stockout in <strong>${item.stockout.days}d</strong>
               (${item.stockout.days_lo || "?"}–${item.stockout.days_hi || "∞"}d range)
           </span>`
        : `<span class="pred-stockout-ok">No stockout within ${item.has_data ? "365d" : "—"}</span>`;

    const trendIcon = { rising: "↑", falling: "↓", stable: "→",
                        accelerating: "⬆", decelerating: "⬇", "no data": "—" }[item.trend] || "—";
    const trendCls  = { rising: "pred-trend-up", accelerating: "pred-trend-up-fast",
                        falling: "pred-trend-down", decelerating: "pred-trend-down-fast",
                        stable: "pred-trend-stable", "no data": "pred-trend-nodata" }[item.trend] || "pred-trend-nodata";

    const confBar  = item.has_data
        ? `<div class="pred-conf-bar-wrap" title="${item.confidence}% model confidence (R²)">
               <div class="pred-conf-bar" style="width:${item.confidence}%;background:${item.confidence >= 70 ? 'var(--green)' : item.confidence >= 40 ? 'var(--amber)' : 'var(--red)'}"></div>
           </div>`
        : `<span style="color:var(--text-muted);font-size:10.5px">No scan history</span>`;

    const isExpanded = predExpanded.has(item.id);
    const chartHtml  = isExpanded ? buildMiniChart(item) : "";

    return `
    <div class="pred-card ${urgCls}" id="pred-card-${item.id}">

        <!-- Card header -->
        <div class="pred-card-head" onclick="togglePredCard(${item.id})">
            <div class="pred-card-head-left">
                <span class="pred-urg-badge ${urgCls}">${urgLabel}</span>
                <div class="pred-card-name">${item.part_name}</div>
                <div class="pred-card-sub">${item.material || "—"} · ${item.unit}</div>
            </div>
            <div class="pred-card-head-right">
                <div class="pred-stock-display">
                    <span class="pred-stock-num" style="color:${stockCol}">${item.current_stock}</span>
                    <span class="pred-stock-unit">${item.unit} in stock</span>
                </div>
                <i class="ti ti-chevron-${isExpanded ? 'up' : 'down'} pred-chevron-icon"></i>
            </div>
        </div>

        <!-- Always-visible quick stats -->
        <div class="pred-card-stats">

            <div class="pred-stat">
                <div class="pred-stat-label">Demand (${predHorizon}d)</div>
                <div class="pred-stat-val">${fc.demand} <span class="pred-stat-range">(${fc.lo}–${fc.hi})</span></div>
            </div>
            <div class="pred-stat">
                <div class="pred-stat-label">Trend</div>
                <div class="pred-stat-val ${trendCls}">${trendIcon} ${item.trend} <span class="pred-stat-range">${item.velocity}</span></div>
            </div>
            <div class="pred-stat">
                <div class="pred-stat-label">Stockout</div>
                <div class="pred-stat-val">${stockoutTxt}</div>
            </div>
            <div class="pred-stat">
                <div class="pred-stat-label">Model Fit</div>
                <div class="pred-stat-val pred-conf-wrap">
                    ${confBar}
                    <span style="font-size:10.5px;color:var(--text-muted)">${item.confidence}%</span>
                </div>
            </div>

        </div>

        <!-- Visual stock vs demand bar -->
        <div class="pred-bar-section">
            <div class="pred-bar-labels">
                <span>Current Stock</span>
                <span>${predHorizon}d Forecast</span>
            </div>
            <div class="pred-bar-track">
                <div class="pred-bar-fill pred-bar-stock" style="width:${stockW}%" title="Stock: ${item.current_stock}"></div>
            </div>
            <div class="pred-bar-track">
                <div class="pred-bar-fill pred-bar-demand-hi" style="width:${hiW}%" title="High estimate: ${fc.hi}"></div>
                <div class="pred-bar-fill pred-bar-demand" style="width:${demandW}%;position:absolute;left:0;top:0" title="Predicted demand: ${fc.demand}"></div>
            </div>
        </div>

        <!-- Expanded detail section -->
        <div class="pred-card-detail ${isExpanded ? 'open' : ''}">

            <!-- Mini 30-day chart -->
            <div class="pred-chart-section">
                <div class="pred-chart-title">30-Day Stock Forecast</div>
                ${chartHtml}
            </div>

            <!-- Horizon table -->
            <div class="pred-horizons">
                ${["7d","14d","30d","60d","90d"].map(hk => {
                    const f = item.forecast[hk];
                    const cover = f.demand > 0 ? Math.round((item.current_stock / f.demand) * 100) : 999;
                    const coverCls = cover >= 100 ? "pred-cover-ok" : cover >= 70 ? "pred-cover-warn" : "pred-cover-bad";
                    return `
                    <div class="pred-horizon-row">
                        <span class="pred-horizon-label">${hk}</span>
                        <span class="pred-horizon-demand">${f.demand} ${item.unit}</span>
                        <span class="pred-horizon-range">(${f.lo}–${f.hi})</span>
                        <span class="pred-horizon-cover ${coverCls}">${Math.min(999, cover)}% covered</span>
                    </div>`;
                }).join("")}
            </div>

            <!-- Reorder recommendation box -->
            ${item.reorder_rec.suggested_qty > 0 || urg === "critical" || urg === "high" ? `
            <div class="pred-reorder-box pred-reorder-${urg}">
                <div class="pred-reorder-title">
                    <i class="ti ti-truck"></i>
                    Reorder Recommendation
                </div>
                <div class="pred-reorder-grid">
                    <div><span class="pred-rlabel">Suggested Qty</span><span class="pred-rval">${item.reorder_rec.suggested_qty} ${item.unit}</span></div>
                    <div><span class="pred-rlabel">Reorder Point</span><span class="pred-rval">${item.reorder_rec.reorder_point} ${item.unit}</span></div>
                    <div><span class="pred-rlabel">Safety Stock</span><span class="pred-rval">${item.reorder_rec.safety_stock} ${item.unit}</span></div>
                    <div><span class="pred-rlabel">Lead Time</span><span class="pred-rval">${item.reorder_rec.lead_days} days</span></div>
                    ${item.reorder_rec.supplier ? `<div style="grid-column:span 2"><span class="pred-rlabel">Supplier</span><span class="pred-rval">${item.reorder_rec.supplier}</span></div>` : ""}
                </div>
                <button class="pred-order-btn" onclick="quickOrder(${item.id}, '${item.part_name.replace(/'/g,"\\'")}', ${item.current_stock}); event.stopPropagation()">
                    <i class="ti ti-shopping-cart"></i>
                    Place Order Now
                </button>
            </div>` : ""}

        </div><!-- /pred-card-detail -->
    </div>`;
}

// ── Mini SVG stock-trajectory chart ──────────────────────────────
function buildMiniChart(item) {
    const days   = item.daily_forecast;
    if (!days || !days.length) return `<div class="pred-chart-nodata">No forecast data available</div>`;

    const W = 440, H = 90, PAD = 6;
    const maxStock = Math.max(item.current_stock, ...days.map(d => d.stock_eod), 1);
    const minStock = 0;

    const toX = i => PAD + (i / days.length) * (W - PAD * 2);
    const toY = v => H - PAD - ((v - minStock) / (maxStock - minStock)) * (H - PAD * 2);

    // Stock line
    const stockPts   = days.map((d, i) => `${toX(i)},${toY(d.stock_eod)}`).join(" ");
    const stockArea  = `${toX(0)},${toY(0)} ` + stockPts + ` ${toX(days.length - 1)},${toY(0)}`;

    // Hi/Lo consumption band (drawn as shaded region over stock)
    const hiPts  = days.map((d, i) => `${toX(i)},${toY(Math.max(0, d.stock_eod - d.consume_hi + d.consumption))}`).join(" ");
    const loPts  = [...days].reverse().map((d, i) => `${toX(days.length - 1 - i)},${toY(Math.max(0, d.stock_eod - d.consume_lo + d.consumption))}`).join(" ");

    // Reorder threshold line
    const rY = toY(item.reorder_at);

    // Stockout marker
    const stockoutDay  = item.stockout.days;
    const stockoutX    = stockoutDay && stockoutDay <= 30 ? toX(stockoutDay) : null;

    return `
    <div class="pred-chart-wrap">
        <svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" class="pred-svg-chart">
            <defs>
                <linearGradient id="stockGrad-${item.id}" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stop-color="var(--brand-light)" stop-opacity="0.35"/>
                    <stop offset="100%" stop-color="var(--brand-light)" stop-opacity="0.03"/>
                </linearGradient>
            </defs>

            <!-- Confidence band -->
            <polygon points="${hiPts} ${loPts}" fill="var(--brand-light)" opacity="0.07"/>

            <!-- Stock area fill -->
            <polygon points="${stockArea}" fill="url(#stockGrad-${item.id})"/>

            <!-- Stock line -->
            <polyline points="${stockPts}" fill="none" stroke="var(--brand-light)" stroke-width="2" stroke-linejoin="round"/>

            <!-- Reorder threshold -->
            <line x1="${PAD}" y1="${rY}" x2="${W - PAD}" y2="${rY}"
                  stroke="var(--amber)" stroke-width="1" stroke-dasharray="4,3" opacity="0.8"/>
            <text x="${W - PAD - 2}" y="${rY - 3}" font-size="8" fill="var(--amber)" text-anchor="end" opacity="0.8">reorder</text>

            <!-- Stockout marker -->
            ${stockoutX ? `
            <line x1="${stockoutX}" y1="${PAD}" x2="${stockoutX}" y2="${H - PAD}"
                  stroke="var(--red)" stroke-width="1.5" stroke-dasharray="3,3" opacity="0.9"/>
            <text x="${stockoutX + 3}" y="${PAD + 9}" font-size="8" fill="var(--red)">stockout</text>
            ` : ""}

            <!-- Today marker -->
            <line x1="${PAD}" y1="${PAD}" x2="${PAD}" y2="${H - PAD}"
                  stroke="var(--text-muted)" stroke-width="1" opacity="0.3"/>
        </svg>

        <div class="pred-chart-legend">
            <span><svg width="12" height="4"><line x1="0" y1="2" x2="12" y2="2" stroke="var(--brand-light)" stroke-width="2"/></svg> Stock projection</span>
            <span><svg width="12" height="4"><line x1="0" y1="2" x2="12" y2="2" stroke="var(--amber)" stroke-width="1.5" stroke-dasharray="4,2"/></svg> Reorder threshold</span>
            ${stockoutX ? `<span><svg width="12" height="4"><line x1="0" y1="2" x2="12" y2="2" stroke="var(--red)" stroke-width="1.5" stroke-dasharray="3,2"/></svg> Stockout</span>` : ""}
        </div>
    </div>`;
}

// ── Toggle expanded card ──────────────────────────────────────────
function togglePredCard(id) {
    if (predExpanded.has(id)) {
        predExpanded.delete(id);
    } else {
        predExpanded.add(id);
    }
    // Re-render just this card
    const item = predData.find(i => i.id === id);
    if (!item) return;
    const card = document.getElementById(`pred-card-${id}`);
    if (!card) return;
    card.outerHTML = renderPredCard(item);
}

// ── Alert badge ───────────────────────────────────────────────────
function updatePredBadge(items) {
    const badge = document.getElementById("predAlertBadge");
    if (!badge) return;
    const critical = items.filter(i => i.reorder_rec?.urgency === "critical").length;
    const high     = items.filter(i => i.reorder_rec?.urgency === "high").length;
    const total    = critical + high;
    if (total > 0) {
        badge.textContent = `⚠ ${total} at risk`;
        badge.style.background  = critical > 0 ? "var(--red-dim)"   : "var(--amber-dim)";
        badge.style.borderColor = critical > 0 ? "var(--red-bd)"    : "var(--amber-bd)";
        badge.style.color       = critical > 0 ? "var(--red)"       : "var(--amber)";
    } else {
        badge.textContent = items.length ? "All clear" : "No data";
        badge.style.background  = "";
        badge.style.borderColor = "";
        badge.style.color       = "";
    }
}

// ── Hook loadDashboard to reset predLoaded on full refresh ────────
const _origLoadDashboard2 = loadDashboard;
loadDashboard = async function () {
    await _origLoadDashboard2();
    if (predOpen) loadPredictions();
};