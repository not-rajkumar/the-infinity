import React from 'react';
import { Text, View } from 'react-native';
import { formatAbv, formatVolume } from '../domain/units';
import type { BlendState } from '../domain/types';

interface AbvDisplayProps {
  state: BlendState;
  capacityMl?: number | null;
}

export function AbvDisplay({ state, capacityMl }: AbvDisplayProps) {
  const currentAbv = state.volumeMl > 0 ? Math.round(state.units / state.volumeMl) : null;
  const fillPercent = capacityMl && capacityMl > 0 ? Math.min(100, Math.round((state.volumeMl / capacityMl) * 100)) : null;

  return (
    <View className="bg-amber-900/40 p-6 rounded-2xl border border-amber-700/50">
      <Text className="text-amber-200/80 text-sm uppercase tracking-wider mb-1">Current Strength</Text>
      <Text className="text-5xl font-extrabold text-amber-100 tracking-tight mb-2">
        {formatAbv(currentAbv)}
      </Text>
      <View className="flex-row justify-between items-center mt-2">
        <Text className="text-amber-300 text-lg font-medium">Volume: {formatVolume(state.volumeMl)}</Text>
        {fillPercent !== null && (
          <Text className="text-amber-400/90 text-sm">{fillPercent}% of {formatVolume(capacityMl!)} vessel</Text>
        )}
      </View>
    </View>
  );
}
