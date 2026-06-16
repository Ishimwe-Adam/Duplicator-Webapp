-- =========================================================
-- Duplicator Ltd — Supabase Schema
-- Run this ONCE in Supabase → SQL Editor → New query
-- =========================================================

-- Enums
CREATE TYPE user_role     AS ENUM ('super_admin', 'admin', 'staff', 'client');
CREATE TYPE order_status  AS ENUM ('draft', 'quoted', 'approved', 'in_production', 'ready', 'delivered', 'cancelled');
CREATE TYPE invoice_status AS ENUM ('draft', 'sent', 'paid', 'void');
CREATE TYPE payment_method AS ENUM ('momo', 'airtel', 'bank_transfer', 'cash', 'other');

-- Users
CREATE TABLE IF NOT EXISTS users (
  id                    SERIAL PRIMARY KEY,
  email                 TEXT NOT NULL UNIQUE,
  password_hash         TEXT NOT NULL,
  name                  TEXT NOT NULL,
  phone                 TEXT,
  role                  user_role NOT NULL DEFAULT 'client',
  company_name          TEXT,
  profile_picture_url   TEXT,
  is_active             BOOLEAN NOT NULL DEFAULT TRUE,
  failed_login_attempts INTEGER NOT NULL DEFAULT 0,
  locked_until          TIMESTAMPTZ,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Sessions
CREATE TABLE IF NOT EXISTS sessions (
  id             SERIAL PRIMARY KEY,
  token          TEXT NOT NULL UNIQUE,
  user_id        INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user_agent     TEXT,
  ip_address     TEXT,
  expires_at     TIMESTAMPTZ NOT NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_active_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Orders
CREATE TABLE IF NOT EXISTS orders (
  id               SERIAL PRIMARY KEY,
  client_id        INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  assigned_to      INTEGER REFERENCES users(id) ON DELETE SET NULL,
  title            TEXT NOT NULL,
  items            JSONB NOT NULL DEFAULT '[]',
  subtotal_amount  BIGINT NOT NULL,
  status           order_status NOT NULL DEFAULT 'draft',
  notes            TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Order status events
CREATE TABLE IF NOT EXISTS order_status_events (
  id          SERIAL PRIMARY KEY,
  order_id    INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  status      order_status NOT NULL,
  note        TEXT,
  by_user_id  INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Invoices
CREATE TABLE IF NOT EXISTS invoices (
  id               SERIAL PRIMARY KEY,
  order_id         INTEGER NOT NULL REFERENCES orders(id) ON DELETE RESTRICT,
  client_id        INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  items            JSONB NOT NULL DEFAULT '[]',
  subtotal_amount  BIGINT NOT NULL,
  tax_rate_percent INTEGER NOT NULL DEFAULT 0,
  tax_amount       BIGINT NOT NULL,
  total_amount     BIGINT NOT NULL,
  status           invoice_status NOT NULL DEFAULT 'draft',
  notes            TEXT,
  issue_date       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  due_date         TIMESTAMPTZ NOT NULL,
  sent_at          TIMESTAMPTZ,
  paid_at          TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Payments
CREATE TABLE IF NOT EXISTS payments (
  id              SERIAL PRIMARY KEY,
  invoice_id      INTEGER NOT NULL REFERENCES invoices(id) ON DELETE RESTRICT,
  amount          BIGINT NOT NULL,
  method          payment_method NOT NULL,
  reference       TEXT,
  notes           TEXT,
  paid_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  recorded_by_id  INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =========================================================
-- RPC Functions (used by the API server for atomic ops)
-- =========================================================

-- 1. Atomic failed-login increment + conditional lockout
CREATE OR REPLACE FUNCTION record_failed_login(
  p_user_id     INTEGER,
  p_max_failed  INTEGER,
  p_lock_minutes INTEGER
) RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE users SET
    failed_login_attempts = CASE
      WHEN failed_login_attempts + 1 >= p_max_failed THEN 0
      ELSE failed_login_attempts + 1
    END,
    locked_until = CASE
      WHEN failed_login_attempts + 1 >= p_max_failed
        THEN NOW() + (p_lock_minutes || ' minutes')::INTERVAL
      ELSE locked_until
    END
  WHERE id = p_user_id;
END;
$$;

-- 2. Atomic order-status transition (UPDATE WHERE old status matches, then INSERT event)
CREATE OR REPLACE FUNCTION transition_order_status(
  p_order_id    INTEGER,
  p_from_status TEXT,
  p_to_status   TEXT,
  p_note        TEXT,
  p_by_user_id  INTEGER
) RETURNS SETOF orders
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_order orders;
BEGIN
  UPDATE orders
    SET status     = p_to_status::order_status,
        updated_at = NOW()
  WHERE id     = p_order_id
    AND status  = p_from_status::order_status
  RETURNING * INTO v_order;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  INSERT INTO order_status_events (order_id, status, note, by_user_id)
  VALUES (p_order_id, p_to_status::order_status, p_note, p_by_user_id);

  RETURN NEXT v_order;
END;
$$;

-- 3. Transactional invoice creation (SELECT FOR UPDATE on order row)
CREATE OR REPLACE FUNCTION create_invoice(
  p_order_id         INTEGER,
  p_tax_rate_percent INTEGER,
  p_notes            TEXT,
  p_due_date         TIMESTAMPTZ
) RETURNS SETOF invoices
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_order    orders;
  v_subtotal BIGINT;
  v_tax      BIGINT;
  v_total    BIGINT;
  v_invoice  invoices;
BEGIN
  SELECT * INTO v_order FROM orders WHERE id = p_order_id FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'ORDER_NOT_FOUND';
  END IF;

  IF v_order.status = 'cancelled' THEN
    RAISE EXCEPTION 'ORDER_CANCELLED';
  END IF;

  v_subtotal := v_order.subtotal_amount;
  v_tax      := ROUND(v_subtotal::NUMERIC * p_tax_rate_percent / 100.0)::BIGINT;
  v_total    := v_subtotal + v_tax;

  INSERT INTO invoices (
    order_id, client_id, items, subtotal_amount,
    tax_rate_percent, tax_amount, total_amount,
    status, notes, due_date
  ) VALUES (
    p_order_id, v_order.client_id, v_order.items, v_subtotal,
    p_tax_rate_percent, v_tax, v_total,
    'draft', p_notes, p_due_date
  ) RETURNING * INTO v_invoice;

  RETURN NEXT v_invoice;
END;
$$;

-- 4. Atomic payment recording + auto-flip invoice to paid on full settlement
CREATE OR REPLACE FUNCTION record_payment(
  p_invoice_id     INTEGER,
  p_amount         BIGINT,
  p_method         TEXT,
  p_reference      TEXT,
  p_notes          TEXT,
  p_paid_at        TIMESTAMPTZ,
  p_recorded_by_id INTEGER
) RETURNS SETOF invoices
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_invoice      invoices;
  v_already_paid BIGINT;
  v_balance      BIGINT;
  v_new_paid     BIGINT;
BEGIN
  SELECT * INTO v_invoice FROM invoices WHERE id = p_invoice_id FOR UPDATE;

  IF NOT FOUND THEN RAISE EXCEPTION 'INVOICE_NOT_FOUND'; END IF;
  IF v_invoice.status = 'paid' THEN RAISE EXCEPTION 'INVOICE_ALREADY_PAID'; END IF;
  IF v_invoice.status = 'void' THEN RAISE EXCEPTION 'INVOICE_VOID'; END IF;

  SELECT COALESCE(SUM(amount), 0) INTO v_already_paid
  FROM payments WHERE invoice_id = p_invoice_id;

  v_balance := v_invoice.total_amount - v_already_paid;

  IF v_balance <= 0 THEN RAISE EXCEPTION 'NO_OUTSTANDING_BALANCE'; END IF;
  IF p_amount > v_balance THEN
    RAISE EXCEPTION 'AMOUNT_EXCEEDS_BALANCE:%', v_balance;
  END IF;

  INSERT INTO payments (invoice_id, amount, method, reference, notes, paid_at, recorded_by_id)
  VALUES (p_invoice_id, p_amount, p_method::payment_method, p_reference, p_notes, p_paid_at, p_recorded_by_id);

  v_new_paid := v_already_paid + p_amount;
  IF v_new_paid >= v_invoice.total_amount THEN
    UPDATE invoices
    SET status     = 'paid',
        paid_at    = NOW(),
        sent_at    = COALESCE(sent_at, NOW()),
        updated_at = NOW()
    WHERE id = p_invoice_id
    RETURNING * INTO v_invoice;
  END IF;

  RETURN NEXT v_invoice;
END;
$$;

-- 5. Top clients by lifetime payments received
CREATE OR REPLACE FUNCTION get_top_clients(p_limit INTEGER DEFAULT 5)
RETURNS TABLE (
  client_id     INTEGER,
  name          TEXT,
  email         TEXT,
  revenue       BIGINT,
  invoice_count BIGINT
)
LANGUAGE sql SECURITY DEFINER AS $$
  SELECT
    i.client_id,
    u.name,
    u.email,
    COALESCE(SUM(p.amount), 0)::BIGINT  AS revenue,
    COUNT(DISTINCT i.id)::BIGINT         AS invoice_count
  FROM payments p
  JOIN invoices i ON p.invoice_id = i.id
  JOIN users    u ON u.id = i.client_id
  GROUP BY i.client_id, u.name, u.email
  ORDER BY SUM(p.amount) DESC
  LIMIT p_limit;
$$;
