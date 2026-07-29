-- Users
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Families
CREATE TABLE IF NOT EXISTS families (
  id TEXT PRIMARY KEY,
  owner_id TEXT REFERENCES users(id),
  name TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Family members
CREATE TABLE IF NOT EXISTS family_members (
  id TEXT PRIMARY KEY,
  family_id TEXT NOT NULL REFERENCES families(id),
  user_id TEXT NOT NULL REFERENCES users(id),
  role TEXT NOT NULL CHECK(role IN ('owner','editor','viewer')),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Children
CREATE TABLE IF NOT EXISTS children (
  id TEXT PRIMARY KEY,
  family_id TEXT NOT NULL REFERENCES families(id),
  name TEXT NOT NULL,
  birthday TEXT,
  avatar TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Organizations
CREATE TABLE IF NOT EXISTS organizations (
  id TEXT PRIMARY KEY,
  family_id TEXT NOT NULL REFERENCES families(id),
  name TEXT NOT NULL,
  teacher TEXT,
  phone TEXT,
  address TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Courses
CREATE TABLE IF NOT EXISTS courses (
  id TEXT PRIMARY KEY,
  family_id TEXT NOT NULL REFERENCES families(id),
  child_id TEXT NOT NULL REFERENCES children(id),
  organization_id TEXT REFERENCES organizations(id),
  name TEXT NOT NULL,
  lessons_per_session INTEGER NOT NULL DEFAULT 1,
  default_time_start TEXT,
  default_time_end TEXT,
  price REAL,
  expire_date TEXT,
  alert_threshold INTEGER NOT NULL DEFAULT 10,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Purchases
CREATE TABLE IF NOT EXISTS purchases (
  id TEXT PRIMARY KEY,
  family_id TEXT NOT NULL REFERENCES families(id),
  course_id TEXT NOT NULL REFERENCES courses(id),
  date TEXT NOT NULL,
  lessons INTEGER NOT NULL,
  gift_lessons INTEGER NOT NULL DEFAULT 0,
  amount REAL,
  payment_method TEXT,
  remark TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Lesson records
CREATE TABLE IF NOT EXISTS lesson_records (
  id TEXT PRIMARY KEY,
  family_id TEXT NOT NULL REFERENCES families(id),
  course_id TEXT NOT NULL REFERENCES courses(id),
  date TEXT NOT NULL,
  start_time TEXT,
  end_time TEXT,
  status TEXT NOT NULL CHECK(status IN ('normal','leave','teacher_cancel','makeup','transfer','absent','refund','adjust')),
  consume_lessons INTEGER NOT NULL DEFAULT 0,
  remark TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Attachments
CREATE TABLE IF NOT EXISTS attachments (
  id TEXT PRIMARY KEY,
  family_id TEXT NOT NULL REFERENCES families(id),
  target_type TEXT NOT NULL,
  target_id TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_children_family ON children(family_id);
CREATE INDEX IF NOT EXISTS idx_courses_child ON courses(child_id);
CREATE INDEX IF NOT EXISTS idx_courses_family ON courses(family_id);
CREATE INDEX IF NOT EXISTS idx_purchases_course ON purchases(course_id);
CREATE INDEX IF NOT EXISTS idx_lesson_records_course ON lesson_records(course_id);
