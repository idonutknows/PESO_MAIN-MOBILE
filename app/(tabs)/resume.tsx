import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import { ThemedText } from '@/components/themed-text';
import TemplateThumbnail from '@/components/resume/TemplateThumbnail';
import { RESUME_TEMPLATES, SECTIONS, TEMPLATE_MAP } from '@/constants/resumeDesign';
import { useAuth } from '@/contexts/AuthContext';
import { hydrate, loadSavedResume } from '@/utils/resumeStorage';
import { isDocumentEmpty } from '@/utils/resumeModel';
import type { ResumeContent, ResumeDesign } from '@/types/resume';

const GUTTER = 32;
const GRID_GAP = 12;

/** Two columns on a phone, more once there is room for them. */
function columnsFor(width: number): number {
  if (width >= 1180) return 4;
  if (width >= 820) return 3;
  return 2;
}

export default function ResumeScreen() {
  const router = useRouter();
  const { token, user, hasJobSeekerProfile } = useAuth();
  const { width } = useWindowDimensions();
  const columns = columnsFor(width);
  const cardWidth = Math.round((width - GUTTER - GRID_GAP * (columns - 1)) / columns);

  const [design, setDesign] = useState<ResumeDesign | null>(null);
  const [content, setContent] = useState<ResumeContent | null>(null);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const stored = await loadSavedResume(user?.id);
    if (stored) {
      const hydrated = hydrate(stored);
      setDesign(hydrated.design);
      setContent(hydrated.content);
      setSavedAt(stored.savedAt);
    } else {
      setDesign(null);
      setContent(null);
      setSavedAt(null);
    }
  }, [user?.id]);

  useEffect(() => {
    (async () => {
      await load();
      setLoading(false);
    })();
  }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const selectTemplate = useCallback(
    (key: ResumeDesign['templateKey']) => {
      // The editor owns persistence, so hand it the tapped template and let it
      // apply the spec — that keeps the gallery and the saved design in step.
      router.push({ pathname: '/resume-editor', params: { template: key } });
    },
    [router]
  );

  const currentTemplate = design ? TEMPLATE_MAP[design.templateKey] : null;
  const hasDraft = !!design && !!content && !isDocumentEmpty(content);
  const filledSections = content
    ? SECTIONS.filter((meta) => {
        switch (meta.kind) {
          case 'summary':
            return !!content.summary.trim();
          case 'additional':
            return !!content.additional.trim();
          case 'skills':
            return content.skills.length > 0;
          case 'certifications':
            return content.certifications.length > 0;
          case 'training':
            return content.trainings.length > 0;
          case 'experience':
            return content.experience.length > 0;
          case 'education':
            return content.education.length > 0;
          case 'projects':
            return content.projects.length > 0;
          case 'references':
            return content.references.length > 0;
          default:
            return false;
        }
      }).length
    : 0;

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#0A7EA4" colors={['#0A7EA4']} />}
      >
        {/* Hero */}
        <LinearGradient
          colors={['#0A7EA4', '#0891B2', '#06B6D4']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.hero}
        >
          <ThemedText style={styles.heroTitle}>My Resume</ThemedText>
          <ThemedText style={styles.heroSubtitle}>
            Pick a professional template, then edit every word and every design detail.
          </ThemedText>
          <View style={styles.heroBadges}>
            <View style={styles.heroBadge}>
              <ThemedText style={styles.heroBadgeText}>{RESUME_TEMPLATES.length} Templates</ThemedText>
            </View>
            <View style={styles.heroBadge}>
              <ThemedText style={styles.heroBadgeText}>Live Preview</ThemedText>
            </View>
            <View style={styles.heroBadge}>
              <ThemedText style={styles.heroBadgeText}>PDF Export</ThemedText>
            </View>
          </View>
        </LinearGradient>

        {/* Current draft */}
        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color="#0A7EA4" />
          </View>
        ) : hasDraft && currentTemplate ? (
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Your Current Resume</ThemedText>
            <TouchableOpacity
              style={styles.draftCard}
              onPress={() => router.push('/resume-editor')}
              activeOpacity={0.85}
            >
              <View style={styles.draftTop}>
                <TemplateThumbnail spec={currentTemplate} width={84} />
                <View style={styles.draftInfo}>
                  <ThemedText style={styles.draftName} numberOfLines={1}>
                    {content?.fullName || 'Untitled resume'}
                  </ThemedText>
                  <ThemedText style={styles.draftTemplate}>{currentTemplate.name}</ThemedText>
                  <View style={styles.draftMetaRow}>
                    <View style={styles.metaPill}>
                      <ThemedText style={styles.metaPillText}>{filledSections} sections</ThemedText>
                    </View>
                    <View style={styles.metaPill}>
                      <ThemedText style={styles.metaPillText}>
                        {savedLabel(savedAt)}
                      </ThemedText>
                    </View>
                  </View>
                </View>
                <View style={styles.draftChevron}>
                  <MaterialIcons name="chevron-right" size={22} color="#0A7EA4" />
                </View>
              </View>
              <View style={styles.draftActions}>
                <TouchableOpacity
                  style={styles.primaryBtn}
                  onPress={() => router.push('/resume-editor')}
                  activeOpacity={0.8}
                >
                  <MaterialIcons name="edit" size={16} color="#FFFFFF" />
                  <ThemedText style={styles.primaryBtnText}>Open Editor</ThemedText>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.secondaryBtn}
                  onPress={() => router.push('/resume-editor')}
                  activeOpacity={0.8}
                >
                  <MaterialIcons name="visibility" size={16} color="#0A7EA4" />
                  <ThemedText style={styles.secondaryBtnText}>Preview</ThemedText>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.section}>
            <View style={styles.startCard}>
              <View style={styles.startIcon}>
                <MaterialIcons name="description" size={26} color="#0A7EA4" />
              </View>
              <ThemedText style={styles.startTitle}>
                {hasJobSeekerProfile ? 'Build your resume' : 'Complete your profile first'}
              </ThemedText>
              <ThemedText style={styles.startText}>
                {hasJobSeekerProfile
                  ? 'Your details are already filled in. Choose a template below and the editor will start from your PESO profile.'
                  : 'We need your profile before we can build a resume. It only takes a couple of minutes.'}
              </ThemedText>
              <TouchableOpacity
                style={styles.primaryBtn}
                activeOpacity={0.8}
                onPress={() =>
                  router.push(hasJobSeekerProfile ? '/resume-editor' : '/peso-registration')
                }
              >
                <ThemedText style={styles.primaryBtnText}>
                  {hasJobSeekerProfile ? 'Start Building' : 'Complete Profile'}
                </ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Template gallery */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Choose a Template</ThemedText>
          <ThemedText style={styles.sectionSubtitle}>
            Every layout has a different header, column structure and section style. Tap one to open the editor.
          </ThemedText>
          <View style={styles.grid}>
            {RESUME_TEMPLATES.map((spec) => {
              const active = design?.templateKey === spec.key;
              return (
                <TouchableOpacity
                  key={spec.key}
                  style={[styles.gridItem, { width: cardWidth }]}
                  activeOpacity={0.85}
                  onPress={() => selectTemplate(spec.key)}
                >
                  <TemplateThumbnail spec={spec} width={cardWidth} selected={active} />
                  {active ? (
                    <View style={styles.currentBadge}>
                      <ThemedText style={styles.currentBadgeText}>In use</ThemedText>
                    </View>
                  ) : null}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Tips */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>How it works</ThemedText>
          <View style={styles.tipCard}>
            {[
              { icon: 'auto-awesome' as const, text: 'Every field is prefilled from your PESO profile — refine it in the editor.' },
              { icon: 'tune' as const, text: 'Change colour, font, size, spacing, columns and section order without touching code.' },
              { icon: 'visibility' as const, text: 'The preview is the real A4 page, so the exported PDF matches exactly.' },
              { icon: 'cloud-done' as const, text: 'Your draft saves automatically — close the app and pick up where you left off.' },
            ].map((tip) => (
              <View key={tip.text} style={styles.tipRow}>
                <View style={styles.tipIcon}>
                  <MaterialIcons name={tip.icon} size={16} color="#0A7EA4" />
                </View>
                <ThemedText style={styles.tipText}>{tip.text}</ThemedText>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      {token ? null : (
        <View style={styles.offlineHint}>
          <Text style={styles.offlineText}>Working offline — your resume saves on this device.</Text>
        </View>
      )}
    </View>
  );
}

function savedLabel(savedAt: string | null): string {
  if (!savedAt) return 'Draft';
  const date = new Date(savedAt);
  if (Number.isNaN(date.getTime())) return 'Draft';
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 110,
  },
  hero: {
    paddingTop: 60,
    paddingBottom: 32,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  heroTitle: {
    color: '#FFFFFF',
    fontSize: 30,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  heroSubtitle: {
    color: 'rgba(255,255,255,0.88)',
    fontSize: 14,
    marginTop: 8,
    lineHeight: 20,
  },
  heroBadges: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 16,
  },
  heroBadge: {
    backgroundColor: 'rgba(255,255,255,0.22)',
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  heroBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  section: {
    paddingHorizontal: 16,
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1C1C1E',
  },
  sectionSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 5,
    lineHeight: 18,
  },
  loadingBox: {
    paddingVertical: 48,
    alignItems: 'center',
  },
  draftCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  draftTop: {
    flexDirection: 'row',
    gap: 14,
    alignItems: 'center',
  },
  draftInfo: {
    flex: 1,
  },
  draftName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1C1C1E',
  },
  draftTemplate: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0A7EA4',
    marginTop: 2,
  },
  draftMetaRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 8,
    flexWrap: 'wrap',
  },
  metaPill: {
    backgroundColor: '#F2F2F7',
    borderRadius: 999,
    paddingVertical: 4,
    paddingHorizontal: 9,
  },
  metaPillText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#6B7280',
  },
  draftChevron: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#E6F4FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  draftActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  primaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#0A7EA4',
    borderRadius: 12,
    paddingVertical: 13,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  secondaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingVertical: 13,
  },
  secondaryBtnText: {
    color: '#0A7EA4',
    fontSize: 14,
    fontWeight: '700',
  },
  startCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginTop: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  startIcon: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#E6F4FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  startTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1C1C1E',
    marginTop: 12,
  },
  startText: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: GRID_GAP,
    marginTop: 14,
  },
  gridItem: {
    borderRadius: 12,
  },
  currentBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#0A7EA4',
    borderRadius: 999,
    paddingVertical: 3,
    paddingHorizontal: 8,
  },
  currentBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
  },
  tipCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  tipRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
    paddingVertical: 7,
  },
  tipIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#E6F4FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tipText: {
    flex: 1,
    fontSize: 12,
    color: '#3A3A3C',
    lineHeight: 18,
  },
  offlineHint: {
    position: 'absolute',
    bottom: 86,
    left: 16,
    right: 16,
    backgroundColor: 'rgba(17,24,39,0.85)',
    borderRadius: 10,
    paddingVertical: 8,
    alignItems: 'center',
  },
  offlineText: {
    color: '#FFFFFF',
    fontSize: 11,
  },
});
