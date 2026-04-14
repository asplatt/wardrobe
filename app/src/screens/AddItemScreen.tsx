import React, { useState, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  Image, ActivityIndicator, StyleSheet, Alert, Modal,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useNavigation } from '@react-navigation/native';
import { C, S } from '../theme';
import { uploadPhoto, analyzePhoto, lookupProduct, saveItem, getBrands } from '../api';
import PillSelector from '../components/PillSelector';
import ColorPills from '../components/ColorPills';

const ITEM_TYPES = ['shirt', 'sweater', 'jacket', 'pants', 'shorts', 'shoes', 'socks', 'accessory'];
const FORMALITY = ['casual', 'smart-casual', 'business', 'formal'];
const MATERIALS = ['cotton', 'linen', 'wool', 'cashmere', 'silk', 'polyester', 'nylon', 'denim', 'leather', 'suede', 'synthetic', 'other'];
const SEASONS = ['spring', 'summer', 'fall', 'winter'];
const COMMON_TAGS = ['slim-fit', 'relaxed', 'oversized', 'cropped', 'solid', 'striped', 'plaid', 'graphic', 'crew-neck', 'v-neck', 'button-down', 'polo', 'hooded', '1/4-zip', 'full-zip', 'athletic', 'vintage', 'patterned', 'formal', 'casual'];
const COMMON_COLORS = ['black', 'white', 'gray', 'navy', 'blue', 'light blue', 'red', 'green', 'brown', 'beige', 'khaki', 'olive', 'burgundy', 'pink', 'yellow', 'orange', 'purple', 'multicolor'];

export default function AddItemScreen() {
  const nav = useNavigation();
  const [photo, setPhoto] = useState<string | null>(null);
  const [stagedId, setStagedId] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [lookupQuery, setLookupQuery] = useState('');
  const [lookupLoading, setLookupLoading] = useState(false);
  const [aiStatus, setAiStatus] = useState('');
  const [showScanner, setShowScanner] = useState(false);
  const [scanned, setScanned] = useState(false);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();

  const [name, setName] = useState('');
  const [type, setType] = useState('shirt');
  const [formality, setFormality] = useState('casual');
  const [material, setMaterial] = useState('');
  const [brand, setBrand] = useState('');
  const [colors, setColors] = useState<string[]>([]);
  const [seasons, setSeasons] = useState<string[]>(['spring', 'summer', 'fall', 'winter']);
  const [tags, setTags] = useState<string[]>([]);

  async function pickPhoto() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'], quality: 0.85,
    });
    if (result.canceled) return;
    const uri = result.assets[0].uri;
    setPhoto(uri);
    await uploadAndAnalyze(uri);
  }

  async function uploadAndAnalyze(uri: string) {
    setAnalyzing(true); setAiStatus('Uploading…');
    try {
      const { staged_id } = await uploadPhoto(uri);
      setStagedId(staged_id);
      setAiStatus('Analyzing photo…');
      const data = await analyzePhoto(staged_id);
      fillForm(data);
      if (data.style_number) {
        setLookupQuery(data.style_number);
        setAiStatus('Tag detected — searching web…');
        await doLookup((data.brand ? data.brand + ' ' : '') + data.style_number);
      } else {
        setAiStatus('✓ AI pre-filled — review and adjust');
      }
    } catch (e: any) {
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
    if (data.seasons) setSeasons(data.seasons);
    if (!skipColors && data.colors) setColors(data.colors.map((c: string) => c.toLowerCase().trim()));
    if (data.tags) setTags(data.tags);
  }

  async function openScanner() {
    if (!cameraPermission?.granted) {
      const { granted } = await requestCameraPermission();
      if (!granted) { Alert.alert('Camera access needed to scan barcodes'); return; }
    }
    setScanned(false);
    setShowScanner(true);
  }

  async function handleBarcodeScan({ data }: { type: string; data: string }) {
    if (scanned) return;
    setScanned(true);
    setShowScanner(false);
    setLookupQuery(data);
    setAiStatus('Barcode detected — searching…');
    await doLookup(data);
  }

  async function doLookup(query: string) {
    setLookupLoading(true);
    try {
      const data = await lookupProduct(query);
      if (data && !data.error) {
        const photoColorSnapshot = [...colors];
        fillForm(data, true);
        if (photoColorSnapshot.length) setColors(photoColorSnapshot);
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
      nav.goBack();
    } catch (e: any) {
      Alert.alert('Save failed', e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
    {/* Barcode Scanner Modal */}
    <Modal visible={showScanner} animationType="slide">
      <View style={st.scannerContainer}>
        <CameraView style={st.camera} facing="back" onBarcodeScanned={handleBarcodeScan}
          barcodeScannerSettings={{ barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e', 'code128', 'code39', 'qr'] }}>
          <View style={st.scannerOverlay}>
            <View style={st.scannerFrame} />
            <Text style={st.scannerHint}>Point at a barcode or tag</Text>
          </View>
        </CameraView>
        <TouchableOpacity style={st.scannerClose} onPress={() => setShowScanner(false)}>
          <Text style={st.scannerCloseText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </Modal>

    <ScrollView style={st.screen} contentContainerStyle={st.content} keyboardShouldPersistTaps="handled">

      {/* Photo */}
      <TouchableOpacity style={[st.photoZone, photo && st.photoZoneFilled]} onPress={pickPhoto}>
        {photo
          ? <Image source={{ uri: photo }} style={st.photoPreview} />
          : <View style={st.photoPlaceholder}>
              <Text style={st.photoIcon}>📷</Text>
              <Text style={st.photoLabel}>Tap to select photo</Text>
            </View>}
      </TouchableOpacity>
      {analyzing && <ActivityIndicator color={C.text} style={{ marginVertical: 8 }} />}
      {aiStatus ? <Text style={st.aiStatus}>{aiStatus}</Text> : null}

      {/* Product lookup */}
      <View style={S.card}>
        <Text style={S.label}>Search by Name or Style #</Text>
        <View style={st.row}>
          <TextInput style={[S.input, { flex: 1 }]} value={lookupQuery}
            onChangeText={setLookupQuery} placeholder="e.g. Levi 514, Nike AF1…"
            placeholderTextColor={C.muted}
            onSubmitEditing={() => doLookup(lookupQuery)} returnKeyType="search" />
          <TouchableOpacity style={st.scanBtn} onPress={openScanner}>
            <Text style={st.scanBtnText}>⬛</Text>
          </TouchableOpacity>
          <TouchableOpacity style={st.searchBtn} onPress={() => doLookup(lookupQuery)} disabled={lookupLoading}>
            {lookupLoading ? <ActivityIndicator color={C.bg} size="small" /> : <Text style={st.searchBtnText}>Go</Text>}
          </TouchableOpacity>
        </View>
      </View>

      {/* Name */}
      <View style={S.card}>
        <Text style={S.label}>Name *</Text>
        <TextInput style={S.input} value={name} onChangeText={setName}
          placeholder="e.g. Navy Oxford Shirt" placeholderTextColor={C.muted} />
      </View>

      {/* Type + Formality */}
      <View style={S.card}>
        <View style={st.row}>
          <View style={{ flex: 1 }}>
            <Text style={S.label}>Type</Text>
            <PillSelector options={ITEM_TYPES} value={type} onChange={setType} single />
          </View>
        </View>
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

      {/* Save */}
      <TouchableOpacity style={st.saveBtn} onPress={handleSave} disabled={saving}>
        {saving ? <ActivityIndicator color={C.bg} /> : <Text style={st.saveBtnText}>Add to Wardrobe</Text>}
      </TouchableOpacity>
    </ScrollView>
    </>
  );
}

const st = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.bg },
  content: { padding: 16, paddingBottom: 60 },
  photoZone: { borderRadius: 16, backgroundColor: C.bgCard, borderWidth: 2, borderColor: C.border, borderStyle: 'dashed', height: 200, alignItems: 'center', justifyContent: 'center', marginBottom: 10, overflow: 'hidden' },
  photoZoneFilled: { borderStyle: 'solid' },
  photoPreview: { width: '100%', height: '100%', resizeMode: 'cover' },
  photoPlaceholder: { alignItems: 'center' },
  photoIcon: { fontSize: 40, marginBottom: 8 },
  photoLabel: { color: C.textSub, fontSize: 14 },
  aiStatus: { color: C.textSub, fontSize: 12, textAlign: 'center', marginBottom: 12 },
  row: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  scanBtn: { backgroundColor: C.border, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 13 },
  scanBtnText: { fontSize: 16 },
  searchBtn: { backgroundColor: C.text, borderRadius: 10, paddingHorizontal: 16, paddingVertical: 13 },
  searchBtnText: { color: C.bg, fontWeight: '600', fontSize: 14 },
  saveBtn: { backgroundColor: C.text, borderRadius: 14, padding: 15, alignItems: 'center', marginTop: 8 },
  saveBtnText: { color: C.bg, fontWeight: '700', fontSize: 16 },
  // Scanner
  scannerContainer: { flex: 1, backgroundColor: '#000' },
  camera: { flex: 1 },
  scannerOverlay: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 20 },
  scannerFrame: { width: 250, height: 160, borderWidth: 2, borderColor: '#fff', borderRadius: 12 },
  scannerHint: { color: '#fff', fontSize: 14, fontWeight: '500' },
  scannerClose: { backgroundColor: '#fff', margin: 20, borderRadius: 14, padding: 16, alignItems: 'center' },
  scannerCloseText: { color: '#000', fontWeight: '700', fontSize: 16 },
});
