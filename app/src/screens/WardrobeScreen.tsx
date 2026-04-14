import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, ScrollView,
  Image, StyleSheet, Dimensions,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { C } from '../theme';
import { getItems, photoUrl } from '../api';
import type { RootStackParamList } from '../navigation';

const TYPES = ['all', 'shirt', 'sweater', 'jacket', 'pants', 'shorts', 'shoes', 'socks', 'accessory'];
const W = (Dimensions.get('window').width - 48) / 2;

export default function WardrobeScreen() {
  const nav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [items, setItems] = useState<any[]>([]);
  const [filter, setFilter] = useState('all');
  const [counts, setCounts] = useState<Record<string, number>>({});

  useFocusEffect(useCallback(() => {
    loadItems();
  }, [filter]));

  async function loadItems() {
    const data = await getItems(filter);
    setItems(data.items ?? []);
    setCounts(data.counts ?? {});
  }

  const total = Object.values(counts).reduce((a, b) => a + b, 0);

  return (
    <View style={st.screen}>
      {/* Header */}
      <View style={st.header}>
        <View>
          <Text style={st.title}>My Wardrobe</Text>
          <Text style={st.subtitle}>{total} items</Text>
        </View>
        <TouchableOpacity style={st.addBtn} onPress={() => nav.navigate('AddItem')}>
          <Text style={st.addBtnText}>+</Text>
        </TouchableOpacity>
      </View>

      {/* Filters */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={st.filterScroll} contentContainerStyle={{ paddingHorizontal: 16 }}>
        {TYPES.filter(t => t === 'all' || (counts[t] ?? 0) > 0).map(t => (
          <TouchableOpacity key={t} onPress={() => setFilter(t)}
            style={[st.pill, filter === t && st.pillActive]}>
            <Text style={[st.pillText, filter === t && st.pillTextActive]}>
              {t === 'all' ? `All · ${total}` : `${t} · ${counts[t] ?? 0}`}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Grid */}
      {items.length === 0 ? (
        <View style={st.empty}>
          <Text style={st.emptyEmoji}>👔</Text>
          <Text style={st.emptyText}>{filter !== 'all' ? `No ${filter}s yet` : 'Your wardrobe is empty'}</Text>
          <TouchableOpacity style={st.emptyBtn} onPress={() => nav.navigate('AddItem')}>
            <Text style={st.emptyBtnText}>Add First Item</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={i => i.id}
          numColumns={2}
          contentContainerStyle={st.grid}
          columnWrapperStyle={{ gap: 12 }}
          renderItem={({ item }) => {
            const url = photoUrl(item.photo);
            return (
              <TouchableOpacity style={[st.card, { width: W }]}
                onPress={() => nav.navigate('ItemDetail', { id: item.id })}>
                {url
                  ? <Image source={{ uri: url }} style={[st.photo, { width: W }]} />
                  : <View style={[st.photo, { width: W }, st.noPhoto]}>
                      <Text style={st.noPhotoEmoji}>{typeEmoji(item.type)}</Text>
                    </View>}
                <View style={st.cardBody}>
                  <Text style={st.itemName} numberOfLines={2}>{item.name}</Text>
                  <Text style={st.itemMeta} numberOfLines={1}>
                    {[item.brand, item.formality, item.material].filter(Boolean).join(' · ')}
                  </Text>
                  {item.colors?.length > 0 && (
                    <View style={st.colors}>
                      {item.colors.slice(0, 2).map((c: string) => (
                        <View key={c} style={st.colorChip}>
                          <Text style={st.colorChipText}>{c}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}

      {/* Bulk upload FAB */}
      <TouchableOpacity style={st.fab} onPress={() => nav.navigate('BulkUpload')}>
        <Text style={st.fabText}>📷 Bulk</Text>
      </TouchableOpacity>
    </View>
  );
}

function typeEmoji(type: string) {
  const map: Record<string, string> = { shirt: '👕', sweater: '🧶', jacket: '🧥', pants: '👖', shorts: '🩳', shoes: '👟', socks: '🧦' };
  return map[type] ?? '👔';
}

const st = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.bg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 60, paddingBottom: 12 },
  title: { color: C.text, fontSize: 28, fontWeight: '700' },
  subtitle: { color: C.textSub, fontSize: 13, marginTop: 2 },
  addBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: C.text, alignItems: 'center', justifyContent: 'center' },
  addBtnText: { color: C.bg, fontSize: 22, fontWeight: '400', lineHeight: 36 },
  filterScroll: { marginBottom: 12 },
  pill: { backgroundColor: C.bgCard, borderRadius: 20, paddingHorizontal: 13, paddingVertical: 7, marginRight: 8, borderWidth: 1, borderColor: C.border },
  pillActive: { backgroundColor: C.text },
  pillText: { color: C.textSub, fontSize: 13, fontWeight: '500', textTransform: 'capitalize' },
  pillTextActive: { color: C.bg },
  grid: { paddingHorizontal: 16, paddingBottom: 100 },
  card: { backgroundColor: C.bgCard, borderRadius: 14, overflow: 'hidden', marginBottom: 12 },
  photo: { aspectRatio: 3 / 4, backgroundColor: C.border },
  noPhoto: { alignItems: 'center', justifyContent: 'center' },
  noPhotoEmoji: { fontSize: 40 },
  cardBody: { padding: 10 },
  itemName: { color: C.text, fontSize: 13, fontWeight: '600', lineHeight: 18 },
  itemMeta: { color: C.muted, fontSize: 11, marginTop: 3, textTransform: 'capitalize' },
  colors: { flexDirection: 'row', gap: 4, marginTop: 6, flexWrap: 'wrap' },
  colorChip: { backgroundColor: C.border, borderRadius: 20, paddingHorizontal: 7, paddingVertical: 2 },
  colorChipText: { color: C.muted, fontSize: 10, textTransform: 'capitalize' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyText: { color: C.textSub, fontSize: 15, marginBottom: 20 },
  emptyBtn: { backgroundColor: C.text, borderRadius: 14, paddingHorizontal: 24, paddingVertical: 12 },
  emptyBtnText: { color: C.bg, fontWeight: '600' },
  fab: { position: 'absolute', bottom: 90, right: 16, backgroundColor: C.bgCard, borderWidth: 1, borderColor: C.border, borderRadius: 22, paddingHorizontal: 16, paddingVertical: 10 },
  fabText: { color: C.text, fontSize: 14, fontWeight: '500' },
});
