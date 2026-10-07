/**
 * DB singleton — uses Drizzle ORM's expo-sqlite driver.
 * Source of truth: blend event log. Projections: cached only.
 */
import { drizzle } from 'drizzle-orm/expo-sqlite';
import { openDatabaseSync } from 'expo-sqlite';
import { blends, bottles, blendEvents, predictions, tastings, catalogCache, meta } from './schema';

export const db = drizzle(openDatabaseSync('the-infinity.db'), {
  schema: { blends, bottles, blendEvents, predictions, tastings, catalogCache, meta },
});

export type Db = typeof db;
