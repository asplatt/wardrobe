# Wardrobe App

React Native / Expo mobile app for the AI wardrobe helper. Connects to the FastAPI backend running on Emmy (Mac Mini).

## Stack

- **Framework:** Expo SDK 54, React Native 0.81
- **Navigation:** React Navigation (bottom tabs + native stack)
- **Backend:** FastAPI on Emmy at `http://100.114.108.113:8765`
- **Auth:** Simple token auth (multi-user ready)
- **AI:** Claude (photo analysis, outfit recs), Gemini (product lookup)

## Screens

- **Today** — weather + calendar events + 3 outfit suggestions
- **Wardrobe** — photo grid with type/color filters
- **Item Detail** — view + edit item
- **Add Item** — camera/photo picker + AI auto-fill form
- **Bulk Upload** — multi-select photos, tag one by one
- **Tag Item** — per-photo tagging with AI pre-fill + product lookup

## Build

```bash
cd app
npm install
expo run:ios          # dev build
eas build --local     # TestFlight build
```

## Backend

Existing FastAPI at `projects/ai/2026-03-14_wardrobe-helper/`.
Added: CORS middleware, token auth, mobile photo upload endpoint.

## Status

🔄 In Progress
