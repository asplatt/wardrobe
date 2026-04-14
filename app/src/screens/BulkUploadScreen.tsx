import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Image, ScrollView, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { C } from '../theme';
import { uploadPhoto } from '../api';
import type { RootStackParamList } from '../navigation';

export default function BulkUploadScreen() {
  const nav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [photos, setPhotos] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  async function pickPhotos() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'], allowsMultipleSelection: true, quality: 0.85,
    });
    if (result.canceled) return;
    setPhotos(result.assets.map(a => a.uri));
  }

  async function startTagging() {
    if (!photos.length) return;
    setUploading(true);
    try {
      const stagedIds: string[] = [];
      for (const uri of photos) {
        const { staged_id } = await uploadPhoto(uri);
        stagedIds.push(staged_id);
      }
      nav.replace('TagItem', { stagedIds, index: 0 });
    } catch (e: any) {
      Alert.alert('Upload failed', e.message);
    } finally {
      setUploading(false);
    }
  }

  return (
    <View style={st.screen}>
      <ScrollView contentContainerStyle={st.content}>
        <TouchableOpacity style={[st.zone, photos.length > 0 && st.zoneSmall]} onPress={pickPhotos}>
          <Text style={st.zoneIcon}>📷</Text>
          <Text style={st.zoneTitle}>{photos.length > 0 ? `${photos.length} selected — tap to change` : 'Tap to select photos'}</Text>
          <Text style={st.zoneSub}>Choose multiple from your library</Text>
        </TouchableOpacity>

        {photos.length > 0 && (
          <>
            <View style={st.grid}>
              {photos.slice(0, 15).map((uri, i) => (
                <Image key={i} source={{ uri }} style={st.thumb} />
              ))}
              {photos.length > 15 && (
                <View style={[st.thumb, st.more]}>
                  <Text style={st.moreText}>+{photos.length - 15}</Text>
                </View>
              )}
            </View>

            <TouchableOpacity style={st.btn} onPress={startTagging} disabled={uploading}>
              {uploading
                ? <><ActivityIndicator color="#000" /><Text style={st.btnText}> Uploading…</Text></>
                : <Text style={st.btnText}>Upload & Start Tagging →</Text>}
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const st = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f2f2f7' },
  content: { padding: 16, paddingBottom: 60 },
  zone: { backgroundColor: '#ffffff', borderRadius: 16, borderWidth: 2, borderColor: '#d1d1d6', borderStyle: 'dashed', padding: 40, alignItems: 'center', marginBottom: 16 },
  zoneSmall: { padding: 20 },
  zoneIcon: { fontSize: 40, marginBottom: 10 },
  zoneTitle: { color: '#1c1c1e', fontSize: 15, fontWeight: '600', textAlign: 'center' },
  zoneSub: { color: '#8e8e93', fontSize: 13, marginTop: 4 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  thumb: { width: 78, height: 100, borderRadius: 10, backgroundColor: '#e5e5ea' },
  more: { alignItems: 'center', justifyContent: 'center' },
  moreText: { color: '#8e8e93', fontWeight: '600' },
  btn: { backgroundColor: '#1c1c1e', borderRadius: 14, padding: 15, alignItems: 'center', flexDirection: 'row', justifyContent: 'center' },
  btnText: { color: '#ffffff', fontWeight: '700', fontSize: 16 },
});
