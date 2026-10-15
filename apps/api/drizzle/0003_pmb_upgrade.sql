-- Migration: PMB Upgrade & Multi-Panel Integration
-- 1. Alter pmb_form_responses
ALTER TABLE pmb_form_responses
  ADD COLUMN IF NOT EXISTS referral_category TEXT,
  ADD COLUMN IF NOT EXISTS referral_institution_name TEXT,
  ADD COLUMN IF NOT EXISTS referral_contact_name TEXT,
  ADD COLUMN IF NOT EXISTS referral_contact_phone TEXT,
  ADD COLUMN IF NOT EXISTS emergency_contact_name TEXT,
  ADD COLUMN IF NOT EXISTS emergency_contact_phone TEXT,
  ADD COLUMN IF NOT EXISTS emergency_contact_relation TEXT,
  ADD COLUMN IF NOT EXISTS friend_contacts JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS rejected_tabs JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS color_blind_test TEXT,
  ADD COLUMN IF NOT EXISTS has_tattoo BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS has_piercing_non_standard BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS has_major_surgery_history BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS has_chronic_disease BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS mcu_consent_agreed BOOLEAN DEFAULT false;

-- 2. Alter pmb_data
ALTER TABLE pmb_data
  ADD COLUMN IF NOT EXISTS referral_category TEXT,
  ADD COLUMN IF NOT EXISTS referral_institution_name TEXT,
  ADD COLUMN IF NOT EXISTS referral_contact_name TEXT,
  ADD COLUMN IF NOT EXISTS referral_contact_phone TEXT;

-- 3. Alter students
ALTER TABLE students
  ADD COLUMN IF NOT EXISTS emergency_contact_name TEXT,
  ADD COLUMN IF NOT EXISTS emergency_contact_phone TEXT,
  ADD COLUMN IF NOT EXISTS emergency_contact_relation TEXT;

-- 4. Alter fee_share_recipients
ALTER TABLE fee_share_recipients
  ADD COLUMN IF NOT EXISTS nama_institusi TEXT;

-- 5. Create student_friend_contacts
CREATE TABLE IF NOT EXISTS student_friend_contacts (
  id SERIAL PRIMARY KEY,
  student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  school_or_relation TEXT,
  follow_up_status TEXT DEFAULT 'Belum Dihubungi',
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_student_friend_contacts_student_id ON student_friend_contacts(student_id);

-- 6. Create program_fee_defaults
CREATE TABLE IF NOT EXISTS program_fee_defaults (
  id SERIAL PRIMARY KEY,
  sub_program TEXT NOT NULL UNIQUE,
  default_total_biaya INTEGER DEFAULT 0,
  default_registrasi INTEGER DEFAULT 0,
  default_per_semester INTEGER DEFAULT 0,
  default_interview INTEGER DEFAULT 0,
  default_keberangkatan INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_program_fee_defaults_sub_program ON program_fee_defaults(sub_program);

-- Seed program_fee_defaults if not exists
INSERT INTO program_fee_defaults (sub_program, default_total_biaya, default_registrasi, default_per_semester, default_interview, default_keberangkatan)
VALUES 
  ('Indonesia-Reguler', 18000000, 3000000, 2500000, 0, 0),
  ('Malaysia-Hospitality', 25000000, 5000000, 3500000, 2000000, 5000000),
  ('Taiwan-Hospitality', 35000000, 5000000, 4500000, 3000000, 8000000),
  ('Timur tengah-Barista', 28000000, 5000000, 4000000, 2500000, 6000000)
ON CONFLICT (sub_program) DO NOTHING;
