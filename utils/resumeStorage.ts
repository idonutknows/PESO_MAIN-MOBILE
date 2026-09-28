import AsyncStorage from '@react-native-async-storage/async-storage';

import { emptyContent, newDesign } from '@/utils/resumeModel';
import type { ResumeContent, ResumeDesign, SavedResume } from '@/types/resume';

const PREFIX = '@peso_resume_v1';

/**
 * The Laravel API has no endpoint that stores arbitrary resume content, and the
 * web build cannot reach the API at all (no CORS config server side), so the
 * builder persists locally. AsyncStorage is backed by localStorage on web,
 * which keeps one code path for mobile and desktop.
 */
export function storageKey(userId: number | string | null | undefined): string {
  return `${PREFIX}_${userId ?? 'guest'}`;
}

export async function loadSavedResume(
  userId: number | string | null | undefined
): Promise<SavedResume | null> {
  try {
    const raw = await AsyncStorage.getItem(storageKey(userId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SavedResume;
    if (!parsed || typeof parsed !== 'object' || !parsed.content || !parsed.design) return null;
    return parsed;
  } catch (error) {
    console.warn('[ResumeBuilder] Failed to load saved resume', error);
    return null;
  }
}

export async function saveResume(
  userId: number | string | null | undefined,
  content: ResumeContent,
  design: ResumeDesign
): Promise<SavedResume> {
  const payload: SavedResume = {
    content,
    design,
    savedAt: new Date().toISOString(),
    source: 'profile',
  };
  try {
    await AsyncStorage.setItem(storageKey(userId), JSON.stringify(payload));
  } catch (error) {
    console.warn('[ResumeBuilder] Failed to persist resume', error);
  }
  return payload;
}

export async function clearSavedResume(
  userId: number | string | null | undefined
): Promise<void> {
  try {
    await AsyncStorage.removeItem(storageKey(userId));
  } catch (error) {
    console.warn('[ResumeBuilder] Failed to clear saved resume', error);
  }
}

/** Fills in any keys added by later versions so old drafts never break the editor. */
export function hydrate(saved: SavedResume): { content: ResumeContent; design: ResumeDesign } {
  const baseContent: ResumeContent = {
    ...emptyContent(),
    ...saved.content,
    experience: Array.isArray(saved.content?.experience) ? saved.content.experience : [],
    education: Array.isArray(saved.content?.education) ? saved.content.education : [],
    skills: Array.isArray(saved.content?.skills) ? saved.content.skills : [],
    certifications: Array.isArray(saved.content?.certifications) ? saved.content.certifications : [],
    projects: Array.isArray(saved.content?.projects) ? saved.content.projects : [],
    trainings: Array.isArray(saved.content?.trainings) ? saved.content.trainings : [],
    references: Array.isArray(saved.content?.references) ? saved.content.references : [],
  };

  const fallbackOrder = newDesign().sectionOrder;
  const baseDesign: ResumeDesign = {
    ...newDesign(saved.design?.templateKey ?? 'modern-professional'),
    ...saved.design,
    headings: { ...(saved.design?.headings ?? {}) },
    hiddenSections: Array.isArray(saved.design?.hiddenSections) ? saved.design.hiddenSections : [],
    sectionOrder:
      Array.isArray(saved.design?.sectionOrder) && saved.design.sectionOrder.length
        ? saved.design.sectionOrder
        : fallbackOrder,
  };

  return { content: baseContent, design: baseDesign };
}
