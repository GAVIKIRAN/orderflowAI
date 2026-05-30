# OrderFlow AI — Setup Guide

## Prerequisites
- Python 3.10+
- An **Anthropic API key** (get one at https://console.anthropic.com)

---

## 1. Install dependencies

```bash
cd orderflow
pip install -r requirements.txt
```

---

## 2. Set your API key

**Windows (CMD):**
```cmd
set ANTHROPIC_API_KEY=sk-ant-...
```

**Windows (PowerShell):**
```powershell
$env:ANTHROPIC_API_KEY="sk-ant-..."
```

**Mac / Linux:**
```bash
export ANTHROPIC_API_KEY=sk-ant-...
```

---

## 3. Run the app

```bash
python app.py
```

Open your browser at: **http://localhost:5000**

---

## What you can say in the chat

| Action | Example |
|---|---|
| Place an order | `I need 200 titanium flanges, 80mm bore, by July 20` |
| Update status | `Mark order #42 as accepted` |
| Auto-advance status | `Order #42 has been reviewed` |
| Log quality | `Log quality for order #42: visual inspection passed, no defects` |
| Check status | `What is the status of order #42?` |
| List all orders | `Show me all orders` |

---

## Project Structure

```
orderflow/
├── app.py                  ← Flask backend + Claude API integration
├── requirements.txt
├── README.md
├── templates/
│   └── index.html          ← Main HTML layout
└── static/
    ├── css/style.css       ← Dark theme styling
    └── js/app.js           ← Frontend logic
```

## Architecture
- **Intent Classification**: Each user message is sent to Claude API with a minimal stateless prompt
- **Structured Extraction**: Claude returns JSON with parsed fields (part, qty, deadline, etc.)
- **In-memory Store**: Order data lives in Python dict (no database needed for prototype)
- **Token-efficient**: No conversation history sent to API — each call is independent
