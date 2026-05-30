import sqlite3
from datetime import datetime

DB_NAME = "orders.db"


def get_db():
    conn = sqlite3.connect(DB_NAME)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    conn = get_db()

    # ── Inventory catalog ────────────────────────────────
    conn.execute("""
    CREATE TABLE IF NOT EXISTS inventory (
        id          INTEGER PRIMARY KEY AUTOINCREMENT,
        part_name   TEXT NOT NULL,
        material    TEXT,
        unit        TEXT DEFAULT 'pcs',
        quantity    INTEGER DEFAULT 0,
        reorder_at  INTEGER DEFAULT 10,
        rfid_tag    TEXT UNIQUE,
        barcode     TEXT UNIQUE,
        created_at  TEXT
    )
    """)

    # ── Orders — always tied to an inventory item ────────
    conn.execute("""
    CREATE TABLE IF NOT EXISTS orders (
        id              INTEGER PRIMARY KEY AUTOINCREMENT,
        inventory_id    INTEGER,
        part_name       TEXT NOT NULL,
        material        TEXT,
        quantity        INTEGER,
        specs           TEXT,
        deadline        TEXT,
        status          TEXT DEFAULT 'Received',
        created_at      TEXT,
        FOREIGN KEY(inventory_id) REFERENCES inventory(id)
    )
    """)

    # ── Quality logs ─────────────────────────────────────
    conn.execute("""
    CREATE TABLE IF NOT EXISTS quality_logs (
        id          INTEGER PRIMARY KEY AUTOINCREMENT,
        order_id    INTEGER,
        note        TEXT,
        log_time    TEXT,
        FOREIGN KEY(order_id) REFERENCES orders(id)
    )
    """)

    # ── Scan events (RFID / barcode) ─────────────────────
    conn.execute("""
    CREATE TABLE IF NOT EXISTS scan_events (
        id              INTEGER PRIMARY KEY AUTOINCREMENT,
        inventory_id    INTEGER,
        scan_type       TEXT,
        tag_value       TEXT,
        qty_consumed    INTEGER DEFAULT 1,
        order_triggered INTEGER DEFAULT 0,
        scanned_at      TEXT,
        FOREIGN KEY(inventory_id) REFERENCES inventory(id)
    )
    """)

    conn.commit()

    # ── Migrate: add inventory_id column if missing ──────
    cols = [r[1] for r in conn.execute("PRAGMA table_info(orders)").fetchall()]
    if "inventory_id" not in cols:
        conn.execute("ALTER TABLE orders ADD COLUMN inventory_id INTEGER")
        conn.commit()

    conn.close()