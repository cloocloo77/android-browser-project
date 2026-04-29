<div align="center">

# 🚀 Android Browser Project (Phase 1 MVP)

<p>
  <img src="https://img.shields.io/badge/Platform-Android-3DDC84?logo=android&logoColor=white" alt="Android" />
  <img src="https://img.shields.io/badge/Framework-React%20Native-20232A?logo=react&logoColor=61DAFB" alt="React Native" />
  <img src="https://img.shields.io/badge/Expo-EAS%20Ready-000020?logo=expo&logoColor=white" alt="Expo EAS Ready" />
  <img src="https://img.shields.io/badge/Build-CI%20Enabled-blue" alt="CI Enabled" />
</p>

<p>
  <b>Production-oriented Android browser app built with React Native + Expo (EAS compatible).</b>
</p>

<p>
  <a href="https://github.com/<OWNER>/<REPO>/actions/workflows/android-build.yml"><img src="https://img.shields.io/badge/⚙️%20Build%20APK-One%20Click%20CI-success" alt="Build APK" /></a>
  <a href="https://github.com/<OWNER>/<REPO>/releases"><img src="https://img.shields.io/badge/📦%20Download-Latest%20Release-orange" alt="Download Latest Release" /></a>
</p>

</div>

---

## ✨ Implemented MVP capabilities

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

## 🧱 Architecture

- `core/browser`: tab lifecycle and browser behavior
- `core/download`: download queue + pause/resume/retry foundations
- `core/media`: media URL detection and filename extraction
- `core/privacy`: proxy profile models + privacy injection scripts
- `core/player`: internal media player decision logic
- `components`: polished UI layer and browser orchestration
- `app`: Expo Router entry/layout

## 🛠️ Local setup

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

## 🔁 EAS / CI setup

Required secrets in GitHub repository settings:

- `EXPO_TOKEN`
- `EAS_PROJECT_ID`

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

## 📲 One-click release/download flow

After the app is built, make it available in one click using either Releases or Artifacts:

1. **Build banner** (`⚙️ Build APK`) starts/opens the Android build workflow.
2. **Download banner** (`📦 Download Latest Release`) opens Releases for direct APK download.
3. If a Release is not yet published, download from Actions artifact `android-apk`.

### Direct APK download (GitHub Actions artifact)

1. Open repository **Actions** tab.
2. Open successful run of **Android EAS Build**.
3. Download artifact **`android-apk`**.
4. Unzip and install `app-release.apk`.

Quick direct link pattern:

```text
https://github.com/<OWNER>/<REPO>/actions/workflows/android-build.yml
```

### Direct APK download (GitHub Releases)

Use this when you publish APKs as release assets:

```text
https://github.com/<OWNER>/<REPO>/releases/latest
```

### Direct Expo build page

Expo cloud builds appear in the Expo project tied to `EAS_PROJECT_ID`.

Quick direct link pattern:

```text
https://expo.dev/accounts/<EXPO_ACCOUNT>/projects/<EXPO_PROJECT_SLUG>/builds
```

For this repo, `slug` is `android-browser-project`, so the project URL ends with:

```text
/projects/android-browser-project/builds
```

If builds are not visible on expo.dev, verify that:

- `EXPO_TOKEN` belongs to the same Expo account/org as the project.
- `EAS_PROJECT_ID` is correct for that Expo project.
- workflow step **Check EAS secrets availability** reports secrets are available.

## 🗺️ Phase 2 roadmap (not implemented)

- Advanced fingerprint controls
- Anti-detect protections
- Expanded media extraction engine
- Browser profiles/workspaces
