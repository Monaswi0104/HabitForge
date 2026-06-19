// src/database/db.ts
// HabitForge — SQLite Database Initialization & Query Helpers
// ─────────────────────────────────────────────────────────────────────────────

import SQLite, { SQLiteDatabase } from 'react-native-sqlite-storage';
import { CREATE_TABLES, SEED_CATEGORIES, DROP_TABLES } from './schema';

SQLite.enablePromise(true);

let db: SQLiteDatabase | null = null;

// Bump this number to force a full database wipe on next app launch.
// This ensures stale test data is cleared and the schema starts fresh.
const DB_VERSION = 2;

// ─────────────────────────────────────────────────────────────────────────────
// Init — call once in App.tsx on startup
// ─────────────────────────────────────────────────────────────────────────────
export const initDB = async (): Promise<void> => {
  try {
    db = await SQLite.openDatabase({ name: 'habitforge.db', location: 'default' });

    // Enable foreign key enforcement (off by default in SQLite)
    await db.executeSql('PRAGMA foreign_keys = ON;');

    // Check current DB version
    const [versionResult] = await db.executeSql('PRAGMA user_version;');
    const currentVersion = versionResult.rows.item(0).user_version;

    // If schema version is outdated, drop everything and start fresh
    if (currentVersion < DB_VERSION) {
      console.log(`[HabitForge DB] Version mismatch (${currentVersion} → ${DB_VERSION}). Wiping database...`);
      const drops = DROP_TABLES.split(';').map(s => s.trim()).filter(Boolean);
      for (const stmt of drops) {
        await db.executeSql(stmt + ';');
      }
    }

    // Create all tables
    const statements = CREATE_TABLES
      .split(';')
      .map(s => s.trim())
      .filter(Boolean);

    for (const stmt of statements) {
      await db.executeSql(stmt + ';');
    }

    // Migration: Add pin column to profiles if it doesn't exist
    try {
      await db.executeSql('ALTER TABLE profiles ADD COLUMN pin TEXT;');
    } catch (e: any) {
      // Ignore if column already exists
      if (!e.message.includes('duplicate column name')) {
        console.warn('Migration warning:', e);
      }
    }

    // Seed default categories
    await db.executeSql(SEED_CATEGORIES);

    // Update stored version
    await db.executeSql(`PRAGMA user_version = ${DB_VERSION};`);

    console.log('[HabitForge DB] Initialized successfully (v' + DB_VERSION + ')');
  } catch (error) {
    console.error('[HabitForge DB] Init failed:', error);
    throw error;
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Get DB instance (throws if not initialized)
// ─────────────────────────────────────────────────────────────────────────────
export const getDB = (): SQLiteDatabase => {
  if (!db) throw new Error('Database not initialized. Call initDB() first.');
  return db;
};

// ─────────────────────────────────────────────────────────────────────────────
// Generic execute helper — returns rows as typed array
// ─────────────────────────────────────────────────────────────────────────────
export const executeQuery = async <T>(
  sql: string,
  params: (string | number | null)[] = []
): Promise<T[]> => {
  const database = getDB();
  const [results] = await database.executeSql(sql, params);
  const rows: T[] = [];
  for (let i = 0; i < results.rows.length; i++) {
    rows.push(results.rows.item(i));
  }
  return rows;
};

// ─────────────────────────────────────────────────────────────────────────────
// Generic insert/update/delete helper — returns rowsAffected
// ─────────────────────────────────────────────────────────────────────────────
export const executeMutation = async (
  sql: string,
  params: (string | number | null)[] = []
): Promise<number> => {
  const database = getDB();
  const [results] = await database.executeSql(sql, params);
  return results.rowsAffected;
};

// ─────────────────────────────────────────────────────────────────────────────
// Dev only — reset entire database
export const loadMockData = async (): Promise<boolean> => {
  if (!__DEV__) return false;
  try {
    const mockData = require('./mockData.json');
    if (!mockData || !mockData.profiles) return false;

    for (const p of mockData.profiles) {
      await executeMutation(
        `INSERT INTO profiles (id, name, avatar, color, pin, created_at) VALUES (?, ?, ?, ?, ?, ?);`,
        [p.id, p.name, p.avatar || null, p.color || null, p.pin || null, p.created_at]
      );
    }
    for (const h of mockData.habits) {
      await executeMutation(
        `INSERT INTO habits (id, profile_id, category_id, title, description, frequency, color, icon, is_archived, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
        [h.id, h.profile_id, h.category_id, h.title, h.description, h.frequency, h.color, h.icon, h.is_archived, h.created_at]
      );
    }
    for (const c of mockData.completions) {
      await executeMutation(
        `INSERT OR IGNORE INTO completions (id, habit_id, date, completed_at, note) VALUES (?, ?, ?, ?, ?);`,
        [c.id, c.habit_id, c.date, c.completed_at, c.note || null]
      );
    }
    return true;
  } catch (err) {
    console.error('Failed to load mockData.json', err);
    return false;
  }
};
export const resetDB = async (): Promise<void> => {
  if (__DEV__) {
    const database = getDB();
    const drops = DROP_TABLES.split(';').map(s => s.trim()).filter(Boolean);
    for (const stmt of drops) {
      await database.executeSql(stmt + ';');
    }
    await initDB();
    console.log('[HabitForge DB] Reset complete');
  }
};
