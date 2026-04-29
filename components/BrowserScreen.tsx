import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, Modal, Pressable, SafeAreaView, StyleSheet, Text, TextInput, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { createTab, removeTab, updateTab } from '../core/browser/tabManager';
import { downloadManager } from '../core/download/downloadManager';
import { detectMediaFromUrl, extractFilename, isLikelyDownloadUrl } from '../core/media/mediaDetector';
import { canOpenInInternalPlayer } from '../core/player/playerUtils';
import { buildPrivacyScript, defaultProfiles } from '../core/privacy/proxyManager';
import { BrowserTab, DownloadTask, ReaderPayload } from '../types/browser';

const MOBILE_UA = 'Mozilla/5.0 (Linux; Android 14; Mobile) AppleWebKit/537.36 Chrome/122.0.0.0 Mobile Safari/537.36';
const DESKTOP_UA = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/122.0.0.0 Safari/537.36';
const INTERNAL_SCHEMES = ['http:', 'https:', 'about:', 'data:'];

const READER_EXTRACT_SCRIPT = `
(() => {
  const article = document.querySelector('article') || document.body;
  const text = (article?.innerText || '').replace(/\s+/g, ' ').trim();
  window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'reader', payload: { title: document.title || 'Reader', text: text.slice(0, 12000) } }));
})();
true;
`;

const normalizeInputToUrl = (input: string) => {
  const trimmed = input.trim();
  if (!trimmed) return 'https://duckduckgo.com';
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (/^[a-z]+:\/\//i.test(trimmed)) return trimmed;
  if (/^[\w.-]+\.[a-z]{2,}(\/.*)?$/i.test(trimmed)) return `https://${trimmed}`;
  return `https://duckduckgo.com/?q=${encodeURIComponent(trimmed)}`;
};

export default function BrowserScreen() {
  const [tabs, setTabs] = useState<BrowserTab[]>([createTab('https://duckduckgo.com')]);
  const [currentTabId, setCurrentTabId] = useState(tabs[0].id);
  const [addressBar, setAddressBar] = useState(tabs[0].url);
  const [showTabs, setShowTabs] = useState(false);
  const [downloads, setDownloads] = useState<DownloadTask[]>([]);
  const [incognitoMode, setIncognitoMode] = useState(false);
  const [readerData, setReaderData] = useState<ReaderPayload | null>(null);
  const [currentMediaUrl, setCurrentMediaUrl] = useState<string | null>(null);
  const [activeProfileId, setActiveProfileId] = useState(defaultProfiles[0].id);

  const webViewRef = useRef<WebView>(null);
  const activeTab = useMemo(() => tabs.find((t) => t.id === currentTabId) ?? tabs[0], [tabs, currentTabId]);
  const activeProfile = defaultProfiles.find((p) => p.id === activeProfileId) ?? defaultProfiles[0];

  useEffect(() => downloadManager.subscribe(setDownloads), []);

  const navigate = () => setTabs((prev) => updateTab(prev, activeTab.id, { url: normalizeInputToUrl(addressBar) }));

  const openNewTab = (tabIncognito = incognitoMode) => {
    const tab = createTab('https://duckduckgo.com', tabIncognito);
    setTabs((prev) => [tab, ...prev]);
    setCurrentTabId(tab.id);
    setAddressBar(tab.url);
  };

  const closeTab = (id: string) => {
    if (tabs.length <= 1) return;
    const nextTabs = removeTab(tabs, id);
    setTabs(nextTabs);
    if (currentTabId === id) {
      setCurrentTabId(nextTabs[0].id);
      setAddressBar(nextTabs[0].url);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TextInput value={addressBar} onChangeText={setAddressBar} onSubmitEditing={navigate} style={styles.input} autoCapitalize="none" autoCorrect={false} />
        <Pressable onPress={navigate}><Ionicons name="arrow-forward" color="#fff" size={22} /></Pressable>
      </View>

      <WebView
        ref={webViewRef}
        source={{ uri: activeTab.url }}
        style={styles.webview}
        javaScriptEnabled
        mediaPlaybackRequiresUserAction={false}
        allowsInlineMediaPlayback
        originWhitelist={["*"]}
        setSupportMultipleWindows={false}
        incognito={activeTab.incognito}
        userAgent={activeTab.userAgentMode === 'desktop' ? DESKTOP_UA : MOBILE_UA}
        onShouldStartLoadWithRequest={(request) => {
          const url = request.url ?? '';
          const lowerUrl = url.toLowerCase();

          if (canOpenInInternalPlayer(lowerUrl)) {
            setCurrentMediaUrl(url);
            return false;
          }

          if (isLikelyDownloadUrl(lowerUrl) || detectMediaFromUrl(lowerUrl)) {
            downloadManager.enqueue(url, extractFilename(url));
            return false;
          }

          try {
            const parsed = new URL(url);
            return INTERNAL_SCHEMES.includes(parsed.protocol);
          } catch {
            return false;
          }
        }}
        injectedJavaScriptBeforeContentLoaded={buildPrivacyScript(activeProfile)}
        onMessage={(event) => {
          try {
            const parsed = JSON.parse(event.nativeEvent.data);
            if (parsed?.type === 'reader') setReaderData(parsed.payload as ReaderPayload);
          } catch {
            // ignore malformed messages
          }
        }}
        onNavigationStateChange={(state) => {
          setAddressBar(state.url);
          setTabs((prev) => updateTab(prev, activeTab.id, { title: state.title ?? 'Tab', url: state.url }));
        }}
      />

      <View style={styles.footer}>
        <Pressable onPress={() => webViewRef.current?.goBack()}><Ionicons name="arrow-back" size={22} color="#fff" /></Pressable>
        <Pressable onPress={() => webViewRef.current?.reload()}><Ionicons name="refresh" size={22} color="#fff" /></Pressable>
        <Pressable onPress={() => openNewTab()}><Ionicons name="add-circle" size={24} color="#fff" /></Pressable>
        <Pressable onPress={() => setShowTabs(true)}><Text style={styles.tabCount}>{tabs.length}</Text></Pressable>
        <Pressable onPress={() => { setIncognitoMode((v) => !v); openNewTab(!incognitoMode); }}><Ionicons name="eye-off" size={22} color={incognitoMode ? '#8ac926' : '#fff'} /></Pressable>
        <Pressable onPress={() => setTabs((prev) => updateTab(prev, activeTab.id, { userAgentMode: activeTab.userAgentMode === 'mobile' ? 'desktop' : 'mobile' }))}><Ionicons name="desktop" size={22} color="#fff" /></Pressable>
        <Pressable onPress={() => webViewRef.current?.injectJavaScript(READER_EXTRACT_SCRIPT)}><Ionicons name="book" size={22} color="#fff" /></Pressable>
      </View>

      <Modal visible={showTabs} transparent animationType="slide">
        <View style={styles.modal}>
          <Text style={styles.modalTitle}>Tabs</Text>
          <FlatList data={tabs} keyExtractor={(item) => item.id} renderItem={({ item }) => (
            <View style={styles.tabRow}>
              <Pressable style={styles.tabItem} onPress={() => { setCurrentTabId(item.id); setShowTabs(false); }}>
                <Text style={styles.tabText}>{item.incognito ? '🕶️ ' : ''}{item.title}</Text>
              </Pressable>
              <Pressable onPress={() => closeTab(item.id)}><Ionicons name="close" color="#fff" size={18} /></Pressable>
            </View>
          )} />
          <Text style={styles.modalTitle}>Proxy</Text>
          {defaultProfiles.map((profile) => (
            <Pressable key={profile.id} style={styles.proxyRow} onPress={() => setActiveProfileId(profile.id)}>
              <Text style={styles.tabText}>{profile.name} ({profile.region})</Text>
              {activeProfileId === profile.id ? <Ionicons name="checkmark" size={16} color="#8ac926" /> : null}
            </Pressable>
          ))}
          <Text style={styles.modalTitle}>Downloads ({downloads.length})</Text>
          <FlatList data={downloads} keyExtractor={(item) => item.id} renderItem={({ item }) => (
            <View style={styles.downloadItem}><Text style={styles.tabText}>{item.filename}</Text><Text style={styles.subText}>{item.status} {(item.progress * 100).toFixed(0)}%</Text></View>
          )} />
          <Pressable style={styles.closeBtn} onPress={() => setShowTabs(false)}><Text style={{ color: '#fff' }}>Close</Text></Pressable>
        </View>
      </Modal>

      <Modal visible={!!readerData} animationType="slide">
        <SafeAreaView style={styles.readerContainer}>
          <View style={styles.readerHeader}><Text style={styles.modalTitle}>{readerData?.title ?? 'Reader'}</Text><Pressable onPress={() => setReaderData(null)}><Ionicons name="close" size={20} color="#fff" /></Pressable></View>
          <Text style={styles.readerText}>{readerData?.text ?? ''}</Text>
        </SafeAreaView>
      </Modal>

      <Modal visible={!!currentMediaUrl} animationType="slide" transparent>
        <View style={styles.playerModal}><Text style={styles.modalTitle}>Internal Player URL</Text><Text style={styles.readerText}>{currentMediaUrl}</Text><Pressable style={styles.closeBtn} onPress={() => setCurrentMediaUrl(null)}><Text style={{ color: '#fff' }}>Close</Text></Pressable></View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0f1c' }, header: { flexDirection: 'row', gap: 10, alignItems: 'center', padding: 10 }, input: { flex: 1, backgroundColor: '#1d2538', color: '#fff', borderRadius: 10, paddingHorizontal: 12, height: 42 }, webview: { flex: 1, backgroundColor: '#fff' }, footer: { flexDirection: 'row', justifyContent: 'space-around', padding: 12, backgroundColor: '#111827' }, tabCount: { color: '#fff', fontWeight: '700' }, modal: { flex: 1, marginTop: 80, backgroundColor: '#101828', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 16 }, modalTitle: { color: '#fff', fontSize: 18, fontWeight: '700', marginBottom: 8 }, tabRow: { flexDirection: 'row', alignItems: 'center', gap: 10 }, tabItem: { flex: 1, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#334155' }, tabText: { color: '#fff' }, subText: { color: '#94a3b8', fontSize: 12 }, downloadItem: { paddingVertical: 6 }, closeBtn: { marginTop: 12, alignSelf: 'center', backgroundColor: '#2563eb', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10 }, proxyRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 }, readerContainer: { flex: 1, backgroundColor: '#0f172a', padding: 16 }, readerHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, readerText: { color: '#e2e8f0', lineHeight: 22 }, playerModal: { marginTop: 120, marginHorizontal: 16, backgroundColor: '#111827', borderRadius: 16, padding: 16 }
});
