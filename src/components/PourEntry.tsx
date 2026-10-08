import React, { useState } from 'react';
import { Text, View, TextInput, TouchableOpacity } from 'react-native';
import { POUR_PRESETS_ML, parseVolumeMl, parseAbvBp } from '../domain/units';
import { generateId } from '../lib/id';
import type { BlendEvent } from '../domain/types';

interface PourEntryProps {
  blendId: string;
  currentAbvBp: number | null;
  onAddEvent: (event: BlendEvent) => Promise<void>;
}

export function PourEntry({ blendId, onAddEvent }: PourEntryProps) {
  const [volumeInput, setVolumeInput] = useState('50');
  const [abvInput, setAbvInput] = useState('46');
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleAdd = async (kind: 'ADD' | 'REMOVE') => {
    setError(null);
    const volumeMl = parseVolumeMl(volumeInput);
    if (volumeMl === null || volumeMl <= 0) {
      setError('Invalid volume');
      return;
    }

    let abvBp: number | null = kind === 'REMOVE' ? currentAbvBp : null;
    if (kind === 'ADD') {
      abvBp = parseAbvBp(abvInput);
      if (abvBp === null) {
        setError('Invalid ABV');
        return;
      }
    }

    const now = new Date().toISOString();
    const event: BlendEvent = {
      id: generateId(),
      blendId,
      kind,
      volumeMl,
      abvBp,
      sourceBottleId: null,
      note: note.trim() || null,
      occurredAt: now,
      createdAt: now,
      isApproximate: false,
    };

    try {
      await onAddEvent(event);
      setNote('');
    } catch (cause: unknown) {
      setError(cause instanceof Error ? cause.message : 'Could not save event');
    }
  };

  return (
    <View className="bg-stone-900 p-5 rounded-2xl border border-stone-800">
      <Text className="text-stone-200 text-lg font-bold mb-4">Log Pour / Addition</Text>

      {error && <Text className="text-red-400 mb-3 text-sm">{error}</Text>}

      <View className="mb-4">
        <Text className="text-stone-400 text-xs uppercase mb-1">Volume (ml or oz)</Text>
        <TextInput
          className="bg-stone-800 text-stone-100 p-3 rounded-xl border border-stone-700"
          value={volumeInput}
          onChangeText={setVolumeInput}
          placeholder="e.g. 50ml or 1.5oz"
          placeholderTextColor="#78716c"
        />
      </View>

      <View className="mb-4 flex-row gap-2">
        {Object.entries(POUR_PRESETS_ML).map(([name, ml]) => (
          <TouchableOpacity
            key={name}
            onPress={() => setVolumeInput(String(ml))}
            className="bg-stone-800 px-3 py-1.5 rounded-lg border border-stone-700"
          >
            <Text className="text-stone-300 text-xs capitalize">{name} ({ml}ml)</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View className="mb-4">
        <Text className="text-stone-400 text-xs uppercase mb-1">ABV % (for Additions)</Text>
        <TextInput
          className="bg-stone-800 text-stone-100 p-3 rounded-xl border border-stone-700"
          value={abvInput}
          onChangeText={setAbvInput}
          placeholder="e.g. 46%"
          placeholderTextColor="#78716c"
        />
      </View>

      <View className="mb-4">
        <Text className="text-stone-400 text-xs uppercase mb-1">Note (Optional)</Text>
        <TextInput
          className="bg-stone-800 text-stone-100 p-3 rounded-xl border border-stone-700"
          value={note}
          onChangeText={setNote}
          placeholder="Whiskey name, tasting notes..."
          placeholderTextColor="#78716c"
        />
      </View>

      <View className="flex-row gap-3">
        <TouchableOpacity
          onPress={() => handleAdd('ADD')}
          className="flex-1 bg-amber-700 p-3.5 rounded-xl items-center"
        >
          <Text className="text-amber-100 font-bold">Pour In (+)</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => handleAdd('REMOVE')}
          className="flex-1 bg-stone-700 p-3.5 rounded-xl items-center"
        >
          <Text className="text-stone-200 font-bold">Take Out (-)</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
