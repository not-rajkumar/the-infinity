import { Stack } from 'expo-router';
import { Text } from 'react-native';
import { useMigrations } from 'drizzle-orm/expo-sqlite/migrator';
import { db } from '../src/db';
import migrations from '../src/db/migrations';
import { loadPersistence } from '../src/db/persistence';
import { useBlendStore } from '../src/store/useBlendStore';
import { useEventStore } from '../src/store/useEventStore';
import { useBottleStore } from '../src/store/useBottleStore';
import { useEffect, useState } from 'react';

export default function RootLayout() {
  const { success, error } = useMigrations(db, migrations);
  const [hydrationError, setHydrationError] = useState<Error | null>(null);
  const hydrateBlend = useBlendStore((store) => store.hydrate);
  const setEvents = useEventStore((store) => store.setEvents);
  const hydrateBottles = useBottleStore((store) => store.hydrate);
  const hydrated = useBlendStore((store) => store.hydrated);

  useEffect(() => {
    if (!success || hydrated) return;
    loadPersistence()
      .then((snapshot) => {
        hydrateBlend(snapshot);
        hydrateBottles(snapshot);
        const activeBlendId = snapshot.blends[0]?.id;
        setEvents(activeBlendId ? snapshot.events.filter((event) => event.blendId === activeBlendId) : []);
      })
      .catch((cause: unknown) => {
        setHydrationError(cause instanceof Error ? cause : new Error(String(cause)));
      });
  }, [hydrateBlend, hydrateBottles, hydrated, setEvents, success]);

  if (error || hydrationError) {
    return <Text>Database startup failed: {(error ?? hydrationError)?.message}</Text>;
  }

  if (!success || !hydrated) {
    return null;
  }

  return <Stack />;
}
