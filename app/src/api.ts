import AsyncStorage from '@react-native-async-storage/async-storage';

// Emmy Mac Mini via Tailscale
export const BASE_URL = 'http://100.114.108.113:8765';

async function req(path: string, opts: RequestInit = {}) {
  const token = await AsyncStorage.getItem('auth_token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(opts.headers as Record<string, string> || {}),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${path}`, { ...opts, headers });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(err || `HTTP ${res.status}`);
  }
  return res.json();
}

// ── Auth ──────────────────────────────────────────────────────────────
export async function login(username: string, password: string) {
  const data = await req('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });
  await AsyncStorage.setItem('auth_token', data.token);
  return data;
}

export async function logout() {
  await AsyncStorage.removeItem('auth_token');
}

// ── Wardrobe ──────────────────────────────────────────────────────────
export async function getItems(typeFilter = 'all') {
  const q = typeFilter !== 'all' ? `?type_filter=${typeFilter}` : '';
  return req(`/api/items${q}`);
}

export async function getItem(id: string) {
  return req(`/api/items/${id}`);
}

export async function updateItem(id: string, data: Record<string, unknown>) {
  return req(`/api/items/${id}`, { method: 'PUT', body: JSON.stringify(data) });
}

export async function deleteItem(id: string) {
  return req(`/api/items/${id}`, { method: 'DELETE' });
}

export async function getBrands(): Promise<string[]> {
  return req('/wardrobe/brands');
}

// ── Upload ────────────────────────────────────────────────────────────
export async function uploadPhoto(uri: string): Promise<{ staged_id: string }> {
  const token = await AsyncStorage.getItem('auth_token');
  const form = new FormData();
  const filename = uri.split('/').pop() ?? 'photo.jpg';
  form.append('photo', { uri, name: filename, type: 'image/jpeg' } as unknown as Blob);

  const res = await fetch(`${BASE_URL}/api/upload`, {
    method: 'POST',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: form,
  });
  if (!res.ok) throw new Error(`Upload failed: ${res.status}`);
  return res.json();
}

export async function analyzePhoto(stagedId: string) {
  return req(`/wardrobe/analyze/${stagedId}`);
}

export async function saveItem(data: Record<string, unknown>) {
  return req('/api/items', { method: 'POST', body: JSON.stringify(data) });
}

export async function lookupProduct(name: string) {
  return req('/wardrobe/lookup', { method: 'POST', body: JSON.stringify({ name }) });
}

// ── Today / Outfits ───────────────────────────────────────────────────
export async function getToday() {
  return req('/api/today');
}

export async function getRecommendations(vibe: string | null, event: string | null) {
  return req('/recommend', { method: 'POST', body: JSON.stringify({ vibe, event }) });
}

export async function swapItem(outfitItemIds: string[], swapType: string, vibe: string | null, event: string | null) {
  return req('/api/swap', {
    method: 'POST',
    body: JSON.stringify({ outfit_items: outfitItemIds, swap_type: swapType, vibe, event }),
  });
}

// ── Photo URL helper ──────────────────────────────────────────────────
export function photoUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  // Convert absolute server path to URL
  const filename = path.split('/').pop();
  if (!filename) return null;
  return `${BASE_URL}/photos/${filename}`;
}
