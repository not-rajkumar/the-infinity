import { Text, View } from 'react-native';
import { useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { loadPersistence } from '../../db/persistence';

export default function CatalogScreen() {
  const [count, setCount] = useState(0);
  useFocusEffect(() => {
    let active = true;
    loadPersistence().then((snapshot) => {
      if (active) setCount(snapshot.bottles.length);
    });
    return () => {
      active = false;
    };
  });

  return (
    <View className="flex-1 bg-zinc-950 items-center justify-center">
      <Text className="text-zinc-100 text-2xl font-bold">Catalog</Text>
      <Text className="text-zinc-300">{count} bottle{count === 1 ? '' : 's'}</Text>
    </View>
  );
}
