import { Text, View } from 'react-native';
import { VictoryAxis, VictoryChart, VictoryLine } from 'victory-native';
import type { BlendEvent } from '../domain/types';
import type { FoldProjection } from '../domain/fold';
import { formatAbv } from '../domain/units';

interface AbvDriftChartProps {
  events: readonly BlendEvent[];
  projections: readonly FoldProjection[];
}

export function AbvDriftChart({ events, projections }: AbvDriftChartProps) {
  const points = projections
    .map((projection) => ({
      projection,
      event: events.find((event) => event.id === projection.eventId),
    }))
    .filter((point) => point.projection.abvBp !== null);

  if (points.length < 2) return null;
  const data = points.map(({ projection }, index) => ({ x: index + 1, y: projection.abvBp! }));
  const minimum = Math.min(...data.map((point) => point.y));
  const maximum = Math.max(...data.map((point) => point.y));

  return (
    <View className="bg-stone-900 p-5 rounded-2xl border border-stone-800 mb-5">
      <Text className="text-stone-100 text-lg font-bold">ABV drift</Text>
      <Text className="text-stone-500 text-xs mb-4">Derived from the event log projections</Text>
      <VictoryChart height={190} padding={{ top: 10, bottom: 35, left: 55, right: 20 }}>
        <VictoryAxis
          dependentAxis
          tickFormat={(value) => formatAbv(value)}
          domain={{ y: [Math.max(0, minimum - 100), maximum + 100] }}
          style={{
            axis: { stroke: '#57534e' },
            grid: { stroke: '#292524' },
            tickLabels: { fill: '#a8a29e', fontSize: 10 },
          }}
        />
        <VictoryAxis
          tickFormat={() => ''}
          style={{ axis: { stroke: '#57534e' }, ticks: { stroke: '#57534e' } }}
        />
        <VictoryLine
          data={data}
          interpolation="monotoneX"
          style={{ data: { stroke: '#d97706', strokeWidth: 3 } }}
        />
      </VictoryChart>
      <Text className="text-stone-500 text-xs">
        {formatAbv(minimum)}–{formatAbv(maximum)} across {points.length} projections
      </Text>
    </View>
  );
}
