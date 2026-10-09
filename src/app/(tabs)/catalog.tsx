import { useState } from 'react';
import { Alert, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useBlendStore } from '../../store/useBlendStore';
import { useBottleStore } from '../../store/useBottleStore';
import { parseAbvBp, parseVolumeMl } from '../../domain/units';
import { parseBarcode } from '../../barcode/scan';
import { generateId } from '../../lib/id';
import type { Bottle } from '../../domain/types';

interface BottleForm {
  name: string;
  distillery: string;
  category: string;
  region: string;
  country: string;
  abv: string;
  volume: string;
  barcode: string;
  notes: string;
}

const emptyForm: BottleForm = {
  name: '',
  distillery: '',
  category: '',
  region: '',
  country: '',
  abv: '',
  volume: '',
  barcode: '',
  notes: '',
};

function formFromBottle(bottle: Bottle): BottleForm {
  return {
    name: bottle.name,
    distillery: bottle.distillery ?? '',
    category: bottle.category ?? '',
    region: bottle.region ?? '',
    country: bottle.country ?? '',
    abv: bottle.abvBp === null ? '' : String(bottle.abvBp / 100),
    volume: bottle.volumeMl === null ? '' : String(bottle.volumeMl),
    barcode: bottle.barcode ?? '',
    notes: bottle.notes ?? '',
  };
}

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'numeric';
}) {
  return (
    <View className="mb-3">
      <Text className="text-stone-400 text-xs uppercase mb-1">{label}</Text>
      <TextInput
        className="bg-stone-800 text-stone-100 p-3 rounded-xl border border-stone-700"
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#78716c"
        keyboardType={keyboardType}
      />
    </View>
  );
}

export default function CatalogScreen() {
  const activeBlend = useBlendStore((store) => store.activeBlend);
  const bottles = useBottleStore((store) => store.bottles);
  const addBottle = useBottleStore((store) => store.addBottle);
  const editBottle = useBottleStore((store) => store.editBottle);
  const removeBottle = useBottleStore((store) => store.removeBottle);
  const [form, setForm] = useState<BottleForm>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const activeBottles = activeBlend
    ? bottles.filter((bottle) => bottle.blendId === activeBlend.id)
    : [];
  const setField = (key: keyof BottleForm, value: string) => setForm((current) => ({ ...current, [key]: value }));

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setError(null);
  };

  const saveBottle = async () => {
    setError(null);
    if (!activeBlend) {
      setError('Create a blend before adding bottles.');
      return;
    }
    const name = form.name.trim();
    if (!name) {
      setError('Bottle name is required.');
      return;
    }
    const abvBp = form.abv.trim() ? parseAbvBp(form.abv) : null;
    if (form.abv.trim() && abvBp === null) {
      setError('Enter a valid ABV, such as 46%.');
      return;
    }
    const volumeMl = form.volume.trim() ? parseVolumeMl(form.volume) : null;
    if (form.volume.trim() && volumeMl === null) {
      setError('Enter a valid bottle volume, such as 750ml.');
      return;
    }
    const barcode = form.barcode.trim() ? parseBarcode(form.barcode) : null;
    if (form.barcode.trim() && barcode === null) {
      setError('Enter an 8–13 digit barcode.');
      return;
    }

    const current = editingId ? bottles.find((bottle) => bottle.id === editingId) : null;
    const bottle: Bottle = {
      id: current?.id ?? generateId(),
      blendId: activeBlend.id,
      name,
      distillery: form.distillery.trim() || null,
      category: form.category.trim() || null,
      region: form.region.trim() || null,
      country: form.country.trim() || null,
      abvBp,
      volumeMl,
      remainingVolumeMl: current?.remainingVolumeMl ?? volumeMl,
      barcode,
      photoUri: current?.photoUri ?? null,
      notes: form.notes.trim() || null,
      source: current?.source ?? 'manual',
      createdAt: current?.createdAt ?? new Date().toISOString(),
    };

    try {
      if (current) await editBottle(bottle);
      else await addBottle(bottle);
      resetForm();
    } catch (cause: unknown) {
      setError(cause instanceof Error ? cause.message : 'Could not save bottle.');
    }
  };

  const confirmDelete = (bottle: Bottle) => {
    Alert.alert('Delete bottle?', `Remove ${bottle.name} from this catalog?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          removeBottle(bottle.id).catch((cause: unknown) => {
            setError(cause instanceof Error ? cause.message : 'Could not delete bottle.');
          });
        },
      },
    ]);
  };

  return (
    <ScrollView className="flex-1 bg-stone-950" contentContainerClassName="p-5 pb-10">
      <Text className="text-stone-100 text-3xl font-bold mb-1">Bottle catalog</Text>
      <Text className="text-stone-400 mb-5">
        {activeBottles.length} bottle{activeBottles.length === 1 ? '' : 's'} in {activeBlend?.name ?? 'your active blend'}
      </Text>

      {!activeBlend && (
        <View className="bg-amber-950 border border-amber-800 p-4 rounded-2xl mb-5">
          <Text className="text-amber-200">Create an active blend on the Blend tab to start a bottle catalog.</Text>
        </View>
      )}

      <View className="bg-stone-900 p-4 rounded-2xl border border-stone-800 mb-5">
        <Text className="text-stone-100 text-lg font-bold mb-4">{editingId ? 'Edit bottle' : 'Add bottle'}</Text>
        {error && <Text className="text-red-400 mb-3">{error}</Text>}
        <Field label="Name *" value={form.name} onChangeText={(value) => setField('name', value)} placeholder="e.g. Single Barrel Bourbon" />
        <Field label="Distillery" value={form.distillery} onChangeText={(value) => setField('distillery', value)} />
        <View className="flex-row gap-2">
          <View className="flex-1"><Field label="Category" value={form.category} onChangeText={(value) => setField('category', value)} placeholder="Bourbon" /></View>
          <View className="flex-1"><Field label="Region" value={form.region} onChangeText={(value) => setField('region', value)} placeholder="Kentucky" /></View>
        </View>
        <View className="flex-row gap-2">
          <View className="flex-1"><Field label="ABV" value={form.abv} onChangeText={(value) => setField('abv', value)} placeholder="46%" keyboardType="numeric" /></View>
          <View className="flex-1"><Field label="Bottle volume" value={form.volume} onChangeText={(value) => setField('volume', value)} placeholder="750ml" keyboardType="numeric" /></View>
        </View>
        <Field label="Country" value={form.country} onChangeText={(value) => setField('country', value)} />
        <Field label="Barcode" value={form.barcode} onChangeText={(value) => setField('barcode', value)} placeholder="EAN or UPC" keyboardType="numeric" />
        <Field label="Notes" value={form.notes} onChangeText={(value) => setField('notes', value)} placeholder="Optional notes" />
        <View className="flex-row gap-3">
          <TouchableOpacity onPress={saveBottle} className="flex-1 bg-amber-700 p-3.5 rounded-xl items-center">
            <Text className="text-amber-100 font-bold">{editingId ? 'Save changes' : 'Add bottle'}</Text>
          </TouchableOpacity>
          {editingId && (
            <TouchableOpacity onPress={resetForm} className="bg-stone-700 p-3.5 rounded-xl items-center">
              <Text className="text-stone-200 font-bold">Cancel</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {activeBottles.map((bottle) => (
        <View key={bottle.id} className="bg-stone-900 p-4 rounded-2xl border border-stone-800 mb-3">
          <View className="flex-row justify-between">
            <View className="flex-1 pr-3">
              <Text className="text-stone-100 text-lg font-bold">{bottle.name}</Text>
              {bottle.distillery && <Text className="text-stone-400 mt-1">{bottle.distillery}</Text>}
            </View>
            {bottle.abvBp !== null && <Text className="text-amber-300 font-bold">{(bottle.abvBp / 100).toFixed(2)}%</Text>}
          </View>
          <Text className="text-stone-500 mt-2">
            {[bottle.category, bottle.region, bottle.volumeMl ? `${bottle.volumeMl} ml` : null].filter(Boolean).join(' • ') || 'No details yet'}
          </Text>
          {bottle.notes && <Text className="text-stone-300 mt-2">{bottle.notes}</Text>}
          <View className="flex-row gap-3 mt-4">
            <TouchableOpacity onPress={() => { setEditingId(bottle.id); setForm(formFromBottle(bottle)); setError(null); }} className="bg-stone-700 px-4 py-2 rounded-lg">
              <Text className="text-stone-200 font-bold">Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => confirmDelete(bottle)} className="bg-red-950 px-4 py-2 rounded-lg">
              <Text className="text-red-300 font-bold">Delete</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}
