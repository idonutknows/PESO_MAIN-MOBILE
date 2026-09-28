import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as ImagePicker from 'expo-image-picker';

import { ThemedText } from '@/components/themed-text';
import { PrimaryButton } from '@/components/resume/FormControls';
import ContentEditor from '@/components/resume/ContentEditor';
import DesignEditor from '@/components/resume/DesignEditor';
import PreviewPane from '@/components/resume/PreviewPane';
import { TEMPLATE_MAP } from '@/constants/resumeDesign';
import { API_ENDPOINTS } from '@/constants/api';
import { useAuth } from '@/contexts/AuthContext';
import {
  applyTemplateDefaults,
  emptyContent,
  newDesign,
  seedFromJobSeekerProfile,
  seedFromResumeData,
  type ApiJobSeekerProfile,
  type ApiResumeData,
} from '@/utils/resumeModel';
import { buildResumeHTML } from '@/utils/resumeHtml';
import { hydrate, loadSavedResume, saveResume } from '@/utils/resumeStorage';
import type { ResumeContent, ResumeDesign, TemplateKey } from '@/types/resume';

type Tab = 'content' | 'design' | 'preview';

const TABS: { key: Tab; label: string }[] = [
  { key: 'content', label: 'Content' },
  { key: 'design', label: 'Design' },
  { key: 'preview', label: 'Preview' },
];

export default function ResumeEditorScreen() {
  const router = useRouter();
  const { template } = useLocalSearchParams<{ template?: string | string[] }>();
  const { token, user, isLoading: authLoading } = useAuth();
  const { width } = useWindowDimensions();
  const wide = width >= 1000;

  // A template tapped in the gallery is applied once, on first load.
  const requestedTemplate = isTemplateKey(template) ? template : null;
  const appliedTemplate = useRef<TemplateKey | null>(null);

  const [content, setContent] = useState<ResumeContent>(emptyContent);
  const [design, setDesign] = useState<ResumeDesign>(() => newDesign());
  const [tab, setTab] = useState<Tab>('content');
  const [loading, setLoading] = useState(true);
  const [dirty, setDirty] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [restored, setRestored] = useState(false);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [exporting, setExporting] = useState(false);
  const ready = useRef(false);

  /* ---------------- load ---------------- */

  const load = useCallback(async () => {
    try {
      const stored = await loadSavedResume(user?.id);
      const wanted =
        requestedTemplate && appliedTemplate.current !== requestedTemplate
          ? (appliedTemplate.current = requestedTemplate)
          : null;

      if (stored) {
        const { content: c, design: d } = hydrate(stored);
        setContent(c);
        setDesign(wanted ? applyTemplateDefaults(d, wanted) : d);
        setSavedAt(stored.savedAt);
        setRestored(true);
        return;
      }

      const seed = await seedFromProfile(token);
      const preferred = wanted ?? seed?.templateKey ?? null;
      if (seed) setContent(seed.content);
      setDesign((prev) => (preferred ? applyTemplateDefaults(prev, preferred) : prev));
      setRestored(false);
    } finally {
      ready.current = true;
      setLoading(false);
    }
  }, [token, user?.id, requestedTemplate]);

  // `load` is async, so the first setState lands after the first await and the
  // spinner only ever clears — no cascading render.
  useEffect(() => {
    // Seeding needs the token, so wait for AuthContext to settle first.
    if (authLoading) return;
    load();
  }, [load, authLoading]);

  /* ---------------- autosave ---------------- */

  useEffect(() => {
    if (!ready.current) return;
    setDirty(true);
    const handle = setTimeout(async () => {
      const saved = await saveResume(user?.id, content, design);
      setSavedAt(saved.savedAt);
      setDirty(false);
    }, 900);
    return () => clearTimeout(handle);
  }, [content, design, user?.id]);

  /* ---------------- mutations ---------------- */

  const updateContent = useCallback((next: ResumeContent) => setContent(next), []);
  const updateDesign = useCallback((next: ResumeDesign) => setDesign(next), []);

  const persist = useCallback(async () => {
    const saved = await saveResume(user?.id, content, design);
    setSavedAt(saved.savedAt);
    setDirty(false);
    return saved;
  }, [content, design, user?.id]);

  /** Keeps the Laravel `preferred_template` in step so admin-side PDFs agree. */
  const syncTemplateToServer = useCallback(async () => {
    if (!token) return;
    try {
      await fetch(API_ENDPOINTS.resumeUpdateTemplate, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({ template: design.templateKey }),
      });
    } catch {
      // Local copy is the source of truth; a failed sync is not fatal.
    }
  }, [design.templateKey, token]);

  const saveNow = useCallback(async () => {
    await persist();
    await syncTemplateToServer();
    Alert.alert('Saved', 'Your resume has been saved. You can continue editing it any time.');
  }, [persist, syncTemplateToServer]);

  /* ---------------- photo ---------------- */

  const pickPhoto = useCallback(async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission Required', 'Allow photo access to change your resume picture.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });
      if (result.canceled || !result.assets[0]) return;

      const localUri = result.assets[0].uri;
      setPhotoBusy(true);
      // Show the new picture immediately, then push it to the profile.
      setContent((prev) => ({ ...prev, photoUrl: localUri }));

      if (!token) return;
      const formData = new FormData();
      formData.append('photo', {
        uri: localUri,
        type: 'image/jpeg',
        name: 'resume-photo.jpg',
      } as unknown as Blob);
      const res = await fetch(API_ENDPOINTS.profilePhoto, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
        body: formData,
      });
      const json = await res.json();
      if (res.ok && json.photo_url) {
        setContent((prev) => ({ ...prev, photoUrl: json.photo_url }));
      } else {
        setContent((prev) => ({ ...prev, photoUrl: localUri }));
        Alert.alert('Saved locally', json.message || 'Photo kept on this device only.');
      }
    } catch {
      Alert.alert('Error', 'Could not open your photo library.');
    } finally {
      setPhotoBusy(false);
    }
  }, [token]);

  const removePhoto = useCallback(() => {
    setContent((prev) => ({ ...prev, photoUrl: null }));
  }, []);

  /* ---------------- export ---------------- */

  const buildHtml = useCallback(() => {
    return buildResumeHTML(content, design, {
      footerNote: `Updated ${new Date().toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })}`,
    });
  }, [content, design]);

  const exportPdf = useCallback(async () => {
    setExporting(true);
    try {
      await persist();
      const { uri } = await Print.printToFileAsync({ html: buildHtml() });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: 'Export Resume as PDF',
        });
      } else {
        Alert.alert('Saved', `PDF saved to:\n${uri}`);
      }
    } catch (error) {
      Alert.alert('Export Failed', (error as Error)?.message || 'Could not generate the PDF.');
    } finally {
      setExporting(false);
    }
  }, [buildHtml, persist]);

  const printResume = useCallback(async () => {
    setExporting(true);
    try {
      await Print.printAsync({ html: buildHtml() });
    } catch {
      Alert.alert('Print Failed', 'Could not open the print dialog.');
    } finally {
      setExporting(false);
    }
  }, [buildHtml]);

  /* ---------------- render ---------------- */

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#0A7EA4" />
        <ThemedText style={styles.loadingText}>Preparing your resume…</ThemedText>
      </View>
    );
  }

  const panel = (
    <ScrollView
      style={styles.panel}
      contentContainerStyle={styles.panelContent}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {tab === 'content' ? (
        <ContentEditor
          content={content}
          design={design}
          onContent={updateContent}
          onDesign={updateDesign}
          onPickPhoto={pickPhoto}
          onRemovePhoto={removePhoto}
          photoBusy={photoBusy}
        />
      ) : null}
      {tab === 'design' ? (
        <DesignEditor content={content} design={design} onDesign={updateDesign} />
      ) : null}
      {tab === 'preview' && !wide ? (
        <View style={styles.previewEmbed}>
          <View style={styles.previewActions}>
            <PrimaryButton
              label="Export PDF"
              icon="⬇"
              onPress={exportPdf}
              disabled={exporting}
              style={styles.flexBtn}
            />
            <PrimaryButton
              label="Print"
              icon="🖨"
              variant="secondary"
              onPress={printResume}
              disabled={exporting}
              style={styles.flexBtn}
            />
          </View>
          <View style={styles.previewFrame}>
            <PreviewPane content={content} design={design} fill padded={false} />
          </View>
        </View>
      ) : null}
    </ScrollView>
  );

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} hitSlop={8}>
          <Text style={styles.backGlyph}>‹</Text>
        </TouchableOpacity>
        <View style={styles.headerText}>
          <ThemedText style={styles.headerTitle}>Resume Editor</ThemedText>
          <ThemedText style={styles.headerSub} numberOfLines={1}>
            {TEMPLATE_MAP[design.templateKey]?.name} · {dirty ? 'Saving…' : savedLabel(savedAt)}
          </ThemedText>
        </View>
        <TouchableOpacity onPress={saveNow} style={styles.saveBtn} activeOpacity={0.8}>
          <Text style={styles.saveBtnText}>Save</Text>
        </TouchableOpacity>
      </View>

      {/* Action bar */}
      <View style={styles.actionBar}>
        <PrimaryButton
          label={exporting ? 'Working…' : 'Export PDF'}
          icon="⬇"
          onPress={exportPdf}
          disabled={exporting}
          style={styles.flexBtn}
        />
        <PrimaryButton
          label="Print"
          icon="🖨"
          variant="secondary"
          onPress={printResume}
          disabled={exporting}
          style={styles.flexBtn}
        />
      </View>

      {restored ? (
        <View style={styles.notice}>
          <Text style={styles.noticeIcon}>💾</Text>
          <ThemedText style={styles.noticeText}>
            Restored from your last save. Changes you make now replace it.
          </ThemedText>
        </View>
      ) : null}

      {wide ? (
        /* Desktop / tablet: live preview beside the editor */
        <View style={styles.split}>
          <View style={styles.splitPreview}>
            <PreviewPane content={content} design={design} fill />
          </View>
          <View style={styles.splitPanel}>
            <View style={styles.tabs}>
              {TABS.filter((t) => t.key !== 'preview').map((item) => (
                <TouchableOpacity
                  key={item.key}
                  onPress={() => setTab(item.key)}
                  style={[styles.tab, tab === item.key ? styles.tabActive : null]}
                >
                  <ThemedText style={[styles.tabText, tab === item.key ? styles.tabTextActive : null]}>
                    {item.label}
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </View>
            {panel}
          </View>
        </View>
      ) : (
        <>
          <View style={styles.tabs}>
            {TABS.map((item) => (
              <TouchableOpacity
                key={item.key}
                onPress={() => setTab(item.key)}
                style={[styles.tab, tab === item.key ? styles.tabActive : null]}
              >
                <ThemedText style={[styles.tabText, tab === item.key ? styles.tabTextActive : null]}>
                  {item.label}
                </ThemedText>
              </TouchableOpacity>
            ))}
          </View>
          {panel}
        </>
      )}
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

function savedLabel(savedAt: string | null): string {
  if (!savedAt) return 'Not saved yet';
  const date = new Date(savedAt);
  if (Number.isNaN(date.getTime())) return 'Saved';
  const today = new Date();
  const sameDay =
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate();
  const time = date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
  return sameDay ? `Saved today at ${time}` : `Saved ${date.toLocaleDateString()}`;
}

/** Pulls the job seeker's real profile in to pre-fill every field. */
async function seedFromProfile(
  token: string | null
): Promise<{ content: ResumeContent; templateKey?: TemplateKey } | null> {
  if (!token) return null;
  const headers = { Authorization: `Bearer ${token}`, Accept: 'application/json' };

  try {
    const res = await fetch(API_ENDPOINTS.resumePreview, { headers });
    if (res.ok) {
      const json = (await res.json()) as { data?: ApiResumeData; template?: string };
      if (json?.data) {
        return {
          content: seedFromResumeData(json.data),
          templateKey: isTemplateKey(json.template) ? json.template : undefined,
        };
      }
    }
  } catch {
    // fall through to the profile endpoint
  }

  try {
    const res = await fetch(API_ENDPOINTS.jobSeekerProfile, { headers });
    if (!res.ok) return null;
    const json = (await res.json()) as { job_seeker?: ApiJobSeekerProfile };
    if (!json?.job_seeker) return null;
    return { content: seedFromJobSeekerProfile(json.job_seeker) };
  } catch {
    return null;
  }
}

function isTemplateKey(value: unknown): value is TemplateKey {
  return typeof value === 'string' && value in TEMPLATE_MAP;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F2F2F7',
  },
  loadingText: {
    marginTop: 14,
    fontSize: 14,
    color: '#6B7280',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#0A7EA4',
    paddingTop: Platform.OS === 'ios' ? 58 : 44,
    paddingBottom: 14,
    paddingHorizontal: 16,
  },
  backBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backGlyph: {
    color: '#FFFFFF',
    fontSize: 26,
    lineHeight: 30,
    marginTop: -3,
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
  },
  headerSub: {
    color: 'rgba(255,255,255,0.82)',
    fontSize: 12,
    marginTop: 2,
  },
  saveBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
  },
  saveBtnText: {
    color: '#0A7EA4',
    fontSize: 13,
    fontWeight: '800',
  },
  actionBar: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 14,
  },
  flexBtn: {
    flex: 1,
  },
  notice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginHorizontal: 16,
    marginTop: 12,
    backgroundColor: '#E6F4FE',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  noticeIcon: {
    fontSize: 15,
  },
  noticeText: {
    flex: 1,
    fontSize: 12,
    color: '#0A7EA4',
    lineHeight: 17,
  },
  tabs: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 14,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: '#0A7EA4',
    borderColor: '#0A7EA4',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#6B7280',
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  panel: {
    flex: 1,
  },
  panelContent: {
    padding: 16,
    paddingBottom: 60,
  },
  split: {
    flex: 1,
    flexDirection: 'row',
    marginTop: 14,
  },
  splitPreview: {
    flex: 1,
  },
  splitPanel: {
    flex: 1,
    borderLeftWidth: 1,
    borderLeftColor: '#E5E7EB',
  },
  previewEmbed: {
    marginHorizontal: -16,
    marginTop: 4,
  },
  previewActions: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  previewFrame: {
    height: 560,
  },
});
