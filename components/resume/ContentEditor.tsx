import { useState } from 'react';
import { ActivityIndicator, Image, Text, TouchableOpacity, View } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import { ThemedText } from '@/components/themed-text';
import { Card, Field, MoveButtons, PrimaryButton, ToggleRow } from '@/components/resume/FormControls';
import { SECTIONS, SECTION_MAP } from '@/constants/resumeDesign';
import {
  emptyEducation,
  emptyExperience,
  emptyProject,
  emptyReference,
  resolvePhotoSrc,
} from '@/utils/resumeModel';
import type {
  EducationEntry,
  ExperienceEntry,
  ProjectEntry,
  ReferenceEntry,
  ResumeContent,
  ResumeDesign,
  SectionKind,
} from '@/types/resume';

export interface ContentEditorProps {
  content: ResumeContent;
  design: ResumeDesign;
  onContent: (next: ResumeContent) => void;
  onDesign: (next: ResumeDesign) => void;
  onPickPhoto: () => void;
  onRemovePhoto: () => void;
  photoBusy: boolean;
}

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

function toLines(value: string[]): string {
  return value.join('\n');
}

function fromLines(value: string): string[] {
  return value
    .split('\n')
    .map((v) => v.replace(/^[-•*·]\s*/, '').trim())
    .filter(Boolean);
}

function move<T>(list: T[], from: number, to: number): T[] {
  if (to < 0 || to >= list.length) return list;
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

function listToText(value: string[]): string {
  return value.join(', ');
}

function textToList(value: string): string[] {
  return value
    .split(/[\n,;]+/)
    .map((v) => v.trim())
    .filter(Boolean);
}

/* ------------------------------------------------------------------ */
/* Entry editors                                                       */
/* ------------------------------------------------------------------ */

function EntryShell({
  index,
  total,
  title,
  onUp,
  onDown,
  onRemove,
  children,
}: {
  index: number;
  total: number;
  title: string;
  onUp: () => void;
  onDown: () => void;
  onRemove: () => void;
  children: React.ReactNode;
}) {
  return (
    <View style={entryStyles.shell}>
      <View style={entryStyles.head}>
        <View style={entryStyles.headLeft}>
          <View style={entryStyles.badge}>
            <Text style={entryStyles.badgeText}>{index + 1}</Text>
          </View>
          <ThemedText style={entryStyles.headTitle} numberOfLines={1}>
            {title}
          </ThemedText>
        </View>
        <MoveButtons onUp={onUp} onDown={onDown} onRemove={onRemove} canRemove={total > 1} />
      </View>
      {children}
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* Section bodies                                                      */
/* ------------------------------------------------------------------ */

interface SectionBodyProps {
  kind: SectionKind;
  content: ResumeContent;
  onContent: (next: ResumeContent) => void;
}

function ExperienceEditor({
  entries,
  onChange,
  onMove,
}: {
  entries: ExperienceEntry[];
  onChange: (next: ExperienceEntry[]) => void;
  onMove: (from: number, to: number) => void;
}) {
  const update = (id: string, patch: Partial<ExperienceEntry>) =>
    onChange(entries.map((e) => (e.id === id ? { ...e, ...patch } : e)));

  return (
    <View>
      {entries.map((entry, i) => (
        <EntryShell
          key={entry.id}
          index={i}
          total={entries.length}
          title={entry.position || entry.company || 'New role'}
          onUp={() => onMove(i, i - 1)}
          onDown={() => onMove(i, i + 1)}
          onRemove={() => onChange(entries.filter((e) => e.id !== entry.id))}
        >
          <Field
            label="Position / Job Title"
            value={entry.position}
            onChangeText={(v) => update(entry.id, { position: v })}
            placeholder="e.g. Construction Worker"
          />
          <Field
            label="Company"
            value={entry.company}
            onChangeText={(v) => update(entry.id, { company: v })}
            placeholder="e.g. ABC Construction"
          />
          <View style={entryStyles.pair}>
            <View style={entryStyles.pairItem}>
              <Field
                label="Location"
                value={entry.location}
                onChangeText={(v) => update(entry.id, { location: v })}
                placeholder="City"
              />
            </View>
            <View style={entryStyles.pairItem}>
              <Field
                label="Period"
                value={entry.period}
                onChangeText={(v) => update(entry.id, { period: v })}
                placeholder="2021 – 2024"
              />
            </View>
          </View>
          <Field
            label="Responsibilities & Achievements"
            value={entry.details}
            onChangeText={(v) => update(entry.id, { details: v })}
            placeholder={'• Managed a team of 5\n• Delivered projects on schedule'}
            multiline
            hint="One achievement per line"
          />
        </EntryShell>
      ))}
      <PrimaryButton label="Add Role" icon="+" variant="secondary" onPress={() => onChange([...entries, emptyExperience()])} />
    </View>
  );
}

function EducationEditor({
  entries,
  onChange,
  onMove,
}: {
  entries: EducationEntry[];
  onChange: (next: EducationEntry[]) => void;
  onMove: (from: number, to: number) => void;
}) {
  const update = (id: string, patch: Partial<EducationEntry>) =>
    onChange(entries.map((e) => (e.id === id ? { ...e, ...patch } : e)));

  return (
    <View>
      {entries.map((entry, i) => (
        <EntryShell
          key={entry.id}
          index={i}
          total={entries.length}
          title={entry.degree || entry.school || 'New qualification'}
          onUp={() => onMove(i, i - 1)}
          onDown={() => onMove(i, i + 1)}
          onRemove={() => onChange(entries.filter((e) => e.id !== entry.id))}
        >
          <Field
            label="Qualification"
            value={entry.degree}
            onChangeText={(v) => update(entry.id, { degree: v })}
            placeholder="e.g. Bachelor of Science in Civil Engineering"
          />
          <Field
            label="School"
            value={entry.school}
            onChangeText={(v) => update(entry.id, { school: v })}
            placeholder="e.g. University of the Philippines"
          />
          <View style={entryStyles.pair}>
            <View style={entryStyles.pairItem}>
              <Field
                label="Location"
                value={entry.location}
                onChangeText={(v) => update(entry.id, { location: v })}
                placeholder="City"
              />
            </View>
            <View style={entryStyles.pairItem}>
              <Field
                label="Period"
                value={entry.period}
                onChangeText={(v) => update(entry.id, { period: v })}
                placeholder="2015 – 2019"
              />
            </View>
          </View>
          <Field
            label="Details"
            value={entry.details}
            onChangeText={(v) => update(entry.id, { details: v })}
            placeholder={'• Best thesis award\n• Dean’s list'}
            multiline
          />
        </EntryShell>
      ))}
      <PrimaryButton label="Add Qualification" icon="+" variant="secondary" onPress={() => onChange([...entries, emptyEducation()])} />
    </View>
  );
}

function ProjectEditor({
  entries,
  onChange,
  onMove,
}: {
  entries: ProjectEntry[];
  onChange: (next: ProjectEntry[]) => void;
  onMove: (from: number, to: number) => void;
}) {
  const update = (id: string, patch: Partial<ProjectEntry>) =>
    onChange(entries.map((e) => (e.id === id ? { ...e, ...patch } : e)));

  return (
    <View>
      {entries.map((entry, i) => (
        <EntryShell
          key={entry.id}
          index={i}
          total={entries.length}
          title={entry.name || 'New project'}
          onUp={() => onMove(i, i - 1)}
          onDown={() => onMove(i, i + 1)}
          onRemove={() => onChange(entries.filter((e) => e.id !== entry.id))}
        >
          <Field
            label="Project Name"
            value={entry.name}
            onChangeText={(v) => update(entry.id, { name: v })}
            placeholder="e.g. Community Mapping App"
          />
          <View style={entryStyles.pair}>
            <View style={entryStyles.pairItem}>
              <Field
                label="Your Role"
                value={entry.role}
                onChangeText={(v) => update(entry.id, { role: v })}
                placeholder="Developer"
              />
            </View>
            <View style={entryStyles.pairItem}>
              <Field
                label="Period"
                value={entry.period}
                onChangeText={(v) => update(entry.id, { period: v })}
                placeholder="2023"
              />
            </View>
          </View>
          <Field
            label="Link"
            value={entry.link}
            onChangeText={(v) => update(entry.id, { link: v })}
            placeholder="https://"
            autoCapitalize="none"
            keyboardType="url"
          />
          <Field
            label="Highlights"
            value={entry.details}
            onChangeText={(v) => update(entry.id, { details: v })}
            placeholder={'• Built with React Native\n• Served 500+ users'}
            multiline
          />
        </EntryShell>
      ))}
      <PrimaryButton label="Add Project" icon="+" variant="secondary" onPress={() => onChange([...entries, emptyProject()])} />
    </View>
  );
}

function ReferenceEditor({
  entries,
  onChange,
  onMove,
}: {
  entries: ReferenceEntry[];
  onChange: (next: ReferenceEntry[]) => void;
  onMove: (from: number, to: number) => void;
}) {
  const update = (id: string, patch: Partial<ReferenceEntry>) =>
    onChange(entries.map((e) => (e.id === id ? { ...e, ...patch } : e)));

  return (
    <View>
      {entries.map((entry, i) => (
        <EntryShell
          key={entry.id}
          index={i}
          total={entries.length}
          title={entry.name || 'New reference'}
          onUp={() => onMove(i, i - 1)}
          onDown={() => onMove(i, i + 1)}
          onRemove={() => onChange(entries.filter((e) => e.id !== entry.id))}
        >
          <Field
            label="Name"
            value={entry.name}
            onChangeText={(v) => update(entry.id, { name: v })}
            placeholder="Full name"
          />
          <View style={entryStyles.pair}>
            <View style={entryStyles.pairItem}>
              <Field
                label="Position"
                value={entry.position}
                onChangeText={(v) => update(entry.id, { position: v })}
                placeholder="Supervisor"
              />
            </View>
            <View style={entryStyles.pairItem}>
              <Field
                label="Company"
                value={entry.company}
                onChangeText={(v) => update(entry.id, { company: v })}
                placeholder="Organisation"
              />
            </View>
          </View>
          <Field
            label="Contact"
            value={entry.contact}
            onChangeText={(v) => update(entry.id, { contact: v })}
            placeholder="Phone or email"
          />
        </EntryShell>
      ))}
      <PrimaryButton label="Add Reference" icon="+" variant="secondary" onPress={() => onChange([...entries, emptyReference()])} />
    </View>
  );
}

function SectionBody({ kind, content, onContent }: SectionBodyProps) {
  switch (kind) {
    case 'summary':
      return (
        <Field
          label="Professional Summary"
          value={content.summary}
          onChangeText={(v) => onContent({ ...content, summary: v })}
          placeholder="A short paragraph describing who you are and what you bring."
          multiline
          hint="Leave a blank line to start a new paragraph."
        />
      );
    case 'experience':
      return (
        <ExperienceEditor
          entries={content.experience}
          onChange={(experience) => onContent({ ...content, experience })}
          onMove={(from, to) => onContent({ ...content, experience: move(content.experience, from, to) })}
        />
      );
    case 'education':
      return (
        <EducationEditor
          entries={content.education}
          onChange={(education) => onContent({ ...content, education })}
          onMove={(from, to) => onContent({ ...content, education: move(content.education, from, to) })}
        />
      );
    case 'projects':
      return (
        <ProjectEditor
          entries={content.projects}
          onChange={(projects) => onContent({ ...content, projects })}
          onMove={(from, to) => onContent({ ...content, projects: move(content.projects, from, to) })}
        />
      );
    case 'references':
      return (
        <ReferenceEditor
          entries={content.references}
          onChange={(references) => onContent({ ...content, references })}
          onMove={(from, to) => onContent({ ...content, references: move(content.references, from, to) })}
        />
      );
    case 'skills':
      return (
        <Field
          label="Skills"
          value={listToText(content.skills)}
          onChangeText={(v) => onContent({ ...content, skills: textToList(v) })}
          placeholder="Welding, Carpentry, Auto Mechanics"
          multiline
          hint="Separate with commas or new lines."
        />
      );
    case 'certifications':
      return (
        <Field
          label="Certifications"
          value={toLines(content.certifications)}
          onChangeText={(v) => onContent({ ...content, certifications: fromLines(v) })}
          placeholder={'TESDA NC II Welding\nNC III Carpentry'}
          multiline
          hint="One certificate per line."
        />
      );
    case 'training':
      return (
        <Field
          label="Training & Seminars"
          value={toLines(content.trainings)}
          onChangeText={(v) => onContent({ ...content, trainings: fromLines(v) })}
          placeholder={'Workplace Safety Seminar\nFirst Aid Training'}
          multiline
          hint="One training per line."
        />
      );
    case 'additional':
    default:
      return (
        <Field
          label="Other Information"
          value={content.additional}
          onChangeText={(v) => onContent({ ...content, additional: v })}
          placeholder={'Professional Licenses\nWilling to work abroad\nAvailable immediately'}
          multiline
          hint="One item per line."
        />
      );
  }
}

/* ------------------------------------------------------------------ */
/* Panel                                                               */
/* ------------------------------------------------------------------ */

export default function ContentEditor({
  content,
  design,
  onContent,
  onDesign,
  onPickPhoto,
  onRemovePhoto,
  photoBusy,
}: ContentEditorProps) {
  const [showHeadings, setShowHeadings] = useState(false);
  const photo = resolvePhotoSrc(content.photoUrl);
  const order = design.sectionOrder;
  const hidden = new Set(design.hiddenSections);

  const patchOrder = (from: number, to: number) =>
    onDesign({ ...design, sectionOrder: move(order, from, to) });

  const toggleHidden = (kind: SectionKind) => {
    const next = hidden.has(kind)
      ? design.hiddenSections.filter((k) => k !== kind)
      : [...design.hiddenSections, kind];
    onDesign({ ...design, hiddenSections: next });
  };

  const setHeading = (kind: SectionKind, value: string) => {
    const headings = { ...design.headings };
    if (value.trim()) headings[kind] = value;
    else delete headings[kind];
    onDesign({ ...design, headings });
  };

  return (
    <View>
      {/* ---------- Identity ---------- */}
      <Card title="Profile Photo" icon="🖼️">
        <View style={photoStyles.row}>
          <TouchableOpacity onPress={onPickPhoto} activeOpacity={0.8} style={photoStyles.tap}>
            {photo ? (
              <Image source={{ uri: photo }} style={photoStyles.image} />
            ) : (
              <View style={[photoStyles.image, photoStyles.placeholder]}>
                <MaterialIcons name="person" size={28} color="#9CA3AF" />
              </View>
            )}
            {photoBusy ? (
              <View style={photoStyles.busy}>
                <ActivityIndicator size="small" color="#FFFFFF" />
              </View>
            ) : null}
          </TouchableOpacity>
          <View style={photoStyles.info}>
            <ThemedText style={photoStyles.infoTitle}>Photo</ThemedText>
            <ThemedText style={photoStyles.infoText}>
              Used by templates that support photos. Saved to your PESO profile.
            </ThemedText>
            <View style={photoStyles.actions}>
              <PrimaryButton
                label={photo ? 'Change' : 'Upload'}
                variant="secondary"
                onPress={onPickPhoto}
                style={photoStyles.actionBtn}
              />
              {photo ? (
                <PrimaryButton
                  label="Remove"
                  variant="danger"
                  onPress={onRemovePhoto}
                  style={photoStyles.actionBtn}
                />
              ) : null}
            </View>
          </View>
        </View>
      </Card>

      <Card title="Personal Details" icon="👤">
        <Field
          label="Full Name"
          value={content.fullName}
          onChangeText={(v) => onContent({ ...content, fullName: v })}
          placeholder="Juan Dela Cruz"
        />
        <Field
          label="Professional Title"
          value={content.title}
          onChangeText={(v) => onContent({ ...content, title: v })}
          placeholder="e.g. Construction Worker"
          hint="Shown under your name. Leave blank to hide it."
        />
        <View style={entryStyles.pair}>
          <View style={entryStyles.pairItem}>
            <Field
              label="Email"
              value={content.email}
              onChangeText={(v) => onContent({ ...content, email: v })}
              placeholder="you@email.com"
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>
          <View style={entryStyles.pairItem}>
            <Field
              label="Phone"
              value={content.phone}
              onChangeText={(v) => onContent({ ...content, phone: v })}
              placeholder="09XX XXX XXXX"
              keyboardType="phone-pad"
            />
          </View>
        </View>
        <Field
          label="Address"
          value={content.address}
          onChangeText={(v) => onContent({ ...content, address: v })}
          placeholder="Barangay, Municipality, Province"
        />
        <View style={entryStyles.pair}>
          <View style={entryStyles.pairItem}>
            <Field
              label="Website / Portfolio"
              value={content.website}
              onChangeText={(v) => onContent({ ...content, website: v })}
              placeholder="https://"
              keyboardType="url"
              autoCapitalize="none"
            />
          </View>
          <View style={entryStyles.pairItem}>
            <Field
              label="Social / LinkedIn"
              value={content.social}
              onChangeText={(v) => onContent({ ...content, social: v })}
              placeholder="@handle"
              autoCapitalize="none"
            />
          </View>
        </View>
      </Card>

      {/* ---------- Section headings ---------- */}
      <Card
        title="Section Headings"
        icon="🏷️"
        right={
          <TouchableOpacity onPress={() => setShowHeadings((v) => !v)} activeOpacity={0.75}>
            <ThemedText style={headingToggle}>{showHeadings ? 'Hide' : 'Customise'}</ThemedText>
          </TouchableOpacity>
        }
      >
        {showHeadings ? (
          <View>
            <ThemedText style={headingHint}>
              Rename any section heading exactly as it should appear on the page.
            </ThemedText>
            {SECTIONS.map((meta) => (
              <Field
                key={meta.kind}
                label={meta.label}
                value={design.headings[meta.kind] ?? ''}
                onChangeText={(v) => setHeading(meta.kind, v)}
                placeholder={meta.defaultHeading}
              />
            ))}
          </View>
        ) : (
          <ThemedText style={headingHint}>
            Using the default headings for all {SECTIONS.length} sections.
          </ThemedText>
        )}
      </Card>

      {/* ---------- Sections ---------- */}
      <ThemedText style={sectionIntro}>
        Drag order with ▲ ▼ and hide anything you do not want on the page.
      </ThemedText>

      {order.map((kind, index) => {
        const meta = SECTION_MAP[kind];
        const isHidden = hidden.has(kind);
        return (
          <Card
            key={kind}
            title={meta.label}
            icon={meta.icon}
            right={
              <MoveButtons
                onUp={() => patchOrder(index, index - 1)}
                onDown={() => patchOrder(index, index + 1)}
                onRemove={() => toggleHidden(kind)}
              />
            }
          >
            <ToggleRow
              label={isHidden ? 'Hidden on the page' : 'Shown on the page'}
              hint={isHidden ? 'Tap to show this section' : 'Tap to hide this section'}
              value={!isHidden}
              onValueChange={() => toggleHidden(kind)}
            />
            {isHidden ? null : <SectionBody kind={kind} content={content} onContent={onContent} />}
          </Card>
        );
      })}
    </View>
  );
}

const photoStyles = {
  row: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 14 },
  tap: { position: 'relative' as const },
  image: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 2,
    borderColor: '#0A7EA4',
  },
  placeholder: {
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: '#F2F2F7',
    borderColor: '#E5E7EB',
  },
  busy: {
    position: 'absolute' as const,
    top: 0,
    right: 0,
    left: 0,
    bottom: 0,
    borderRadius: 38,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  info: { flex: 1 },
  infoTitle: { fontSize: 14, fontWeight: '700' as const, color: '#1C1C1E' },
  infoText: { fontSize: 11, color: '#9CA3AF', marginTop: 3, lineHeight: 16 },
  actions: { flexDirection: 'row' as const, gap: 8, marginTop: 10 },
  actionBtn: { flex: 1, paddingVertical: 9 },
};

const headingToggle = {
  fontSize: 12,
  fontWeight: '700' as const,
  color: '#0A7EA4',
};
const headingHint = {
  fontSize: 12,
  color: '#6B7280',
  lineHeight: 18,
};
const sectionIntro = {
  fontSize: 12,
  color: '#6B7280',
  marginBottom: 12,
  marginTop: 4,
};

const entryStyles = {
  shell: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 12,
    marginBottom: 12,
  },
  head: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    marginBottom: 10,
  },
  headLeft: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
    flex: 1,
  },
  badge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#0A7EA4',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  badgeText: { color: '#FFFFFF', fontSize: 11, fontWeight: '700' as const },
  headTitle: { flex: 1, fontSize: 13, fontWeight: '700' as const, color: '#1C1C1E' },
  pair: { flexDirection: 'row' as const, gap: 10 },
  pairItem: { flex: 1 },
};
