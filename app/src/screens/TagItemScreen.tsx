import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  Image, StyleSheet, ActivityIndicator, Alert,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack';
import { C, S } from '../theme';
import { analyzePhoto, lookupProduct, saveItem, BASE_URL } from '../api';
import PillSelector from '../components/PillSelector';
import ColorPills from '../components/ColorPills';
import type { RootStackParamList } from '../navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'TagItem'>;

const ITEM_TYPES = ['shirt', 'sweater', 'jacket', 'pants', 'shorts', 'shoes', 'socks', 'accessory'];
const FORMALITY = ['casual', 'smart-casual', 'business', 'formal'];
const MATERIALS = ['cotton', 'linen', 'wool', 'cashmere', 'silk', 'polyester', 'nylon', 'denim', 'leather', 'suede', 'synthetic', 'other'];
const SEASONS = ['spring', 'summer', 'fall', 'winter'];
const COMMON_TAGS = ['slim-fit', 'relaxed', 'oversized', 'cropped', 'solid', 'striped', 'plaid', 'graphic', 'crew-neck', 'v-neck', 'button-down', 'polo', 'hooded', '1/4-zip', 'full-zip', 'athletic', 'vintage', 'patterned'];
const COMMON_COLORS = ['black', 'white', 'gray', 'navy', 'blue', 'light blue', 'red', 'green', 'brown', 'beige', 'khaki', 'olive', 'burgundy', 'pink', 'yellow', 'orange', 'purple', 'multicolor'];

export default function TagItemScreen() {
  const nav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { params } = useRoute<Props['route']>();
  const { stagedIds, index } = params;
  const stagedId = stagedIds[index];
  const total = stagedIds.length;

  const [analyzing, setAnalyzing] = useState(true);
  const [aiStatus, setAiStatus] = useState('Analyzing photo…');
  const [saving, setSaving] = useState(false);
  const [lookupQuery, setLookupQuery] = useState('');
  const [lookupLoading, setLookupLoading] = useState(false);
  const [photoColors, setPhotoColors] = useState<string[]>([]);

  const [name, setName] = useState('');
  const [type, setType] = useState('shirt');
  const [formality, setFormality] = useState('casual');
  const [material, setMaterial] = useState('');
  const [brand, setBrand] = useState('');
  const [colors, setColors] = useState<string[]>([]);
  const [seasons, setSeasons] = useState<string[]>(['spring', 'summer', 'fall', 'winter']);
  const [tags, setTags] = useState<string[]>([]);

  // bare id without extension
  const bareId = stagedId.includes('.') ? stagedId.split('.')[0] : stagedId;
  const photoUri = `${BASE_URL}/photos/staged/${stagedId}`;

  useEffect(() => { autoAnalyze(); }, []);

  async function autoAnalyze() {
    setAnalyzing(true);
    try {
      const data = await analyzePhoto(bareId);
      if (data && !data.error) {
        setPhotoColors(data.colors ?? []);
        fillForm(data);
        if (data.style_number) {
          setLookupQuery(data.style_number);
          setAiStatus('Tag detected — searching web…');
          await doLookup((data.brand ? data.brand + ' ' : '') + data.style_number, data.colors);
        } else {
          setAiStatus('✓ AI pre-filled — review and adjust');
        }
      } else {
        setAiStatus('Fill in details below');
      }
    } catch {
      setAiStatus('Fill in details below');
    } finally {
      setAnalyzing(false);
    }
  }

  function fillForm(data: any, skipColors = false) {
    if (data.name) setName(data.name);
    if (data.brand) setBrand(data.brand);
    if (data.type && ITEM_TYPES.includes(data.type)) setType(data.type);
    if (data.formality && FORMALITY.includes(data.formality)) setFormality(data.formality);
    if (data.material && MATERIALS.includes(data.material)) setMaterial(data.material);
    if (data.seasons?.length) setSeasons(data.seasons);
    if (!skipColors && data.colors?.length) setColors(data.colors.map((c: string) => c.toLowerCase().trim()));
    if (data.tags?.length) setTags(data.tags);
  }

  async function doLookup(query: string, currentPhotoColors?: string[]) {
    if (!query.trim()) return;
    setLookupLoading(true);
    try {
      const data = await lookupProduct(query);
      if (data && !data.error) {
        fillForm(data, true);
        const pc = currentPhotoColors ?? photoColors;
        if (pc.length) setColors(pc);
        setAiStatus('✓ Filled from web search');
      }
    } catch {}
    setLookupLoading(false);
  }

  async function handleSave() {
    if (!name.trim()) { Alert.alert('Name required'); return; }
    setSaving(true);
    try {
      await saveItem({ name, type, formality, material, brand, colors, seasons, tags, staged_id: stagedId });
      goNext();
    } catch (e: any) {
      Alert.alert('Save failed', e.message);
      setSaving(false);
    }
  }

  function goNext() {
    const next = index + 1;
    if (next < total) {
      nav.replace('TagItem', { stagedIds, index: next });
    } else {
      nav.navigate('Tabs');
    }
  }

  const progress = ((index + 1) / total) * 100;

  return (
    <ScrollView style={st.screen} contentContainerStyle={st.content} keyboardShouldPersistTaps="handled">
      {/* Progress */}
      <View style={st.progressRow}>
        <Text style={st.progressLabel}>Tagging photos</Text>
        <Text style={st.progressCount}>{index + 1} of {total}</Text>
      </View>
      <View style={st.progressTrack}>
        <View style={[st.progressFill, { width: `${progress}%` as any }]} />
      </View>

      {/* Photo */}
      <Image source={{ uri: photoUri }} style={st.photo} resizeMode="contain" />

      {/* Status */}
      <View style={st.statusRow}>
        {analyzing && <ActivityIndicator size="small" color={C.muted} style={{ marginRight: 6 }} />}
        <Text style={st.statusText}>{aiStatus}</Text>
      </View>

      {/* Lookup */}
      <View style={S.card}>
        <Text style={S.label}>Search by Name or Style #</Text>
        <View style={st.row}>
          <TextInput style={[S.input, { flex: 1 }]} value={lookupQuery} onChangeText={setLookupQuery}
            placeholder="e.g. Levi 514, Nike AF1…" placeholderTextColor={C.muted}
            onSubmitEditing={() => doLookup(lookupQuery)} returnKeyType="search" />
          <TouchableOpacity style={st.searchBtn} onPress={() => doLookup(lookupQuery)} disabled={lookupLoading}>
            {lookupLoading ? <ActivityIndicator color="#000" size="small" /> : <Text style={st.searchBtnText}>Go</Text>}
          </TouchableOpacity>
        </View>
      </View>

      {/* Name */}
      <View style={S.card}>
        <Text style={S.label}>Name *</Text>
        <TextInput style={S.input} value={name} onChangeText={setName}
          placeholder="e.g. Dark Wash Slim Jeans" placeholderTextColor={C.muted} />
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
      <View style={st.actions}>
        <TouchableOpacity style={st.saveBtn} onPress={handleSave} disabled={saving}>
          {saving ? <ActivityIndicator color="#000" /> : <Text style={st.saveBtnText}>{index + 1 < total ? 'Save & Next →' : 'Save & Finish'}</Text>}
        </TouchableOpacity>
        <TouchableOpacity style={st.skipBtn} onPress={goNext}>
          <Text style={st.skipBtnText}>Skip</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const st = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.bg },
  content: { padding: 16, paddingBottom: 60 },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  progressLabel: { color: C.textSub, fontSize: 12 },
  progressCount: { color: C.muted, fontSize: 12 },
  progressTrack: { height: 3, backgroundColor: C.border, borderRadius: 2, marginBottom: 14 },
  progressFill: { height: 3, backgroundColor: C.text, borderRadius: 2 },
  photo: { width: '100%', height: 240, borderRadius: 16, backgroundColor: C.bgCard, marginBottom: 10 },
  statusRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 14, paddingHorizontal: 2 },
  statusText: { color: C.textSub, fontSize: 13 },
  row: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  searchBtn: { backgroundColor: C.text, borderRadius: 10, paddingHorizontal: 16, paddingVertical: 13 },
  searchBtnText: { color: C.bg, fontWeight: '600', fontSize: 14 },
  actions: { flexDirection: 'row', gap: 12, marginTop: 8 },
  saveBtn: { flex: 1, backgroundColor: C.text, borderRadius: 14, padding: 15, alignItems: 'center' },
  saveBtnText: { color: C.bg, fontWeight: '700', fontSize: 16 },
  skipBtn: { backgroundColor: C.bgCard, borderRadius: 14, paddingHorizontal: 20, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.border },
  skipBtnText: { color: C.textSub, fontWeight: '500' },
});
