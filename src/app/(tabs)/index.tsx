import { ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useState } from 'react';
import { useBlendStore } from '../../store/useBlendStore';
import { useEventStore } from '../../store/useEventStore';
import { formatAbv } from '../../domain/units';
import { abvBp } from '../../domain/abv';
import { PourEntry } from '../../components/PourEntry';
import { generateId } from '../../lib/id';
import type { BlendEvent } from '../../domain/types';

export default function BlendScreen() {
  const blend = useBlendStore((store) => store.activeBlend);
  const createActiveBlend = useBlendStore((store) => store.createActiveBlend);
  const { state } = useEventStore((store) => store.foldResult);
  const addEvent = useEventStore((store) => store.addEvent);
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const abv = state.volumeMl > 0 ? formatAbv(Math.round(state.units / state.volumeMl)) : '—';

  const handleCreate = async () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('Give your blend a name.');
      return;
    }
    const now = new Date().toISOString();
    await createActiveBlend({
      id: generateId(),
      name: trimmedName,
      vesselCapacityMl: null,
      startedAt: now,
      notes: null,
      archivedAt: null,
    });
    setError(null);
  };

  const handleEvent = async (event: BlendEvent) => {
    await addEvent(event);
  };

  if (!blend) {
    return (
      <View className="flex-1 bg-amber-950 px-6 justify-center">
        <Text className="text-amber-100 text-4xl font-bold mb-2">Your infinity bottle</Text>
        <Text className="text-amber-300 text-base mb-8">
          Start with a name, then build the blend one pour at a time.
        </Text>
        <TextInput
          className="bg-stone-900 text-stone-100 p-4 rounded-2xl border border-stone-700 mb-3"
          value={name}
          onChangeText={setName}
          placeholder="e.g. House Infinity"
          placeholderTextColor="#a8a29e"
          autoFocus
          returnKeyType="done"
          onSubmitEditing={handleCreate}
        />
        {error && <Text className="text-red-300 mb-3">{error}</Text>}
        <TouchableOpacity onPress={handleCreate} className="bg-amber-600 p-4 rounded-2xl items-center">
          <Text className="text-amber-950 font-bold text-base">Create blend</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-amber-950" contentContainerClassName="p-5 pb-10">
      <Text className="text-amber-300 text-xs uppercase tracking-widest mb-2">Active blend</Text>
      <Text className="text-amber-100 text-4xl font-bold mb-6">{blend.name}</Text>
      <View className="bg-stone-900/80 p-5 rounded-3xl border border-amber-900 mb-5">
        <Text className="text-stone-400 text-xs uppercase">In the bottle</Text>
        <Text className="text-amber-100 text-5xl font-bold mt-2">{state.volumeMl} ml</Text>
        <Text className="text-amber-300 text-lg mt-1">{abv} ABV</Text>
      </View>
      <PourEntry blendId={blend.id} currentAbvBp={abvBp(state)} onAddEvent={handleEvent} />
    </ScrollView>
  );
}
