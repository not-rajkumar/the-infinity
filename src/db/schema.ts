/**
 * Drizzle SQLite schema — source of truth is the event log; stored projections
 * are denormalized caching only. Matches CLAUDE.md data model.
 */
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const blends = sqliteTable('blends', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  vesselCapacityMl: integer('vessel_capacity_ml'),
  startedAt: text('started_at').notNull(),
  notes: text('notes'),
  archivedAt: text('archived_at'),
});

export const bottles = sqliteTable('bottles', {
  id: text('id').primaryKey(),
  blendId: text('blend_id').notNull(),
  name: text('name').notNull(),
  distillery: text('distillery'),
  category: text('category'),
  region: text('region'),
  country: text('country'),
  abvBp: integer('abv_bp'),
  volumeMl: integer('volume_ml'),
  remainingVolumeMl: integer('remaining_volume_ml'),
  barcode: text('barcode'),
  photoUri: text('photo_uri'),
  notes: text('notes'),
  source: text('source').notNull(), // 'manual' | 'catalog' | 'barcode'
  createdAt: text('created_at').notNull(),
});

export const blendEvents = sqliteTable('blend_events', {
  id: text('id').primaryKey(),
  blendId: text('blend_id').notNull(),
  kind: text('kind').notNull(), // 'ADD' | 'REMOVE'
  volumeMl: integer('volume_ml').notNull(),
  abvBp: integer('abv_bp'), // projection, not source
  sourceBottleId: text('source_bottle_id'),
  note: text('note'),
  occurredAt: text('occurred_at').notNull(),
  createdAt: text('created_at').notNull(),
  isApproximate: integer('is_approximate', { mode: 'boolean' }).notNull().default(false),
});

export const predictions = sqliteTable('predictions', {
  blendId: text('blend_id').primaryKey(),
  flavorJson: text('flavor_json').notNull(),
  cachedAt: text('cached_at').notNull(),
});

export const tastings = sqliteTable('tastings', {
  id: text('id').primaryKey(),
  blendId: text('blend_id').notNull(),
  note: text('note'),
  rating: integer('rating'),
  tastedAt: text('tasted_at').notNull(),
});

export const catalogCache = sqliteTable('catalog_cache', {
  barcode: text('barcode').primaryKey(),
  dataJson: text('data_json').notNull(),
  cachedAt: text('cached_at').notNull(),
});

export const meta = sqliteTable('meta', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
});
