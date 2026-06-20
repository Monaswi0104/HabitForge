// src/database/schema.ts
// HabitForge — SQLite Schema (3NF)
// ─────────────────────────────────────────────────────────────────────────────
// Tables:
//   profiles      → app users / profiles
//   categories    → habit categories (Health, Fitness, Study, etc.)
//   habits        → individual habits, linked to a profile and category
//   habit_days    → days a habit runs (replaces JSON array — fixes 1NF)
//   completions   → log of each time a habit was completed
// ─────────────────────────────────────────────────────────────────────────────

export const CREATE_TABLES = `

  -- ── Profiles ──────────────────────────────────────────────────────────────
  -- Each row is one user/profile on the device.
  -- Multiple profiles are supported (family use, multi-user).
  CREATE TABLE IF NOT EXISTS profiles (
    id          TEXT PRIMARY KEY,           -- UUID v4
    name        TEXT NOT NULL,              -- Display name e.g. "Monaswi"
    avatar      TEXT,                       -- Emoji or image URI
    color       TEXT,                       -- Hex accent color e.g. "#6366F1"
    pin         TEXT,                       -- 4-digit PIN lock
    xp          INTEGER NOT NULL DEFAULT 0, -- Total XP earned
    level       INTEGER NOT NULL DEFAULT 1, -- Current level
    created_at  TEXT NOT NULL               -- ISO 8601 e.g. "2024-06-17T10:00:00Z"
  );

  -- ── Categories ────────────────────────────────────────────────────────────
  -- Predefined + user-created habit categories.
  -- Extracted from habits table to satisfy 3NF.
  -- Seeded on first launch with defaults (Health, Fitness, Study, etc.)
  CREATE TABLE IF NOT EXISTS categories (
    id          TEXT PRIMARY KEY,           -- UUID v4
    name        TEXT NOT NULL UNIQUE,       -- e.g. "Health", "Fitness", "Study"
    icon        TEXT,                       -- Lucide icon name e.g. "heart"
    color       TEXT                        -- Hex color for this category
  );

  -- ── Habits ────────────────────────────────────────────────────────────────
  -- Core habit definition. Belongs to one profile and one category.
  -- 'days' JSON array removed — see habit_days table below.
  CREATE TABLE IF NOT EXISTS habits (
    id            TEXT PRIMARY KEY,         -- UUID v4
    profile_id    TEXT NOT NULL,            -- FK → profiles.id
    category_id   TEXT,                     -- FK → categories.id (nullable)
    title         TEXT NOT NULL,            -- e.g. "Drink 8 glasses of water"
    description   TEXT,                     -- Optional longer description
    frequency     TEXT NOT NULL             -- 'daily' | 'weekly' | 'custom'
                  CHECK (frequency IN ('daily', 'weekly', 'custom')),
    color         TEXT,                     -- Per-habit accent color
    icon          TEXT,                     -- Lucide icon name
    reminder_time TEXT,                     -- "HH:MM" e.g. "08:00" (nullable = no reminder)
    target_count  INTEGER NOT NULL DEFAULT 1, -- Number of times/mins to complete
    target_unit   TEXT,                     -- Optional unit string (e.g. 'times', 'mins', 'ml')
    is_archived   INTEGER NOT NULL          -- 0 = active, 1 = archived
                  DEFAULT 0
                  CHECK (is_archived IN (0, 1)),
    created_at    TEXT NOT NULL,            -- ISO 8601
    FOREIGN KEY (profile_id)  REFERENCES profiles(id)  ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
  );

  -- ── Habit Days ────────────────────────────────────────────────────────────
  -- Stores which days of the week a habit is scheduled.
  -- Replaces the old JSON 'days' column in habits — fixes 1NF violation.
  -- Only used when frequency = 'weekly' or 'custom'.
  -- For 'daily' habits, no rows needed here.
  --
  -- Example: A habit on Mon/Wed/Fri → 3 rows with day = 'Mon', 'Wed', 'Fri'
  CREATE TABLE IF NOT EXISTS habit_days (
    id          TEXT PRIMARY KEY,           -- UUID v4
    habit_id    TEXT NOT NULL,             -- FK → habits.id
    day         TEXT NOT NULL              -- 'Mon'|'Tue'|'Wed'|'Thu'|'Fri'|'Sat'|'Sun'
                CHECK (day IN ('Mon','Tue','Wed','Thu','Fri','Sat','Sun')),
    FOREIGN KEY (habit_id) REFERENCES habits(id) ON DELETE CASCADE,
    UNIQUE (habit_id, day)                 -- Prevent duplicate day entries per habit
  );

  -- ── Completions ───────────────────────────────────────────────────────────
  -- Logs every time a habit was marked as complete.
  -- One row per habit per date (enforced by UNIQUE constraint).
  -- This table drives all streak and analytics calculations.
  CREATE TABLE IF NOT EXISTS completions (
    id           TEXT PRIMARY KEY,          -- UUID v4
    habit_id     TEXT NOT NULL,            -- FK → habits.id
    date         TEXT NOT NULL,            -- "YYYY-MM-DD" e.g. "2024-06-17"
    completed_at TEXT NOT NULL,            -- ISO 8601 full timestamp
    progress_value INTEGER NOT NULL DEFAULT 1, -- Amount completed towards target
    note         TEXT,                     -- Optional completion note
    FOREIGN KEY (habit_id) REFERENCES habits(id) ON DELETE CASCADE,
    UNIQUE (habit_id, date)                -- One completion per habit per day
  );
`;

// ─────────────────────────────────────────────────────────────────────────────
// Default category seeds — inserted on first launch
// ─────────────────────────────────────────────────────────────────────────────
export const SEED_CATEGORIES = `
  INSERT OR IGNORE INTO categories (id, name, icon, color) VALUES
    ('cat-1', 'Health',     'heart',        '#EF4444'),
    ('cat-2', 'Fitness',    'dumbbell',     '#F97316'),
    ('cat-3', 'Study',      'book-open',    '#6366F1'),
    ('cat-4', 'Mindfulness','brain',        '#8B5CF6'),
    ('cat-5', 'Finance',    'piggy-bank',   '#22C55E'),
    ('cat-6', 'Social',     'users',        '#3B82F6'),
    ('cat-7', 'Creativity', 'palette',      '#EC4899'),
    ('cat-8', 'Other',      'circle',       '#6B7280');
`;

// ─────────────────────────────────────────────────────────────────────────────
// Drop all tables (for dev reset only — never call in production)
// ─────────────────────────────────────────────────────────────────────────────
export const DROP_TABLES = `
  DROP TABLE IF EXISTS completions;
  DROP TABLE IF EXISTS habit_days;
  DROP TABLE IF EXISTS habits;
  DROP TABLE IF EXISTS categories;
  DROP TABLE IF EXISTS profiles;
`;
