CREATE TABLE company_meta (
  id SERIAL PRIMARY KEY,
  company_name TEXT NOT NULL DEFAULT 'DUPLICATOR LTD.',
  tagline TEXT NOT NULL DEFAULT 'PRINTING | BRANDING | SEWING',
  document_title TEXT NOT NULL DEFAULT 'SALES QUOTATION',
  tin_tva TEXT NOT NULL DEFAULT '102062874',
  telephone TEXT NOT NULL DEFAULT '(+250)788355226',
  email TEXT NOT NULL DEFAULT 'duplicator10@gmail.com',
  address TEXT NOT NULL DEFAULT 'P.O. Box 6332 Kigali / KN 78St 69',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE quotations (
  id SERIAL PRIMARY KEY,
  company_meta_id INTEGER NOT NULL REFERENCES company_meta(id),
  quotation_no TEXT NOT NULL UNIQUE,
  date DATE NOT NULL,
  client_name TEXT NOT NULL,
  party_tin TEXT,
  grand_total NUMERIC(14, 2) NOT NULL DEFAULT 0,
  amount_in_words TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE quotation_items (
  id SERIAL PRIMARY KEY,
  quotation_id INTEGER NOT NULL REFERENCES quotations(id) ON DELETE CASCADE,
  sn INTEGER NOT NULL,
  description TEXT NOT NULL,
  qty NUMERIC(12, 2) NOT NULL DEFAULT 0,
  unit_price NUMERIC(14, 2) NOT NULL DEFAULT 0,
  amount NUMERIC(14, 2) NOT NULL DEFAULT 0,
  UNIQUE (quotation_id, sn)
);

CREATE TABLE company_capabilities (
  id SERIAL PRIMARY KEY,
  company_meta_id INTEGER NOT NULL REFERENCES company_meta(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  display_order INTEGER NOT NULL
);

CREATE TABLE quotation_terms (
  id SERIAL PRIMARY KEY,
  company_meta_id INTEGER NOT NULL REFERENCES company_meta(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  display_order INTEGER NOT NULL
);

CREATE TABLE payment_methods (
  id SERIAL PRIMARY KEY,
  company_meta_id INTEGER NOT NULL REFERENCES company_meta(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  display_order INTEGER NOT NULL
);

INSERT INTO company_meta (id) VALUES (1)
ON CONFLICT DO NOTHING;

INSERT INTO company_capabilities (company_meta_id, label, display_order) VALUES
(1, 'Offset Printing', 1),
(1, 'Wedding & Invitation Cards', 2),
(1, 'Office Supply', 3),
(1, 'General Stationary', 4),
(1, 'Design , Large Format', 5),
(1, 'Digital Printing, PVC Banners, Stickers', 6),
(1, 'Promotional Items', 7),
(1, 'T-shirts, Caps, Digital Printing', 8);

INSERT INTO quotation_terms (company_meta_id, body, display_order) VALUES
(1, '50% Advance upon order and 50% on delivery for orders amounting to more than 100,000 FRW', 1),
(1, '100% payment for Orders amounting Or a Valid Purchase Order ( Only for Institutions with a Running Contract) from Duplicator Ltd', 2);

INSERT INTO payment_methods (company_meta_id, label, display_order) VALUES
(1, '- Pay Cash or Cheque in names: DUPLICATOR Ltd', 1),
(1, '- Transfer to bank of Africa: 01713010005 (FRW)', 2),
(1, '- Transfer to bank of Africa: 01713010018 (USD $)', 3),
(1, '- Transfer to Bank of kigali: 00040-00407411-44 (FRW)', 4);
