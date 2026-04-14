import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  Image, StyleSheet, ActivityIndicator, Alert,
} from 'react-native';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { C, S } from '../theme';
import { getItem, updateItem, deleteItem, photoUrl } from '../api';
import PillSelector from '../components/PillSelector';
import ColorPills from '../components/ColorPills';
import type { RootStackParamList } from '../navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'ItemDetail'>;

const ITEM_TYPES = ['shirt', 'sweater', 'jacket', 'pants', 'shorts', 'shoes', 'socks', 'accessory'];
const FORMALITY = ['casual', 'smart-casual', 'business', 'formal'];
const MATERIALS = ['cotton', 'linen', 'wool', 'cashmere', 'silk', 'polyester', 'nylon', 'denim', 'leather', 'suede', 'synthetic', 'other'];
const SEASONS = ['spring', 'summer', 'fall', 'winter'];
const COMMON_TAGS = ['slim-fit', 'relaxed', 'oversized', 'cropped', 'solid', 'striped', 'plaid', 'graphic', 'crew-neck', 'v-neck', 'button-down', 'polo', 'hooded', '1/4-zip', 'full-zip', 'athletic', 'vintage', 'patterned'];
const COMMON_COLORS = ['black', 'white', 'gray', 'navy', 'blue', 'light blue', 'red', 'green', 'brown', 'beige', 'khaki', 'olive', 'burgundy', 'pink', 'yellow', 'orange', 'purple', 'multicolor'];

export default function ItemDetailScreen() {
  const nav = useNavigation();
  const { params } = useRoute<Props['route']>();
  const [item, setItem] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState('');
  const [type, setType] = useState('shirt');
  const [formality, setFormality] = useState('casual');
  const [material, setMaterial] = useState('');
  const [brand, setBrand] = useState('');
  const [colors, setColors] = useState<string[]>([]);
  const [seasons, setSeasons] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);

  useFocusEffect(useCallback(() => {
    getItem(params.id).then(data => {
      setItem(data);
      setName(data.name ?? '');
      setType(data.type ?? 'shirt');
      setFormality(data.formality ?? 'casual');
      setMaterial(data.material ?? '');
      setBrand(data.brand ?? '');
      setColors(data.colors ?? []);
      setSeasons(data.seasons ?? ['spring', 'summer', 'fall', 'winter']);
      setTags(data.tags ?? []);
    }).catch(() => {});
  }, [params.id]));

  async function handleSave() {
    if (!name.trim()) { Alert.alert('Name required'); return; }
    setSaving(true);
    try {
      await updateItem(params.id, { name, type, formality, material, brand, colors, seasons, tags });
      nav.goBack();
    } catch (e: any) {
      Alert.alert('Save failed', e.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    Alert.alert('Delete item?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        await deleteItem(params.id);
        nav.goBack();
      }},
    ]);
  }

  if (!item) return <View style={st.center}><ActivityIndicator color={C.text} /></View>;

  const url = photoUrl(item.photo);

  return (
    <ScrollView style={st.screen} contentContainerStyle={st.content} keyboardShouldPersistTaps="handled">
      {url && <Image source={{ uri: url }} style={st.photo} resizeMode="cover" />}

      {/* Name */}
      <View style={S.card}>
        <Text style={S.label}>Name *</Text>
        <TextInput style={S.input} value={name} onChangeText={setName} placeholderTextColor={C.muted} />
      </View>

      {/* Type + Formality */}
      <View style={S.card}>
        <Text style={S.label}>Type</Text>
        <PillSelector options={ITEM_TYPES} value={type} onChange={setType} single />
        <View style={{ marginTop: 14 }}>
          <Text style={S.label}>Formality</Text>
          <PillSelector options={FORMALITY} value={formality} onChange={setFormality} single />
        </View>
      </View>

      {/* Material + Brand */}
      <View style={S.card}>
        <Text style={S.label}>Material</Text>
        <PillSelector options={MATERIALS} value={material} onChange={setMaterial} single />
        <View style={{ marginTop: 14 }}>
          <Text style={S.label}>Brand</Text>
          <TextInput style={S.input} value={brand} onChangeText={setBrand}
            placeholder="e.g. Nike, Levi's…" placeholderTextColor={C.muted} />
        </View>
      </View>

      {/* Colors */}
      <View style={S.card}>
        <Text style={S.label}>Colors</Text>
        <ColorPills commonColors={COMMON_COLORS} selected={colors} onChange={setColors} />
      </View>

      {/* Seasons */}
      <View style={S.card}>
        <Text style={S.label}>Seasons</Text>
        <PillSelector options={SEASONS} value={seasons} onChange={setSeasons} />
      </View>

      {/* Tags */}
      <View style={S.card}>
        <Text style={S.label}>Tags</Text>
        <PillSelector options={COMMON_TAGS} value={tags} onChange={setTags} allowCustom />
      </View>

      {/* Actions */}
      <TouchableOpacity style={st.saveBtn} onPress={handleSave} disabled={saving}>
        {saving ? <ActivityIndicator color="#000" /> : <Text style={st.saveBtnText}>Save Changes</Text>}
      </TouchableOpacity>
      <TouchableOpacity style={st.deleteBtn} onPress={handleDelete}>
        <Text style={st.deleteBtnText}>Delete Item</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const st = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.bg },
  content: { padding: 16, paddingBottom: 60 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: C.bg },
  photo: { width: '100%', height: 280, borderRadius: 16, backgroundColor: C.bgCard, marginBottom: 12 },
  saveBtn: { backgroundColor: C.text, borderRadius: 14, padding: 15, alignItems: 'center', marginTop: 8 },
  saveBtnText: { color: C.bg, fontWeight: '700', fontSize: 16 },
  deleteBtn: { borderRadius: 14, padding: 15, alignItems: 'center', marginTop: 10 },
  deleteBtnText: { color: C.danger, fontWeight: '500', fontSize: 15 },
});
