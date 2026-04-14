import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, StyleSheet } from 'react-native';
import { C } from '../theme';

interface Props {
  options: string[];
  value: string | string[];
  onChange: (v: any) => void;
  single?: boolean;       // single-select mode
  allowCustom?: boolean;  // show custom input
}

export default function PillSelector({ options, value, onChange, single, allowCustom }: Props) {
  const [custom, setCustom] = useState('');

  const selected: string[] = Array.isArray(value) ? value : (value ? [value] : []);

  function toggle(opt: string) {
    if (single) {
      onChange(opt);
    } else {
      if (selected.includes(opt)) {
        onChange(selected.filter(s => s !== opt));
      } else {
        onChange([...selected, opt]);
      }
    }
  }

  function addCustom() {
    const val = custom.trim().toLowerCase().replace(/\s+/g, '-');
    if (!val || selected.includes(val)) { setCustom(''); return; }
    onChange([...selected, val]);
    setCustom('');
  }

  const allOptions = [...options, ...selected.filter(s => !options.includes(s))];

  return (
    <View>
      <View style={st.wrap}>
        {allOptions.map(opt => {
          const active = selected.includes(opt);
          return (
            <TouchableOpacity key={opt} onPress={() => toggle(opt)}
              style={[st.pill, active && st.pillActive]}>
              <Text style={[st.pillText, active && st.pillTextActive]} numberOfLines={1}>{opt}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
      {allowCustom && (
        <View style={st.customRow}>
          <TextInput style={[st.customInput]} value={custom} onChangeText={setCustom}
            placeholder="+ custom tag" placeholderTextColor={C.muted}
            onSubmitEditing={addCustom} returnKeyType="done" />
          <TouchableOpacity style={st.addBtn} onPress={addCustom}>
            <Text style={st.addBtnText}>Add</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const st = StyleSheet.create({
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pill: { borderWidth: 1.5, borderColor: '#d1d1d6', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 },
  pillActive: { borderColor: '#1c1c1e', backgroundColor: 'rgba(0,0,0,0.06)' },
  pillText: { color: '#8e8e93', fontSize: 13, fontWeight: '500', textTransform: 'capitalize' },
  pillTextActive: { color: '#1c1c1e' },
  customRow: { flexDirection: 'row', gap: 8, marginTop: 10, alignItems: 'center' },
  customInput: { flex: 1, backgroundColor: '#f2f2f7', borderWidth: 1, borderColor: '#e5e5ea', borderRadius: 10, padding: 10, color: '#1c1c1e', fontSize: 14 },
  addBtn: { backgroundColor: '#e5e5ea', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10 },
  addBtnText: { color: '#1c1c1e', fontWeight: '500', fontSize: 13 },
});
