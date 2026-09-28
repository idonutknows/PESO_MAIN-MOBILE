import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/contexts/AuthContext';
import { API_ENDPOINTS, API_BASE_URL } from '@/constants/api';
import { useLocalSearchParams, router, useNavigation } from 'expo-router';
import {
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  Platform,
  TextInput,
  Modal,
  RefreshControl,
  AppState,
} from 'react-native';
import { useState, useEffect, useCallback, useRef, useLayoutEffect } from 'react';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';

interface Job {
  id: number;
  job_title: string;
  description: string;
  salary_range: string | null;
  employment_type: string;
  hiring_status: string;
  barangay_name: string | null;
  days_ago: number | null;
  skills: string[];
}

interface EstablishmentDetail {
  id: number;
  company_name: string;
  address: string | null;
  contact_person: string | null;
  contact_number: string | null;
  email: string | null;
  industry_category: string | null;
  logo: string | null;
  logo_url: string | null;
  barangay_name: string | null;
  available_jobs_count: number;
  hiring_status: string;
  jobs: Job[];
}

interface ProfileData {
  first_name: string;
  middle_name: string | null;
  last_name: string;
  email: string | null;
  contact_number: string | null;
  address: string | null;
  barangay?: { barangay_name: string } | null;
  educational_attainment: string | null;
  occupation: string | null;
  employer_company: string | null;
  work_experience_years: number | null;
  skills: string[] | null;
}

interface ResumeData {
  id: number;
  file_path: string | null;
  download_url: string | null;
  template: string;
  status: string;
  job_seeker_id: number;
}

export default function EstablishmentProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { token } = useAuth();
  const [establishment, setEstablishment] = useState<EstablishmentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [applyingJobId, setApplyingJobId] = useState<number | null>(null);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [applicationMessage, setApplicationMessage] = useState('');
  const [expectedSalary, setExpectedSalary] = useState('');
  const [startDate, setStartDate] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [resumeData, setResumeData] = useState<ResumeData | null>(null);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isFetching = useRef(false);
  const navigation = useNavigation();

  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  useEffect(() => {
    if (id) {
      fetchEstablishment();
      pollRef.current = setInterval(fetchEstablishment, 30000);
    }
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [id]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', nextState => {
      if (nextState === 'active' && id) fetchEstablishment();
    });
    return () => sub.remove();
  }, [id]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchEstablishment();
    setRefreshing(false);
  }, []);

  async function handleApplyPress(job: Job) {
    if (applyingJobId) return;
    setApplyingJobId(job.id);
    try {
      const [profileRes, resumeRes] = await Promise.all([
        fetch(API_ENDPOINTS.jobSeekerProfile, {
          headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
        }),
        fetch(API_ENDPOINTS.resume, {
          headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
        }),
      ]);

      const profileJson = await profileRes.json();
      const resumeJson = await resumeRes.json();
      const profile = profileJson.job_seeker;

      if (!profile) {
        Alert.alert('Profile Required', 'Please complete your PESO profiling first before applying.');
        return;
      }

      if (profile.verification_status !== 'approved') {
        Alert.alert('Not Verified', 'Your account is not yet verified. Please wait for PESO Admin to verify your profile before applying.');
        return;
      }

      setProfileData(profile);
      setResumeData(resumeJson.resume || null);
      setSelectedJob(job);
      setApplicationMessage('');
      setExpectedSalary('');
      setStartDate('');
      setAgreedToTerms(false);
      setShowApplyModal(true);
    } catch (err) {
      Alert.alert('Error', 'Failed to load application data.');
    } finally {
      setApplyingJobId(null);
    }
  }

  async function submitApplication() {
    if (!selectedJob) return;
    setSubmitting(true);
    try {
      const res = await fetch(API_ENDPOINTS.applications, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
        body: JSON.stringify({
          job_id: selectedJob.id,
          application_details: applicationMessage || null,
          expected_salary: expectedSalary || null,
          start_date: startDate || null,
        }),
      });
      const json = await res.json();
      setShowApplyModal(false);
      if (res.ok) {
        Alert.alert('Application Submitted!', json.message || 'Your application has been submitted successfully.');
      } else if (res.status === 409) {
        Alert.alert('Already Applied', json.message || 'You have already applied for this job.');
      } else {
        Alert.alert('Error', json.message || 'Failed to submit application.');
      }
    } catch (err: any) {
      Alert.alert('Error', 'Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  async function fetchEstablishment() {
    if (isFetching.current) return;
    isFetching.current = true;
    try {
      const res = await fetch(API_ENDPOINTS.establishmentDetail(Number(id)), {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      });
      if (!res.ok) throw new Error(`Server returned ${res.status}`);
      const json = await res.json();
      let data = null;
      if (json.success && json.data) {
        data = json.data;
      } else if (json.data) {
        data = json.data;
      } else if (json.establishment) {
        data = json.establishment;
      } else {
        data = json;
      }
      if (data) setEstablishment(data);
    } catch (err: any) {
      console.error('Failed to fetch establishment', err.message || err);
      if (loading) Alert.alert('Error', 'Failed to load establishment details.');
    } finally {
      setLoading(false);
      isFetching.current = false;
    }
  }

  function handleCall() {
    if (establishment?.contact_number) {
      Linking.openURL(`tel:${establishment.contact_number}`);
    }
  }

  function handleEmail() {
    if (establishment?.email) {
      Linking.openURL(`mailto:${establishment.email}`);
    }
  }

  function handleMap() {
    if (establishment?.address) {
      const encoded = encodeURIComponent(establishment.address);
      const url = Platform.select({
        ios: `maps:0,0?q=${encoded}`,
        android: `geo:0,0?q=${encoded}`,
        default: `https://www.google.com/maps/search/?api=1&query=${encoded}`,
      });
      Linking.openURL(url!);
    }
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0a7ea4" />
      </View>
    );
  }

  if (!establishment) {
    return (
      <View style={styles.loadingContainer}>
        <ThemedText>Establishment not found.</ThemedText>
      </View>
    );
  }

  const isHiring = establishment.hiring_status === 'hiring';

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#0a7ea4']} />}
      >
        {/* Header / Hero */}
        <ThemedView style={styles.hero}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <ThemedText style={styles.backBtnText}>{'< Back'}</ThemedText>
          </TouchableOpacity>
          <View style={styles.logoContainer}>
            {establishment.logo_url ? (
              <Image source={{ uri: establishment.logo_url }} style={styles.logo} />
            ) : (
              <View style={styles.logoPlaceholder}>
                <ThemedText style={styles.logoPlaceholderText}>
                  {establishment.company_name.charAt(0).toUpperCase()}
                </ThemedText>
              </View>
            )}
          </View>
          <ThemedText style={styles.companyName}>{establishment.company_name}</ThemedText>
          {establishment.industry_category && (
            <ThemedText style={styles.industry}>{establishment.industry_category}</ThemedText>
          )}
          <View style={styles.statusRow}>
            <View style={[styles.statusBadge, isHiring ? styles.hiringBadge : styles.notHiringBadge]}>
              <ThemedText style={styles.statusText}>
                {isHiring ? '● Hiring' : 'Not Hiring'}
              </ThemedText>
            </View>
            <View style={styles.jobCountBadge}>
              <ThemedText style={styles.jobCountText}>
                {establishment.available_jobs_count} open job{establishment.available_jobs_count !== 1 ? 's' : ''}
              </ThemedText>
            </View>
          </View>
        </ThemedView>

        {/* Contact Info */}
        <ThemedView style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Contact Information</ThemedText>
          <View style={styles.infoRow}>
            <ThemedText style={styles.infoLabel}>Person</ThemedText>
            <ThemedText style={styles.infoValue}>{establishment.contact_person || 'N/A'}</ThemedText>
          </View>
          {establishment.contact_number && (
            <TouchableOpacity style={styles.infoRow} onPress={handleCall}>
              <ThemedText style={styles.infoLabel}>Phone</ThemedText>
              <ThemedText style={[styles.infoValue, styles.link]}>{establishment.contact_number}</ThemedText>
            </TouchableOpacity>
          )}
          {establishment.email && (
            <TouchableOpacity style={styles.infoRow} onPress={handleEmail}>
              <ThemedText style={styles.infoLabel}>Email</ThemedText>
              <ThemedText style={[styles.infoValue, styles.link]}>{establishment.email}</ThemedText>
            </TouchableOpacity>
          )}
          {(establishment.address || establishment.barangay_name) && (
            <TouchableOpacity style={styles.infoRow} onPress={handleMap}>
              <ThemedText style={styles.infoLabel}>Location</ThemedText>
              <ThemedText style={[styles.infoValue, styles.link]} numberOfLines={2}>
                {[establishment.address, establishment.barangay_name].filter(Boolean).join(', ')}
              </ThemedText>
            </TouchableOpacity>
          )}
        </ThemedView>

        {/* Open Jobs */}
        <ThemedView style={styles.section}>
          <ThemedText style={styles.sectionTitle}>
            Job Openings ({establishment.available_jobs_count})
          </ThemedText>
          {establishment.jobs.length === 0 ? (
            <ThemedText style={styles.emptyJobs}>No open positions at this time.</ThemedText>
          ) : (
            establishment.jobs.map((job) => (
              <View key={job.id} style={styles.jobCard}>
                <View style={styles.jobHeader}>
                  <ThemedText style={styles.jobTitle}>{job.job_title}</ThemedText>
                  <View style={styles.jobTypeBadge}>
                    <ThemedText style={styles.jobTypeText}>{job.employment_type}</ThemedText>
                  </View>
                </View>
                {job.salary_range && (
                  <ThemedText style={styles.jobSalary}>{job.salary_range}</ThemedText>
                )}
                {job.description ? (
                  <ThemedText style={styles.jobDesc} numberOfLines={3}>{job.description}</ThemedText>
                ) : null}
                {job.skills && job.skills.length > 0 && (
                  <View style={styles.skillsRow}>
                    {job.skills.map((skill, i) => (
                      <View key={i} style={styles.skillChip}>
                        <ThemedText style={styles.skillText}>{skill}</ThemedText>
                      </View>
                    ))}
                  </View>
                )}
                <View style={styles.jobActions}>
                  <TouchableOpacity
                    style={[styles.applyBtn, applyingJobId === job.id && styles.applyBtnDisabled]}
                    onPress={() => handleApplyPress(job)}
                    disabled={applyingJobId === job.id}
                  >
                    <ThemedText style={styles.applyBtnText}>
                      {applyingJobId === job.id ? 'Applying...' : 'Apply Now'}
                    </ThemedText>
                  </TouchableOpacity>
                  {job.days_ago !== null && (
                    <ThemedText style={styles.jobPosted}>
                      Posted {job.days_ago === 0 ? 'today' : `${job.days_ago}d ago`}
                    </ThemedText>
                  )}
                </View>
              </View>
            ))
          )}
        </ThemedView>
      </ScrollView>

      {/* ==================== APPLY MODAL ==================== */}
      <Modal visible={showApplyModal} transparent animationType="slide" onRequestClose={() => setShowApplyModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <View>
                <ThemedText style={styles.modalTitle}>Apply for Job</ThemedText>
                <ThemedText style={styles.modalSubtitle}>Complete your application below</ThemedText>
              </View>
              <TouchableOpacity onPress={() => { setShowApplyModal(false); setSubmitting(false); }} style={styles.modalCloseBtn}>
                <ThemedText style={styles.modalClose}>✕</ThemedText>
              </TouchableOpacity>
            </View>

            {selectedJob && (
              <ScrollView style={styles.modalScrollBody} showsVerticalScrollIndicator={false}>
                {/* ===== JOB INFORMATION ===== */}
                <View style={styles.modalSection}>
                  <View style={styles.sectionHeaderRow}>
                    <ThemedText style={styles.sectionIcon}>📋</ThemedText>
                    <ThemedText style={styles.modalSectionTitle}>Job Information</ThemedText>
                  </View>
                  <View style={styles.modalSectionCard}>
                    <View style={styles.modalFieldRow}>
                      <ThemedText style={styles.fieldReadonlyLabel}>Position</ThemedText>
                      <ThemedText style={styles.fieldReadonlyValue}>{selectedJob.job_title}</ThemedText>
                    </View>
                    <View style={styles.modalFieldRow}>
                      <ThemedText style={styles.fieldReadonlyLabel}>Company</ThemedText>
                      <ThemedText style={styles.fieldReadonlyValue}>{establishment?.company_name}</ThemedText>
                    </View>
                    <View style={styles.modalFieldRow}>
                      <ThemedText style={styles.fieldReadonlyLabel}>Location</ThemedText>
                      <ThemedText style={styles.fieldReadonlyValue}>
                        {[establishment?.address, establishment?.barangay_name].filter(Boolean).join(', ') || 'N/A'}
                      </ThemedText>
                    </View>
                    <View style={[styles.modalFieldRow, styles.modalFieldRowLast]}>
                      <ThemedText style={styles.fieldReadonlyLabel}>Type</ThemedText>
                      <View style={styles.fieldTypeBadge}>
                        <ThemedText style={styles.fieldTypeBadgeText}>{selectedJob.employment_type}</ThemedText>
                      </View>
                    </View>
                  </View>
                </View>

                {/* ===== APPLICANT INFORMATION ===== */}
                <View style={styles.modalSection}>
                  <View style={styles.sectionHeaderRow}>
                    <ThemedText style={styles.sectionIcon}>👤</ThemedText>
                    <ThemedText style={styles.modalSectionTitle}>Applicant Information</ThemedText>
                  </View>
                  <View style={styles.modalSectionCard}>
                    <View style={styles.modalFieldRow}>
                      <ThemedText style={styles.fieldReadonlyLabel}>Full Name</ThemedText>
                      <ThemedText style={styles.fieldReadonlyValue}>
                        {profileData ? [profileData.first_name, profileData.middle_name, profileData.last_name].filter(Boolean).join(' ') : '---'}
                      </ThemedText>
                    </View>
                    <View style={styles.modalFieldRow}>
                      <ThemedText style={styles.fieldReadonlyLabel}>Email</ThemedText>
                      <ThemedText style={styles.fieldReadonlyValue}>{profileData?.email || '---'}</ThemedText>
                    </View>
                    <View style={styles.modalFieldRow}>
                      <ThemedText style={styles.fieldReadonlyLabel}>Mobile</ThemedText>
                      <ThemedText style={styles.fieldReadonlyValue}>{profileData?.contact_number || '---'}</ThemedText>
                    </View>
                    <View style={styles.modalFieldRow}>
                      <ThemedText style={styles.fieldReadonlyLabel}>Address</ThemedText>
                      <ThemedText style={styles.fieldReadonlyValue}>
                        {[profileData?.address, profileData?.barangay?.barangay_name].filter(Boolean).join(', ') || '---'}
                      </ThemedText>
                    </View>
                    <View style={styles.modalFieldRow}>
                      <ThemedText style={styles.fieldReadonlyLabel}>Education</ThemedText>
                      <ThemedText style={styles.fieldReadonlyValue}>{profileData?.educational_attainment || '---'}</ThemedText>
                    </View>
                    <View style={styles.modalFieldRow}>
                      <ThemedText style={styles.fieldReadonlyLabel}>Experience</ThemedText>
                      <ThemedText style={styles.fieldReadonlyValue}>
                        {profileData?.work_experience_years != null ? `${profileData.work_experience_years} year(s)` : '---'}
                      </ThemedText>
                    </View>
                    <View style={[styles.modalFieldRow, styles.modalFieldRowLast]}>
                      <ThemedText style={styles.fieldReadonlyLabel}>Skills</ThemedText>
                      <View style={styles.fieldSkillsWrap}>
                        {profileData?.skills && Array.isArray(profileData.skills) && profileData.skills.length > 0
                          ? profileData.skills.map((s, i) => (
                              <View key={i} style={styles.fieldSkillChip}>
                                <ThemedText style={styles.fieldSkillChipText}>{s}</ThemedText>
                              </View>
                            ))
                          : <ThemedText style={styles.fieldReadonlyValue}>---</ThemedText>
                        }
                      </View>
                    </View>
                  </View>
                </View>

                {/* ===== ADDITIONAL INFORMATION ===== */}
                <View style={styles.modalSection}>
                  <View style={styles.sectionHeaderRow}>
                    <ThemedText style={styles.sectionIcon}>📝</ThemedText>
                    <ThemedText style={styles.modalSectionTitle}>Additional Information</ThemedText>
                  </View>
                  <View style={styles.modalSectionCard}>
                    <View style={styles.modalFieldGroup}>
                      <ThemedText style={styles.modalLabel}>Expected Salary (Optional)</ThemedText>
                      <TextInput
                        style={styles.modalInput}
                        placeholder="e.g. ₱15,000 - ₱20,000"
                        placeholderTextColor="#9CA3AF"
                        value={expectedSalary}
                        onChangeText={setExpectedSalary}
                      />
                    </View>
                    <View style={styles.modalFieldGroup}>
                      <ThemedText style={styles.modalLabel}>Preferred Start Date (Optional)</ThemedText>
                      <TextInput
                        style={styles.modalInput}
                        placeholder="e.g. ASAP, July 2026, 2 weeks notice"
                        placeholderTextColor="#9CA3AF"
                        value={startDate}
                        onChangeText={setStartDate}
                      />
                    </View>
                    <View style={[styles.modalFieldGroup, styles.modalFieldGroupLast]}>
                      <ThemedText style={styles.modalLabel}>Cover Letter / Message to Employer (Optional)</ThemedText>
                      <TextInput
                        style={styles.modalTextArea}
                        placeholder="Tell the employer why you're a good fit for this role..."
                        placeholderTextColor="#9CA3AF"
                        multiline
                        numberOfLines={4}
                        value={applicationMessage}
                        onChangeText={setApplicationMessage}
                      />
                    </View>
                  </View>
                </View>

                {/* ===== ATTACHMENTS ===== */}
                <View style={styles.modalSection}>
                  <View style={styles.sectionHeaderRow}>
                    <ThemedText style={styles.sectionIcon}>📎</ThemedText>
                    <ThemedText style={styles.modalSectionTitle}>Attachments</ThemedText>
                  </View>
                  <View style={styles.modalSectionCard}>
                    <View style={[styles.modalFieldGroup, styles.modalFieldGroupLast]}>
                      <ThemedText style={styles.modalLabel}>
                        Resume / CV <ThemedText style={styles.requiredStar}>*</ThemedText>
                      </ThemedText>
                      {resumeData ? (
                        <View style={styles.resumeAttachedRow}>
                          <View style={styles.resumeAttachedInfo}>
                            <ThemedText style={styles.resumeAttachedIcon}>📄</ThemedText>
                            <View>
                              <ThemedText style={styles.resumeAttachedName}>Resume uploaded</ThemedText>
                              <ThemedText style={styles.resumeAttachedMeta}>Already attached from your profile</ThemedText>
                            </View>
                          </View>
                          <TouchableOpacity
                            style={styles.resumeViewBtn}
                            onPress={() => {
                              if (resumeData.download_url) {
                                Alert.alert(
                                  'Resume Options',
                                  'Choose an action for your resume:',
                                  [
                                    {
                                      text: '👁️ View',
                                      onPress: () => Linking.openURL(resumeData.download_url!),
                                    },
                                    {
                                      text: '🖨️ Print',
                                      onPress: async () => {
                                        try {
                                          await Print.printAsync({ uri: resumeData.download_url! });
                                        } catch {
                                          Alert.alert('Error', 'Cannot print this resume. Try saving as PDF instead.');
                                        }
                                      },
                                    },
                                    {
                                      text: '💾 Save as PDF',
                                      onPress: async () => {
                                        try {
                                          const fileName = `resume_${Date.now()}.pdf`;
                                          const fileUri = FileSystem.documentDirectory + fileName;
                                          const { uri } = await FileSystem.downloadAsync(
                                            resumeData.download_url!,
                                            fileUri
                                          );
                                          if (await Sharing.isAvailableAsync()) {
                                            await Sharing.shareAsync(uri, {
                                              mimeType: 'application/pdf',
                                              dialogTitle: 'Save Resume as PDF',
                                            });
                                          } else {
                                            Alert.alert('Saved', `PDF saved to:\n${uri}`);
                                          }
                                        } catch {
                                          Alert.alert('Error', 'Failed to save PDF. Check your connection.');
                                        }
                                      },
                                    },
                                    { text: 'Cancel', style: 'cancel' },
                                  ]
                                );
                              } else {
                                Alert.alert('Resume', 'Resume file is ready and attached to your application.');
                              }
                            }}
                          >
                            <ThemedText style={styles.resumeViewBtnText}>View</ThemedText>
                          </TouchableOpacity>
                        </View>
                      ) : (
                        <View style={styles.resumeMissingRow}>
                          <ThemedText style={styles.resumeMissingIcon}>⚠️</ThemedText>
                          <ThemedText style={styles.resumeMissingText}>
                            No resume found. Please upload one from the Resume tab.
                          </ThemedText>
                        </View>
                      )}
                    </View>
                  </View>
                </View>

                {/* ===== CONFIRMATION ===== */}
                <View style={styles.modalSection}>
                  <View style={styles.sectionHeaderRow}>
                    <ThemedText style={styles.sectionIcon}>✅</ThemedText>
                    <ThemedText style={styles.modalSectionTitle}>Confirmation</ThemedText>
                  </View>
                  <TouchableOpacity
                    style={styles.checkboxRow}
                    onPress={() => setAgreedToTerms(!agreedToTerms)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.checkbox, agreedToTerms && styles.checkboxChecked]}>
                      {agreedToTerms && <ThemedText style={styles.checkmark}>✓</ThemedText>}
                    </View>
                    <ThemedText style={styles.checkboxLabel}>
                      I certify that all information provided is true and correct.
                    </ThemedText>
                  </TouchableOpacity>
                </View>

                {/* ===== SUBMIT ===== */}
                <View style={styles.modalSubmitSection}>
                  <TouchableOpacity
                    style={[styles.submitBtn, (!agreedToTerms || submitting) && styles.submitBtnDisabled]}
                    onPress={submitApplication}
                    disabled={!agreedToTerms || submitting}
                  >
                    {submitting ? (
                      <View style={styles.submitBtnInner}>
                        <ActivityIndicator size="small" color="#ffffff" />
                        <ThemedText style={styles.submitBtnText}>  Submitting...</ThemedText>
                      </View>
                    ) : (
                      <ThemedText style={styles.submitBtnText}>Submit Application</ThemedText>
                    )}
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowApplyModal(false)}>
                    <ThemedText style={styles.cancelBtnText}>Cancel</ThemedText>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
  },
  hero: {
    backgroundColor: '#0a7ea4',
    paddingTop: 60,
    paddingBottom: 28,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  backBtn: {
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  backBtnText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 16,
    fontWeight: '500',
  },
  logoContainer: {
    marginBottom: 12,
  },
  logo: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 3,
    borderColor: '#ffffff',
  },
  logoPlaceholder: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#ffffff',
  },
  logoPlaceholderText: {
    color: '#ffffff',
    fontSize: 36,
    fontWeight: '700',
  },
  companyName: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
  },
  industry: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    marginTop: 4,
  },
  statusRow: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 8,
  },
  statusBadge: {
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 16,
  },
  hiringBadge: {
    backgroundColor: '#34C759',
  },
  notHiringBadge: {
    backgroundColor: '#8E8E93',
  },
  statusText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
  },
  jobCountBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 16,
  },
  jobCountText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
  },
  section: {
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  infoLabel: {
    fontSize: 14,
    color: '#8E8E93',
    width: 70,
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 14,
    color: '#1C1C1E',
    flex: 1,
  },
  link: {
    color: '#0a7ea4',
    textDecorationLine: 'underline',
  },
  emptyJobs: {
    fontSize: 14,
    color: '#8E8E93',
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 12,
  },
  jobCard: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  jobHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  jobTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1C1C1E',
    flex: 1,
  },
  jobTypeBadge: {
    backgroundColor: '#E6F4FE',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 3,
    marginLeft: 8,
  },
  jobTypeText: {
    fontSize: 11,
    color: '#0a7ea4',
    fontWeight: '600',
  },
  jobSalary: {
    fontSize: 13,
    color: '#0a7ea4',
    fontWeight: '600',
    marginTop: 4,
  },
  jobDesc: {
    fontSize: 13,
    color: '#8E8E93',
    marginTop: 4,
    lineHeight: 18,
  },
  skillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 6,
    gap: 6,
  },
  skillChip: {
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
    paddingHorizontal: 9,
    paddingVertical: 3,
  },
  skillText: {
    fontSize: 11,
    color: '#3A3A3C',
    fontWeight: '500',
  },
  jobPosted: {
    fontSize: 11,
    color: '#C7C7CC',
  },
  jobActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  applyBtn: {
    backgroundColor: '#0a7ea4',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  applyBtnDisabled: {
    opacity: 0.6,
  },
  applyBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
  },

  // ===== MODAL STYLES =====
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    width: '100%',
    maxHeight: '90%',
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1C1C1E',
  },
  modalSubtitle: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 2,
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F2F2F7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalClose: {
    fontSize: 16,
    color: '#3A3A3C',
    fontWeight: '600',
  },
  modalScrollBody: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
  },

  // Modal section headers
  modalSection: {
    marginBottom: 20,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  modalSectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1C1C1E',
  },

  // Section card
  modalSectionCard: {
    backgroundColor: '#FAFAFA',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F2F2F7',
  },

  // Read-only field rows
  modalFieldRow: {
    flexDirection: 'row',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  modalFieldRowLast: {
    borderBottomWidth: 0,
  },
  fieldReadonlyLabel: {
    fontSize: 13,
    color: '#8E8E93',
    width: 80,
    fontWeight: '500',
  },
  fieldReadonlyValue: {
    fontSize: 13,
    color: '#1C1C1E',
    flex: 1,
    fontWeight: '500',
  },
  fieldTypeBadge: {
    backgroundColor: '#E6F4FE',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  fieldTypeBadgeText: {
    fontSize: 11,
    color: '#0a7ea4',
    fontWeight: '600',
  },
  fieldSkillsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    flex: 1,
    gap: 4,
  },
  fieldSkillChip: {
    backgroundColor: '#E6F4FE',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  fieldSkillChipText: {
    fontSize: 11,
    color: '#0a7ea4',
    fontWeight: '500',
  },

  // Input fields
  modalFieldGroup: {
    marginBottom: 14,
  },
  modalFieldGroupLast: {
    marginBottom: 0,
  },
  modalLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#3A3A3C',
    marginBottom: 6,
  },
  requiredStar: {
    color: '#EF4444',
  },
  modalInput: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: '#1C1C1E',
    height: 48,
  },
  modalTextArea: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: '#1C1C1E',
    minHeight: 100,
    textAlignVertical: 'top',
  },

  // Resume attachment
  resumeAttachedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#EBF5FF',
    borderRadius: 10,
    padding: 12,
  },
  resumeAttachedInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  resumeAttachedIcon: {
    fontSize: 24,
    marginRight: 10,
  },
  resumeAttachedName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  resumeAttachedMeta: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 1,
  },
  resumeViewBtn: {
    backgroundColor: '#0a7ea4',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  resumeViewBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  resumeMissingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderRadius: 10,
    padding: 12,
  },
  resumeMissingIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  resumeMissingText: {
    fontSize: 12,
    color: '#DC2626',
    flex: 1,
    fontWeight: '500',
  },

  // Checkbox
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FAFAFA',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F2F2F7',
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginTop: 1,
  },
  checkboxChecked: {
    backgroundColor: '#0a7ea4',
    borderColor: '#0a7ea4',
  },
  checkmark: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
  checkboxLabel: {
    fontSize: 13,
    color: '#3A3A3C',
    flex: 1,
    lineHeight: 18,
  },

  // Submit section
  modalSubmitSection: {
    marginTop: 4,
    marginBottom: 8,
    gap: 10,
  },
  submitBtn: {
    backgroundColor: '#0a7ea4',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  submitBtnDisabled: {
    opacity: 0.5,
  },
  submitBtnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  cancelBtn: {
    backgroundColor: '#F2F2F7',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3A3A3C',
  },
});
