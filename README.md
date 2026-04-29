# Android Browser Project (Phase 1 MVP)

Production-oriented Android browser app built with **React Native + Expo (EAS compatible)**.

## Implemented MVP capabilities

- Chromium-backed browsing via `react-native-webview`
- Polished dark mobile-first UI with navigation controls
- Multi-tab management (add/switch tabs)
- Incognito tab mode
- Mobile/Desktop user-agent switching
- Internal handling in single WebView (no multi-window handoff)
- Reader mode extraction modal (article/body text extraction)
- Ad/tracker/privacy hardening foundation via JS injection
- Internal download queue UI + resumable download engine with retry/queue controls
- Internal media detection foundation (video/audio URL detection)
- Internal media interception with in-app video/audio playback via expo-av
- Proxy/privacy architecture foundation:
  - proxy profile selector UI
  - geolocation spoof injection tied to selected profile
  - timezone override injection tied to selected profile
  - WebRTC host ICE candidate suppression foundation

## Architecture

- `core/browser`: tab lifecycle and browser behavior
- `core/download`: download queue + pause/resume/retry foundations
- `core/media`: media URL detection and filename extraction
- `core/privacy`: proxy profile models + privacy injection scripts
- `core/player`: internal media player decision logic
- `components`: polished UI layer and browser orchestration
- `app`: Expo Router entry/layout

## Local setup

```bash
npm install
npm run lint
npm run typecheck
npm run start
```

To run on Android device/emulator:

```bash
npm run android
```

## EAS / CI setup

Required secret in GitHub repository settings:

- `EXPO_TOKEN` (already expected to be configured)

Build config files:

- `app.json`
- `eas.json`
- `.github/workflows/android-build.yml`

Note: project intentionally avoids committed binary assets to keep PR diff tooling compatible in constrained environments.

On push to `main`, CI:
1. installs dependencies
2. runs lint/type checks
3. authenticates with Expo via `EXPO_TOKEN`
4. runs non-interactive EAS Android cloud build
5. fetches generated APK
6. uploads APK as GitHub Actions artifact

## Phase 2 roadmap (not implemented)

- Advanced fingerprint controls
- Anti-detect protections
- Expanded media extraction engine
- Browser profiles/workspaces
