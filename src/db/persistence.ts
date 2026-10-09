import { asc, eq, isNull } from 'drizzle-orm';
import { db } from './index';
import { blendEvents, blends, bottles } from './schema';
import type { Blend, BlendEvent, Bottle, EventKind } from '../domain/types';

function toBlend(row: typeof blends.$inferSelect): Blend {
  return {
    id: row.id,
    name: row.name,
    vesselCapacityMl: row.vesselCapacityMl,
    startedAt: row.startedAt,
    notes: row.notes,
    archivedAt: row.archivedAt,
  };
}

function toEvent(row: typeof blendEvents.$inferSelect): BlendEvent {
  return {
    id: row.id,
    blendId: row.blendId,
    kind: row.kind as EventKind,
    volumeMl: row.volumeMl,
    abvBp: row.abvBp,
    sourceBottleId: row.sourceBottleId,
    note: row.note,
    occurredAt: row.occurredAt,
    createdAt: row.createdAt,
    isApproximate: row.isApproximate,
  };
}

function toBottle(row: typeof bottles.$inferSelect): Bottle {
  return {
    id: row.id,
    blendId: row.blendId,
    name: row.name,
    distillery: row.distillery,
    category: row.category,
    region: row.region,
    country: row.country,
    abvBp: row.abvBp,
    volumeMl: row.volumeMl,
    remainingVolumeMl: row.remainingVolumeMl,
    barcode: row.barcode,
    photoUri: row.photoUri,
    notes: row.notes,
    source: row.source as Bottle['source'],
    createdAt: row.createdAt,
  };
}

export interface PersistenceSnapshot {
  blends: Blend[];
  events: BlendEvent[];
  bottles: Bottle[];
}

export async function loadPersistence(): Promise<PersistenceSnapshot> {
  const [blendRows, eventRows, bottleRows] = await Promise.all([
    db.select().from(blends).where(isNull(blends.archivedAt)).orderBy(asc(blends.startedAt)),
    db.select().from(blendEvents).orderBy(asc(blendEvents.occurredAt), asc(blendEvents.createdAt)),
    db.select().from(bottles).orderBy(asc(bottles.createdAt)),
  ]);

  return {
    blends: blendRows.map(toBlend),
    events: eventRows.map(toEvent),
    bottles: bottleRows.map(toBottle),
  };
}

export async function createBlend(blend: Blend): Promise<void> {
  await db.insert(blends).values(blend).run();
}

export async function updateBlend(blend: Blend): Promise<void> {
  await db.update(blends).set(blend).where(eq(blends.id, blend.id)).run();
}

export async function archiveBlend(id: string, archivedAt = new Date().toISOString()): Promise<void> {
  await db.update(blends).set({ archivedAt }).where(eq(blends.id, id)).run();
}

export async function appendBlendEvent(event: BlendEvent): Promise<void> {
  await db.insert(blendEvents).values(event).run();
}

export async function createBottle(bottle: Bottle): Promise<void> {
  await db.insert(bottles).values(bottle).run();
}

export async function updateBottle(bottle: Bottle): Promise<void> {
  await db.update(bottles).set(bottle).where(eq(bottles.id, bottle.id)).run();
}

export async function deleteBottle(id: string): Promise<void> {
  await db.delete(bottles).where(eq(bottles.id, id)).run();
}

export async function consumeBottleVolume(id: string, volumeMl: number): Promise<Bottle | null> {
  const row = await db.select().from(bottles).where(eq(bottles.id, id)).get();
  if (!row || row.remainingVolumeMl === null) return row ? toBottle(row) : null;
  const remainingVolumeMl = Math.max(0, row.remainingVolumeMl - volumeMl);
  await db.update(bottles).set({ remainingVolumeMl }).where(eq(bottles.id, id)).run();
  return toBottle({ ...row, remainingVolumeMl });
}

export async function loadBlendEvents(blendId: string): Promise<BlendEvent[]> {
  const rows = await db
    .select()
    .from(blendEvents)
    .where(eq(blendEvents.blendId, blendId))
    .orderBy(asc(blendEvents.occurredAt), asc(blendEvents.createdAt));
  return rows.map(toEvent);
}
