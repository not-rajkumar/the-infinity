import { ScrollView, Text, View } from 'react-native';
import { useEventStore } from '../../store/useEventStore';
import { formatAbv, formatVolume } from '../../domain/units';

export default function LogScreen() {
  const events = useEventStore((store) => store.events);
  return (
    <ScrollView className="flex-1 bg-stone-950" contentContainerClassName="p-5">
      <Text className="text-stone-100 text-3xl font-bold mb-1">Timeline</Text>
      <Text className="text-stone-400 mb-5">{events.length} event{events.length === 1 ? '' : 's'}</Text>
      {events.length === 0 ? (
        <Text className="text-stone-500">Your pour history will appear here.</Text>
      ) : (
        events.map((event) => (
          <View key={event.id} className="bg-stone-900 p-4 rounded-2xl border border-stone-800 mb-3">
            <View className="flex-row justify-between">
              <Text className={event.kind === 'ADD' ? 'text-amber-400 font-bold' : 'text-stone-300 font-bold'}>
                {event.kind === 'ADD' ? 'POUR IN' : 'TAKE OUT'}
              </Text>
              <Text className="text-stone-200 font-bold">{formatVolume(event.volumeMl)}</Text>
            </View>
            {event.abvBp !== null && <Text className="text-stone-400 mt-2">{formatAbv(event.abvBp)} projection</Text>}
            {event.note && <Text className="text-stone-300 mt-1">{event.note}</Text>}
            <Text className="text-stone-600 text-xs mt-3">{new Date(event.occurredAt).toLocaleString()}</Text>
          </View>
        ))
      )}
    </ScrollView>
  );
}
