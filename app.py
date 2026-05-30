from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
import anthropic
import json
import re
from datetime import datetime

app = Flask(__name__)
CORS(app)

# ── In-memory store ──────────────────────────────────────────────
orders = {}
order_counter = [41]  # starts so first order is #42

def next_id():
    order_counter[0] += 1
    return order_counter[0]

# ── Claude client ────────────────────────────────────────────────
client = anthropic.Anthropic()  # reads ANTHROPIC_API_KEY from env

STATUS_FLOW = ["Received", "In Review", "Accepted"]

# ── Helpers ──────────────────────────────────────────────────────
def extract_json(text):
    """Pull the first {...} block from a Claude response."""
    match = re.search(r'\{.*\}', text, re.DOTALL)
    if match:
        return json.loads(match.group())
    return json.loads(text)

def classify_intent(message):
    """Ask Claude to classify intent and extract structured data."""
    prompt = f"""You are an intent classifier for a manufacturing order system.
Classify the user message into ONE intent and extract relevant fields.

Intents:
- create_order: user wants to place a new order
- update_status: user wants to update/progress an order status
- log_quality: user wants to log a quality checkpoint for an order
- query_order: user wants to know the status or details of an order
- list_orders: user wants to see all orders
- unknown: none of the above

User message: "{message}"

Respond ONLY with valid JSON (no markdown, no explanation):
{{
  "intent": "<intent>",
  "order_id": <number or null>,
  "part_name": "<string or null>",
  "material": "<string or null>",
  "quantity": <number or null>,
  "specs": "<extra specs like bore size or null>",
  "deadline": "<date string or null>",
  "new_status": "<Received|In Review|Accepted or null>",
  "quality_note": "<string or null>"
}}"""

    resp = client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=512,
        messages=[{"role": "user", "content": prompt}]
    )
    return extract_json(resp.content[0].text)

# ── Routes ───────────────────────────────────────────────────────
@app.route("/")
def index():
    return render_template("index.html")

@app.route("/api/chat", methods=["POST"])
def chat():
    data = request.json
    message = data.get("message", "").strip()
    if not message:
        return jsonify({"error": "Empty message"}), 400

    try:
        extracted = classify_intent(message)
        intent = extracted.get("intent", "unknown")

        # ── CREATE ORDER ─────────────────────────────────────────
        if intent == "create_order":
            oid = next_id()
            order = {
                "id": oid,
                "part_name": extracted.get("part_name") or "Unknown Part",
                "material": extracted.get("material") or "N/A",
                "quantity": extracted.get("quantity") or 0,
                "specs": extracted.get("specs") or "",
                "deadline": extracted.get("deadline") or "TBD",
                "status": "Received",
                "quality_logs": [],
                "created_at": datetime.now().isoformat()
            }
            orders[oid] = order
            return jsonify({
                "type": "order_created",
                "message": f"✅ Order #{oid} created — Status: Received",
                "order": order
            })

        # ── UPDATE STATUS ────────────────────────────────────────
        elif intent == "update_status":
            oid = extracted.get("order_id")
            new_status = extracted.get("new_status")

            if oid and oid in orders:
                old_status = orders[oid]["status"]
                # Auto-advance if new_status not specified
                if not new_status:
                    idx = STATUS_FLOW.index(old_status)
                    new_status = STATUS_FLOW[min(idx + 1, len(STATUS_FLOW) - 1)]
                orders[oid]["status"] = new_status
                return jsonify({
                    "type": "status_updated",
                    "message": f"✅ Order #{oid} status updated: {old_status} → {new_status}",
                    "order": orders[oid]
                })
            elif oid:
                return jsonify({"type": "error", "message": f"❌ Order #{oid} not found."})
            else:
                return jsonify({"type": "error", "message": "❌ Please specify an order ID."})

        # ── LOG QUALITY ──────────────────────────────────────────
        elif intent == "log_quality":
            oid = extracted.get("order_id")
            note = extracted.get("quality_note") or message

            if oid and oid in orders:
                if orders[oid]["status"] != "Accepted":
                    return jsonify({
                        "type": "error",
                        "message": f"❌ Quality logging is only available once order is Accepted. Order #{oid} is currently '{orders[oid]['status']}'."
                    })
                log_entry = {
                    "time": datetime.now().strftime("%I:%M %p"),
                    "note": note
                }
                orders[oid]["quality_logs"].append(log_entry)
                return jsonify({
                    "type": "quality_logged",
                    "message": f"🛡️ Quality checkpoint logged for Order #{oid}",
                    "log": log_entry,
                    "order": orders[oid]
                })
            elif oid:
                return jsonify({"type": "error", "message": f"❌ Order #{oid} not found."})
            else:
                return jsonify({"type": "error", "message": "❌ Please specify an order ID for quality logging."})

        # ── QUERY ORDER ──────────────────────────────────────────
        elif intent == "query_order":
            oid = extracted.get("order_id")
            if oid and oid in orders:
                o = orders[oid]
                return jsonify({
                    "type": "order_info",
                    "message": f"📦 Order #{oid} — {o['part_name']} × {o['quantity']} | Status: {o['status']} | Deadline: {o['deadline']}",
                    "order": o
                })
            elif oid:
                return jsonify({"type": "error", "message": f"❌ Order #{oid} not found."})
            else:
                return jsonify({"type": "error", "message": "❌ Please specify an order ID."})

        # ── LIST ORDERS ──────────────────────────────────────────
        elif intent == "list_orders":
            return jsonify({
                "type": "order_list",
                "message": f"📋 Showing all {len(orders)} orders.",
                "orders": list(orders.values())
            })

        # ── UNKNOWN ──────────────────────────────────────────────
        else:
            return jsonify({
                "type": "unknown",
                "message": "🤖 I can help you place orders, update statuses, log quality checkpoints, or check order status. Try: 'I need 200 titanium flanges by July 20' or 'Mark order #42 as accepted'."
            })

    except Exception as e:
        return jsonify({"type": "error", "message": f"❌ Error: {str(e)}"}), 500


@app.route("/api/orders", methods=["GET"])
def get_orders():
    return jsonify(list(orders.values()))


@app.route("/api/orders/<int:oid>", methods=["GET"])
def get_order(oid):
    if oid in orders:
        return jsonify(orders[oid])
    return jsonify({"error": "Not found"}), 404


if __name__ == "__main__":
    # Seed some demo orders
    orders[39] = {
        "id": 39, "part_name": "Aluminum Bracket", "material": "Aluminum",
        "quantity": 75, "specs": "", "deadline": "Jul 5",
        "status": "Received", "quality_logs": [],
        "created_at": datetime.now().isoformat()
    }
    orders[40] = {
        "id": 40, "part_name": "Copper Pipe 15mm", "material": "Copper",
        "quantity": 120, "specs": "15mm diameter", "deadline": "Jun 15",
        "status": "Accepted",
        "quality_logs": [
            {"time": "10:00 AM", "note": "All checkpoints passed — cleared for dispatch"}
        ],
        "created_at": datetime.now().isoformat()
    }
    orders[41] = {
        "id": 41, "part_name": "Steel Rod 20mm", "material": "Steel",
        "quantity": 500, "specs": "20mm diameter", "deadline": "Jun 30",
        "status": "In Review",
        "quality_logs": [
            {"time": "09:00 AM", "note": "Awaiting dimensional check"}
        ],
        "created_at": datetime.now().isoformat()
    }
    app.run(debug=True, port=5000)
