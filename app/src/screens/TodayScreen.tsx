import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  ActivityIndicator, StyleSheet, Image,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { C, S } from '../theme';
import { getToday, getRecommendations, swapItem, photoUrl } from '../api';
import type { RootStackParamList } from '../navigation';

const VIBES = ['Casual', 'Smart Casual', 'Business', 'Formal', 'Date Night', 'Weekend'];

export default function TodayScreen() {
  const nav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [today, setToday] = useState<any>(null);
  const [event, setEvent] = useState('');
  const [vibe, setVibe] = useState('');
  const [outfits, setOutfits] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  // swapping[`${outfitIdx}-${type}`] = true while loading
  const [swapping, setSwapping] = useState<Record<string, boolean>>({});

  useFocusEffect(useCallback(() => {
    getToday().then(setToday).catch(() => {});
  }, []));

  async function recommend() {
    setLoading(true); setError(''); setOutfits([]);
    try {
      const data = await getRecommendations(vibe || null, event || null);
      setOutfits(data.outfits ?? []);
    } catch (e: any) {
      setError(e.message || 'Failed to get recommendations');
    } finally {
      setLoading(false);
    }
  }

  async function handleSwap(outfitIdx: number, swapType: string) {
    const key = `${outfitIdx}-${swapType}`;
    setSwapping(s => ({ ...s, [key]: true }));
    try {
      const outfit = outfits[outfitIdx];
      const itemIds = outfit.items.map((i: any) => i.id);
      const data = await swapItem(itemIds, swapType, vibe || null, event || null);
      if (data.item) {
        setOutfits(prev => prev.map((o, i) => {
          if (i !== outfitIdx) return o;
          return {
            ...o,
            items: o.items.map((item: any) =>
              item.type === swapType ? { ...data.item, photo: data.item.photo } : item
            ),
          };
        }));
      }
    } catch (e: any) {
      setError(e.message || 'Swap failed');
    } finally {
      setSwapping(s => ({ ...s, [key]: false }));
    }
  }

  return (
    <ScrollView style={st.screen} contentContainerStyle={st.content}>
      {/* Header */}
      <View style={st.header}>
        <Text style={st.date}>{today?.date ?? ''}</Text>
        <Text style={st.title}>What to wear</Text>
      </View>

      {/* Weather */}
      {today?.weather && (
        <View style={[S.card, st.weatherCard]}>
          {today.weather.icon ? (
            <Image source={{ uri: `https://openweathermap.org/img/wn/${today.weather.icon}@2x.png` }}
                   style={st.weatherIcon} />
          ) : (
            <Text style={st.weatherEmoji}>🌤</Text>
          )}
          <View style={{ flex: 1 }}>
            <Text style={st.weatherSummary}>{today.weather.summary}</Text>
            {today.weather_advice ? (
              <Text style={st.weatherAdvice}>{today.weather_advice}</Text>
            ) : null}
          </View>
        </View>
      )}

      {/* Calendar Events */}
      {today?.events?.length > 0 && (
        <View style={S.card}>
          <Text style={S.label}>Today's Schedule</Text>
          {today.events.map((ev: any, i: number) => (
            <View key={i} style={st.eventRow}>
              <View style={[st.formalityBadge, formalityColor(ev.formality_hint)]}>
                <Text style={st.formalityText}>{ev.formality_hint ?? 'event'}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={st.eventTitle}>{ev.title}</Text>
                {ev.time ? <Text style={st.eventTime}>{ev.time}</Text> : null}
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Occasion input */}
      <View style={S.card}>
        <Text style={S.label}>What's the occasion?</Text>
        <TextInput
          style={S.input}
          placeholder="e.g. dinner with friends, job interview, date night…"
          placeholderTextColor={C.muted}
          value={event}
          onChangeText={setEvent}
          returnKeyType="done"
        />
      </View>

      {/* Vibe pills */}
      <Text style={[S.label, { marginBottom: 8 }]}>Formality</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={st.vibeScroll}>
        {VIBES.map(v => (
          <TouchableOpacity key={v} onPress={() => setVibe(vibe === v ? '' : v)}
            style={[st.vibePill, vibe === v && st.vibePillActive]}>
            <Text style={[st.vibePillText, vibe === v && st.vibePillTextActive]}>{v}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* CTA */}
      <TouchableOpacity style={st.btn} onPress={recommend} disabled={loading}>
        {loading
          ? <ActivityIndicator color={C.bg} />
          : <Text style={st.btnText}>Suggest Outfits</Text>}
      </TouchableOpacity>

      {error ? <Text style={st.error}>{error}</Text> : null}

      {/* Outfit cards */}
      {outfits.map((outfit, oi) => {
        const itemTypes = [...new Set(outfit.items?.map((i: any) => i.type) ?? [])];
        return (
          <View key={oi} style={[S.card, { marginTop: 4 }]}>
            <View style={st.outfitHeader}>
              <Text style={st.outfitName}>{outfit.name}</Text>
              <View style={st.occasionBadge}>
                <Text style={st.occasionText}>{outfit.occasion}</Text>
              </View>
            </View>
            <Text style={st.outfitReasoning}>{outfit.reasoning}</Text>

            {/* Item photos */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={st.itemsScroll}>
              {outfit.items?.map((item: any, j: number) => {
                const url = photoUrl(item.photo);
                return (
                  <TouchableOpacity key={`${item.id}-${j}`} style={st.outfitItem}
                    onPress={() => nav.navigate('ItemDetail', { id: item.id })}>
                    {url
                      ? <Image source={{ uri: url }} style={st.outfitPhoto} />
                      : <View style={[st.outfitPhoto, st.noPhoto]}><Text style={st.noPhotoEmoji}>👕</Text></View>}
                    <Text style={st.outfitItemName} numberOfLines={1}>{item.name}</Text>
                    <Text style={st.outfitItemType}>{item.type}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Swap row */}
            <View style={st.swapRow}>
              <Text style={st.swapLabel}>Swap a piece:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {(itemTypes as string[]).map(type => {
                  const key = `${oi}-${type}`;
                  const isLoading = swapping[key];
                  return (
                    <TouchableOpacity key={type} style={st.swapBtn}
                      onPress={() => handleSwap(oi, type)} disabled={isLoading}>
                      {isLoading
                        ? <ActivityIndicator size="small" color={C.text} />
                        : <Text style={st.swapBtnText}>↻ {type}</Text>}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {outfit.tip ? (
              <Text style={st.tip}>💡 {outfit.tip}</Text>
            ) : null}
          </View>
        );
      })}
    </ScrollView>
  );
}

function formalityColor(f: string) {
  if (f === 'business') return { backgroundColor: 'rgba(10,132,255,0.12)' };
  if (f === 'formal') return { backgroundColor: 'rgba(175,82,222,0.12)' };
  if (f === 'casual') return { backgroundColor: 'rgba(52,199,89,0.12)' };
  return { backgroundColor: C.border };
}

const st = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.bg },
  content: { padding: 16, paddingTop: 60, paddingBottom: 100 },
  header: { marginBottom: 20 },
  date: { color: C.muted, fontSize: 13, fontWeight: '500' },
  title: { color: C.text, fontSize: 28, fontWeight: '700', marginTop: 2 },
  weatherCard: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  weatherIcon: { width: 48, height: 48 },
  weatherEmoji: { fontSize: 36 },
  weatherSummary: { color: C.text, fontWeight: '600', fontSize: 15 },
  weatherAdvice: { color: C.textSub, fontSize: 13, marginTop: 2 },
  eventRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 10 },
  formalityBadge: { borderRadius: 20, paddingHorizontal: 8, paddingVertical: 4 },
  formalityText: { color: C.text, fontSize: 11, fontWeight: '600', textTransform: 'capitalize' },
  eventTitle: { color: C.text, fontSize: 14, fontWeight: '500' },
  eventTime: { color: C.muted, fontSize: 12, marginTop: 1 },
  vibeScroll: { marginBottom: 14 },
  vibePill: { backgroundColor: C.bgCard, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7, marginRight: 8, borderWidth: 1, borderColor: C.border },
  vibePillActive: { backgroundColor: C.text, borderColor: C.text },
  vibePillText: { color: C.textSub, fontSize: 13, fontWeight: '500' },
  vibePillTextActive: { color: C.bg },
  btn: { backgroundColor: C.text, borderRadius: 14, padding: 15, alignItems: 'center', marginBottom: 16 },
  btnText: { color: C.bg, fontWeight: '700', fontSize: 16 },
  error: { color: C.danger, fontSize: 13, marginBottom: 12 },
  outfitHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 },
  outfitName: { color: C.text, fontWeight: '600', fontSize: 16, flex: 1, marginRight: 8 },
  occasionBadge: { backgroundColor: C.border, borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3 },
  occasionText: { color: C.textSub, fontSize: 11 },
  outfitReasoning: { color: C.textSub, fontSize: 13, lineHeight: 20, marginBottom: 12 },
  itemsScroll: { marginBottom: 12 },
  outfitItem: { width: 80, marginRight: 10, alignItems: 'center' },
  outfitPhoto: { width: 80, height: 107, borderRadius: 12, backgroundColor: C.border },
  noPhoto: { alignItems: 'center', justifyContent: 'center' },
  noPhotoEmoji: { fontSize: 32 },
  outfitItemName: { color: C.textSub, fontSize: 11, marginTop: 4, lineHeight: 14, textAlign: 'center' },
  outfitItemType: { color: C.muted, fontSize: 10, textAlign: 'center', textTransform: 'capitalize' },
  swapRow: { borderTopWidth: 1, borderTopColor: C.border, paddingTop: 10, marginTop: 4, gap: 8 },
  swapLabel: { color: C.muted, fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },
  swapBtn: { backgroundColor: C.bg, borderWidth: 1, borderColor: C.border, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, marginRight: 8, minWidth: 60, alignItems: 'center' },
  swapBtnText: { color: C.text, fontSize: 12, fontWeight: '500', textTransform: 'capitalize' },
  tip: { color: C.muted, fontSize: 12, marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: C.border },
});
