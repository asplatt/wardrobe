import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, StyleSheet } from 'react-native';
import { C } from '../theme';

const COLOR_MAP: Record<string, string> = {
  black: '#000000', white: '#ffffff', gray: '#6b7280', navy: '#1e3a5f',
  blue: '#3b82f6', 'light blue': '#93c5fd', red: '#ef4444', green: '#22c55e',
  brown: '#92400e', beige: '#d4b896', khaki: '#c3b38e', olive: '#6b7c35',
  burgundy: '#800020', pink: '#ec4899', yellow: '#eab308', orange: '#f97316',
  purple: '#a855f7', multicolor: 'gradient',
};

interface Props {
  commonColors: string[];
  selected: string[];
  onChange: (colors: string[]) => void;
}

export default function ColorPills({ commonColors, selected, onChange }: Props) {
  const [custom, setCustom] = useState('');

  function toggle(color: string) {
    if (selected.includes(color)) {
      onChange(selected.filter(c => c !== color));
    } else {
      onChange([...selected, color]);
    }
  }

  function addCustom() {
    const val = custom.trim().toLowerCase();
    if (!val || selected.includes(val)) { setCustom(''); return; }
    onChange([...selected, val]);
    setCustom('');
  }

  const customColors = selected.filter(c => !commonColors.includes(c));
  const allOptions = [...commonColors, ...customColors];

  return (
    <View>
      <View style={st.wrap}>
        {allOptions.map(color => {
          const active = selected.includes(color);
          const hex = COLOR_MAP[color];
          return (
            <TouchableOpacity key={color} onPress={() => toggle(color)}
              style={[st.pill, active && st.pillActive]}>
              {hex && hex !== 'gradient' ? (
                <View style={[st.swatch, { backgroundColor: hex }, color === 'white' && st.swatchBorder]} />
              ) : hex === 'gradient' ? (
                <View style={[st.swatch, st.gradient]} />
              ) : null}
              <Text style={[st.pillText, active && st.pillTextActive]}>{color}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
      <View style={st.customRow}>
        <TextInput style={st.customInput} value={custom} onChangeText={setCustom}
          placeholder="+ other color" placeholderTextColor={C.muted}
          onSubmitEditing={addCustom} returnKeyType="done" />
      </View>
    </View>
  );
}

const st = StyleSheet.create({
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1.5, borderColor: '#d1d1d6', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 6 },
  pillActive: { borderColor: '#1c1c1e', backgroundColor: 'rgba(0,0,0,0.06)' },
  pillText: { color: '#8e8e93', fontSize: 13, fontWeight: '500', textTransform: 'capitalize' },
  pillTextActive: { color: '#1c1c1e' },
  swatch: { width: 12, height: 12, borderRadius: 6 },
  swatchBorder: { borderWidth: 1, borderColor: '#ccc' },
  gradient: { backgroundColor: '#a855f7' }, // simplified
  customRow: { marginTop: 10 },
  customInput: { backgroundColor: '#f2f2f7', borderWidth: 1, borderColor: '#e5e5ea', borderRadius: 10, padding: 10, color: '#1c1c1e', fontSize: 14 },
});
