import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { createTab, updateTab } from '../core/browser/tabManager';
import { downloadManager } from '../core/download/downloadManager';
import { detectMediaFromUrl, extractFilename } from '../core/media/mediaDetector';
import { defaultProfiles, webViewInjectedPrivacyScript } from '../core/privacy/proxyManager';
import { BrowserTab, DownloadTask } from '../types/browser';

const MOBILE_UA = 'Mozilla/5.0 (Linux; Android 14; Mobile) AppleWebKit/537.36 Chrome/122.0.0.0 Mobile Safari/537.36';
const DESKTOP_UA = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/122.0.0.0 Safari/537.36';

export default function BrowserScreen() {
  const [tabs, setTabs] = useState<BrowserTab[]>([createTab('https://duckduckgo.com')]);
  const [currentTabId, setCurrentTabId] = useState(tabs[0].id);
  const [addressBar, setAddressBar] = useState(tabs[0].url);
  const [showTabs, setShowTabs] = useState(false);
  const [downloads, setDownloads] = useState<DownloadTask[]>([]);
  const [incognitoMode, setIncognitoMode] = useState(false);

  const webViewRef = useRef<WebView>(null);
  const activeTab = useMemo(() => tabs.find((t) => t.id === currentTabId) ?? tabs[0], [tabs, currentTabId]);

  useEffect(() => downloadManager.subscribe(setDownloads), []);

  const navigate = () => {
    const input = addressBar.trim();
    const url = input.startsWith('http') ? input : `https://duckduckgo.com/?q=${encodeURIComponent(input)}`;
    setTabs((prev) => updateTab(prev, activeTab.id, { url }));
  };

  const openNewTab = () => {
    const tab = createTab('https://duckduckgo.com', incognitoMode);
    setTabs((prev) => [tab, ...prev]);
    setCurrentTabId(tab.id);
    setAddressBar(tab.url);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TextInput value={addressBar} onChangeText={setAddressBar} onSubmitEditing={navigate} style={styles.input} />
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
        onShouldStartLoadWithRequest={() => true}
        injectedJavaScriptBeforeContentLoaded={webViewInjectedPrivacyScript}
        onNavigationStateChange={(state) => {
          setAddressBar(state.url);
          setTabs((prev) => updateTab(prev, activeTab.id, { title: state.title ?? 'Tab', url: state.url }));
          if (detectMediaFromUrl(state.url)) {
            downloadManager.enqueue(state.url, extractFilename(state.url));
          }
        }}
      />

      <View style={styles.footer}>
        <Pressable onPress={() => webViewRef.current?.goBack()}><Ionicons name="arrow-back" size={22} color="#fff" /></Pressable>
        <Pressable onPress={() => webViewRef.current?.reload()}><Ionicons name="refresh" size={22} color="#fff" /></Pressable>
        <Pressable onPress={openNewTab}><Ionicons name="add-circle" size={24} color="#fff" /></Pressable>
        <Pressable onPress={() => setShowTabs(true)}><Text style={styles.tabCount}>{tabs.length}</Text></Pressable>
        <Pressable onPress={() => {
          setIncognitoMode((v) => !v);
          const incTab = createTab('https://duckduckgo.com', !incognitoMode);
          setTabs((prev) => [incTab, ...prev]);
          setCurrentTabId(incTab.id);
        }}><Ionicons name="eye-off" size={22} color={incognitoMode ? '#8ac926' : '#fff'} /></Pressable>
        <Pressable onPress={() => setTabs((prev) => updateTab(prev, activeTab.id, { userAgentMode: activeTab.userAgentMode === 'mobile' ? 'desktop' : 'mobile' }))}><Ionicons name="desktop" size={22} color="#fff" /></Pressable>
      </View>

      <Modal visible={showTabs} transparent animationType="slide">
        <View style={styles.modal}>
          <Text style={styles.modalTitle}>Tabs</Text>
          <FlatList
            data={tabs}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <Pressable style={styles.tabItem} onPress={() => { setCurrentTabId(item.id); setShowTabs(false); }}>
                <Text style={styles.tabText}>{item.incognito ? '🕶️ ' : ''}{item.title}</Text>
              </Pressable>
            )}
          />
          <Text style={styles.modalTitle}>Downloads ({downloads.length})</Text>
          <FlatList
            data={downloads}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={styles.downloadItem}>
                <Text style={styles.tabText}>{item.filename}</Text>
                <Text style={styles.subText}>{item.status} {(item.progress * 100).toFixed(0)}%</Text>
              </View>
            )}
          />
          <Text style={styles.subText}>Proxy profile: {defaultProfiles[0].name}</Text>
          <Pressable style={styles.closeBtn} onPress={() => setShowTabs(false)}><Text style={{ color: '#fff' }}>Close</Text></Pressable>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0f1c' },
  header: { flexDirection: 'row', gap: 10, alignItems: 'center', padding: 10 },
  input: { flex: 1, backgroundColor: '#1d2538', color: '#fff', borderRadius: 10, paddingHorizontal: 12, height: 42 },
  webview: { flex: 1, backgroundColor: '#fff' },
  footer: { flexDirection: 'row', justifyContent: 'space-around', padding: 12, backgroundColor: '#111827' },
  tabCount: { color: '#fff', fontWeight: '700' },
  modal: { flex: 1, marginTop: 80, backgroundColor: '#101828', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 16 },
  modalTitle: { color: '#fff', fontSize: 18, fontWeight: '700', marginBottom: 8 },
  tabItem: { padding: 10, borderBottomWidth: 1, borderBottomColor: '#334155' },
  tabText: { color: '#fff' },
  subText: { color: '#94a3b8', fontSize: 12 },
  downloadItem: { paddingVertical: 6 },
  closeBtn: { marginTop: 12, alignSelf: 'center', backgroundColor: '#2563eb', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10 },
});
