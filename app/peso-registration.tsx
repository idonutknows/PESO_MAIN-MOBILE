import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { API_ENDPOINTS } from '@/constants/api';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

const STEPS = [
  'Personal Info',
  'Employment',
  'Skills',
  'Licenses',
  'Other',
  'Review',
];

const SKILL_OPTIONS = [
  'Agriculture / Farming',
  'Fishing / Aquaculture',
  'Construction / Carpentry / Masonry',
  'Driving / Automotive',
  'Welding / Metal Works',
  'Electrical / Electronics',
  'Computer / IT / Digital Skills',
  'Food Processing / Cooking / Baking',
  'Sewing / Dressmaking',
];

interface Barangay {
  id: number;
  barangay_name: string;
}

interface FormData {
  first_name: string;
  middle_name: string;
  last_name: string;
  birthdate: string;
  age: string;
  sex: string;
  civil_status: string;
  address: string;
  contact_number: string;
  email: string;
  barangay_id: number;
  barangay_name: string;
  educational_attainment: string;
  employment_status: string;
  occupation: string;
  employer_company: string;
  work_experience_years: string;
  preferred_job: string;
  skills: string[];
  other_skill: string;
  tesda_nc_certificates: string;
  other_trainings: string;
  professional_licenses: string;
  willing_outside_municipality: boolean;
  willing_abroad: boolean;
  remarks: string;
}

const initialForm: FormData = {
  first_name: '',
  middle_name: '',
  last_name: '',
  birthdate: '',
  age: '',
  sex: '',
  civil_status: '',
  address: '',
  contact_number: '',
  email: '',
  barangay_id: 0,
  barangay_name: '',
  educational_attainment: '',
  employment_status: '',
  occupation: '',
  employer_company: '',
  work_experience_years: '',
  preferred_job: '',
  skills: [],
  other_skill: '',
  tesda_nc_certificates: '',
  other_trainings: '',
  professional_licenses: '',
  willing_outside_municipality: false,
  willing_abroad: false,
  remarks: '',
};

const STORAGE_KEY = '@peso_form_progress';

const OPOL_BARANGAYS: Barangay[] = [
  { id: 1, barangay_name: 'Awang' },
  { id: 2, barangay_name: 'Bagocboc' },
  { id: 3, barangay_name: 'Barra' },
  { id: 4, barangay_name: 'Bonbon' },
  { id: 5, barangay_name: 'Cauyonan' },
  { id: 6, barangay_name: 'Igpit' },
  { id: 7, barangay_name: 'Limonda' },
  { id: 8, barangay_name: 'Luyongbonbon' },
  { id: 9, barangay_name: 'Malanang' },
  { id: 10, barangay_name: 'Nangcaon' },
  { id: 11, barangay_name: 'Patag' },
  { id: 12, barangay_name: 'Poblacion' },
  { id: 13, barangay_name: 'Taboc' },
  { id: 14, barangay_name: 'Tingalan' },
];

export default function PesoRegistrationScreen() {
  const router = useRouter();
  const { token } = useAuth();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormData>(initialForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [barangays, setBarangays] = useState<Barangay[]>([]);
  const [showBarangayPicker, setShowBarangayPicker] = useState(false);
  
  const fetchBarangays = async () => {
    try {
      const response = await fetch(API_ENDPOINTS.barangays, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      });
      const data = await response.json();
      if (data.barangays && data.barangays.length > 0) {
        setBarangays(data.barangays);
        return;
      }
    } catch (error) {
      console.log('[PESO Registration] Error fetching barangays:', error);
    }
    setBarangays(OPOL_BARANGAYS);
  };

  useEffect(() => {
    loadProgress();
    if (token) fetchBarangays();
    else setBarangays(OPOL_BARANGAYS);
  }, [token]);

  useEffect(() => {
    saveProgress();
  }, [form, step]);

  const loadProgress = async () => {
    try {
      const saved = localStorage.getItem?.(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.form) setForm(parsed.form);
        if (parsed.step) setStep(parsed.step);
      }
    } catch {}
  };

  const saveProgress = async () => {
    try {
      localStorage.setItem?.(STORAGE_KEY, JSON.stringify({ form, step }));
    } catch {}
  };

  const updateField = (field: keyof FormData, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const toggleSkill = (skill: string) => {
    setForm(prev => ({
      ...prev,
      skills: prev.skills.includes(skill)
        ? prev.skills.filter(s => s !== skill)
        : [...prev.skills, skill],
    }));
  };

  const calculateAge = (birthdate: string) => {
    if (!birthdate) return '';
    const today = new Date();
    const birth = new Date(birthdate);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age.toString();
  };

  const validateStep = () => {
    switch (step) {
      case 0:
        if (!form.first_name || !form.last_name || !form.birthdate || !form.sex || !form.civil_status || !form.address || !form.contact_number || form.barangay_id === 0 || !form.educational_attainment) {
          Alert.alert('Error', 'Please fill in all required fields');
          return false;
        }
        return true;
      case 1:
        if (!form.employment_status || !form.preferred_job) {
          Alert.alert('Error', 'Please fill in all required fields');
          return false;
        }
        return true;
      case 2:
        return true;
      case 3:
        return true;
      case 4:
        return true;
      default:
        return true;
    }
  };

  const nextStep = () => {
    if (validateStep()) setStep(s => Math.min(s + 1, STEPS.length - 1));
  };

  const prevStep = () => setStep(s => Math.max(s - 1, 0));

  const submitForm = async () => {
    setIsSubmitting(true);
    try {
      // Calculate age to ensure it's always a valid integer
      const calculatedAge = calculateAge(form.birthdate);
      const skillsArray = form.other_skill ? [...form.skills, `Other: ${form.other_skill}`] : form.skills;
      
      const { barangay_name, ...rest } = form;
      const payload = {
        ...rest,
        age: parseInt(calculatedAge) || 0,
        work_experience_years: form.work_experience_years ? parseInt(form.work_experience_years) : null,
        skills: skillsArray.length > 0 ? skillsArray : [],
      };

      console.log('[PESO Registration] Submitting payload:', JSON.stringify(payload, null, 2));
      console.log('[PESO Registration] API endpoint:', API_ENDPOINTS.jobSeekerRegister);
      console.log('[PESO Registration] Token present:', !!token);

      const response = await fetch(API_ENDPOINTS.jobSeekerRegister, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      console.log('[PESO Registration] Response:', response.status, data);
      
      if (!response.ok) {
        // Show detailed validation errors if available
        if (data.errors) {
          const errorMessages = Object.values(data.errors).flat().join('\n');
          console.log('[PESO Registration] Validation errors:', errorMessages);
          throw new Error(errorMessages || data.message || 'Validation failed');
        }
        console.log('[PESO Registration] Error response:', data.message);
        throw new Error(data.message || 'Registration failed');
      }

      console.log('[PESO Registration] Success - registration completed');
      Alert.alert('Success', 'PESO registration submitted successfully!', [
        { text: 'OK', onPress: () => router.replace('/(tabs)') },
      ]);
    } catch (error: any) {
      console.log('[PESO Registration] Error:', error.message);
      Alert.alert('Error', error.message || 'Could not submit registration');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderInput = (label: string, field: keyof FormData, placeholder: string, options?: { keyboardType?: any; secure?: boolean; multiline?: boolean }) => (
    <View style={styles.inputGroup}>
      <ThemedText style={styles.label}>{label}</ThemedText>
      <TextInput
        style={[styles.input, options?.multiline && styles.inputMultiline]}
        placeholder={placeholder}
        placeholderTextColor="#8E8E93"
        value={form[field] as string}
        onChangeText={text => updateField(field, text)}
        keyboardType={options?.keyboardType || 'default'}
        secureTextEntry={options?.secure || false}
        multiline={options?.multiline || false}
      />
    </View>
  );

  const renderSelect = (label: string, field: keyof FormData, options: string[]) => (
    <View style={styles.inputGroup}>
      <ThemedText style={styles.label}>{label}</ThemedText>
      <View style={styles.optionsRow}>
        {options.map(opt => (
          <TouchableOpacity
            key={opt}
            style={[styles.optionButton, form[field] === opt && styles.optionButtonActive]}
            onPress={() => updateField(field, opt)}>
            <ThemedText style={[styles.optionText, form[field] === opt && styles.optionTextActive]}>{opt}</ThemedText>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderProgressBar = () => (
    <View style={styles.progressContainer}>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${((step + 1) / STEPS.length) * 100}%` }]} />
      </View>
      <View style={styles.stepLabels}>
        {STEPS.map((s, i) => (
          <ThemedText key={s} style={[styles.stepLabel, i === step && styles.stepLabelActive]} numberOfLines={1}>
            {s}
          </ThemedText>
        ))}
      </View>
    </View>
  );

  const renderStep0 = () => (
    <View>
      <ThemedText type="subtitle" style={styles.stepTitle}>Personal Information</ThemedText>
      {renderInput('First Name *', 'first_name', 'Juan')}
      {renderInput('Middle Name', 'middle_name', 'Dela')}
      {renderInput('Last Name *', 'last_name', 'Cruz')}
      <View style={styles.inputGroup}>
        <ThemedText style={styles.label}>Date of Birth *</ThemedText>
        <TextInput
          style={styles.input}
          placeholder="YYYY-MM-DD"
          placeholderTextColor="#8E8E93"
          value={form.birthdate}
          onChangeText={text => {
            updateField('birthdate', text);
            updateField('age', calculateAge(text));
          }}
        />
      </View>
      {renderInput('Age', 'age', 'Auto-calculated', { keyboardType: 'number-pad' })}
      {renderSelect('Sex *', 'sex', ['Male', 'Female', 'Other'])}
      {renderSelect('Civil Status *', 'civil_status', ['Single', 'Married', 'Widowed', 'Separated', 'Divorced'])}
      {renderInput('Address *', 'address', 'House No., Street, Barangay', { multiline: true })}
      {renderInput('Contact Number *', 'contact_number', '09XX XXX XXXX', { keyboardType: 'phone-pad' })}
      {renderInput('Email Address', 'email', 'email@example.com', { keyboardType: 'email-address' })}
      <View style={styles.inputGroup}>
        <ThemedText style={styles.label}>Barangay *</ThemedText>
        <TouchableOpacity style={styles.pickerButton} onPress={() => setShowBarangayPicker(true)}>
          <ThemedText style={[styles.pickerText, !form.barangay_name && styles.pickerPlaceholder]}>
            {form.barangay_name || 'Select barangay'}
          </ThemedText>
          <ThemedText style={styles.pickerArrow}>▼</ThemedText>
        </TouchableOpacity>
      </View>
      {renderSelect('Educational Attainment *', 'educational_attainment', ['Elementary', 'High School', 'Vocational', 'College', 'Post Graduate'])}
    </View>
  );

  const renderStep1 = () => (
    <View>
      <ThemedText type="subtitle" style={styles.stepTitle}>Employment Information</ThemedText>
      {renderSelect('Employment Status *', 'employment_status', ['Employed', 'Unemployed', 'Self-Employed'])}
      {renderInput('Current/Previous Occupation', 'occupation', 'e.g. Factory Worker')}
      {renderInput('Employer/Company Name', 'employer_company', 'Company name (if any)')}
      {renderInput('Work Experience (Years)', 'work_experience_years', '0', { keyboardType: 'number-pad' })}
      {renderInput('Preferred Job/Occupation *', 'preferred_job', 'e.g. Construction Worker')}
    </View>
  );

  const renderStep2 = () => (
    <View>
      <ThemedText type="subtitle" style={styles.stepTitle}>Skills Profile</ThemedText>
      <ThemedText style={styles.helper}>Select all that apply</ThemedText>
      {SKILL_OPTIONS.map(skill => (
        <TouchableOpacity
          key={skill}
          style={[styles.checkRow, form.skills.includes(skill) && styles.checkRowActive]}
          onPress={() => toggleSkill(skill)}>
          <ThemedView style={[styles.checkBox, form.skills.includes(skill) && styles.checkBoxActive]}>
            {form.skills.includes(skill) && <ThemedText style={styles.checkMark}>✓</ThemedText>}
          </ThemedView>
          <ThemedText style={styles.checkLabel}>{skill}</ThemedText>
        </TouchableOpacity>
      ))}
      {renderInput('Other Skills', 'other_skill', 'Specify other skills')}
    </View>
  );

  const renderStep3 = () => (
    <View>
      <ThemedText type="subtitle" style={styles.stepTitle}>Licenses & Trainings</ThemedText>
      {renderInput('TESDA/NC Certificates', 'tesda_nc_certificates', 'List your certificates', { multiline: true })}
      {renderInput('Other Trainings Attended', 'other_trainings', 'List trainings attended', { multiline: true })}
      {renderInput('Professional Licenses', 'professional_licenses', 'List professional licenses', { multiline: true })}
    </View>
  );

  const renderStep4 = () => (
    <View>
      <ThemedText type="subtitle" style={styles.stepTitle}>Other Information</ThemedText>
      <View style={styles.switchRow}>
        <ThemedText style={styles.switchLabel}>Willing to work outside municipality?</ThemedText>
        <Switch
          value={form.willing_outside_municipality}
          onValueChange={v => updateField('willing_outside_municipality', v)}
          trackColor={{ false: '#E5E7EB', true: '#0a7ea4' }}
        />
      </View>
      <View style={styles.switchRow}>
        <ThemedText style={styles.switchLabel}>Willing to work abroad?</ThemedText>
        <Switch
          value={form.willing_abroad}
          onValueChange={v => updateField('willing_abroad', v)}
          trackColor={{ false: '#E5E7EB', true: '#0a7ea4' }}
        />
      </View>
      {renderInput('Remarks / Notes', 'remarks', 'Any additional information...', { multiline: true })}
    </View>
  );

  const renderStep5 = () => (
    <View>
      <ThemedText type="subtitle" style={styles.stepTitle}>Review & Submit</ThemedText>
      <ThemedText style={styles.helper}>Please review your information before submitting</ThemedText>
      {[
        ['Full Name', `${form.first_name} ${form.middle_name} ${form.last_name}`],
        ['Date of Birth', form.birthdate],
        ['Age', form.age],
        ['Sex', form.sex],
        ['Civil Status', form.civil_status],
        ['Address', form.address],
        ['Contact', form.contact_number],
        ['Email', form.email || '-'],
        ['Barangay', form.barangay_name],
        ['Education', form.educational_attainment],
        ['Employment', form.employment_status],
        ['Occupation', form.occupation || '-'],
        ['Preferred Job', form.preferred_job],
        ['Skills', form.skills.join(', ') || '-'],
        ['Work Outside', form.willing_outside_municipality ? 'Yes' : 'No'],
        ['Work Abroad', form.willing_abroad ? 'Yes' : 'No'],
      ].map(([label, value], i) => (
        <View key={i} style={styles.reviewRow}>
          <ThemedText style={styles.reviewLabel}>{label}</ThemedText>
          <ThemedText style={styles.reviewValue}>{value}</ThemedText>
        </View>
      ))}
    </View>
  );

  const stepContent = [renderStep0, renderStep1, renderStep2, renderStep3, renderStep4, renderStep5];

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {renderProgressBar()}
        <ThemedView style={styles.card}>
          {stepContent[step]()}
        </ThemedView>

        <View style={styles.buttonRow}>
          {step > 0 && (
            <TouchableOpacity style={styles.backButton} onPress={prevStep}>
              <ThemedText style={styles.backButtonText}>Back</ThemedText>
            </TouchableOpacity>
          )}
          {step < STEPS.length - 1 ? (
            <TouchableOpacity style={styles.nextButton} onPress={nextStep}>
              <ThemedText style={styles.nextButtonText}>Next</ThemedText>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.submitButton} onPress={submitForm} disabled={isSubmitting}>
              {isSubmitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <ThemedText style={styles.submitButtonText}>Submit Registration</ThemedText>
              )}
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      <Modal visible={showBarangayPicker} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <ThemedText style={styles.modalTitle}>Select Barangay</ThemedText>
              <TouchableOpacity onPress={() => setShowBarangayPicker(false)}>
                <ThemedText style={styles.modalClose}>✕</ThemedText>
              </TouchableOpacity>
            </View>
            <FlatList
              data={barangays}
              keyExtractor={item => item.id.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.modalItem, form.barangay_id === item.id && styles.modalItemActive]}
                  onPress={() => {
                    updateField('barangay_id', item.id);
                    updateField('barangay_name', item.barangay_name);
                    setShowBarangayPicker(false);
                  }}
                >
                  <ThemedText style={[styles.modalItemText, form.barangay_id === item.id && styles.modalItemTextActive]}>
                    {item.barangay_name}
                  </ThemedText>
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <ThemedText style={styles.modalEmpty}>No barangays available</ThemedText>
              }
            />
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  scroll: {
    padding: 16,
    paddingBottom: 32,
  },
  progressContainer: {
    marginBottom: 20,
  },
  progressTrack: {
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#0a7ea4',
    borderRadius: 3,
  },
  stepLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  stepLabel: {
    fontSize: 10,
    color: '#8E8E93',
    flex: 1,
    textAlign: 'center',
  },
  stepLabelActive: {
    color: '#0a7ea4',
    fontWeight: '700',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  stepTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
    color: '#1C1C1E',
  },
  helper: {
    fontSize: 13,
    color: '#8E8E93',
    marginBottom: 12,
  },
  inputGroup: {
    marginBottom: 14,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#3A3A3C',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#1C1C1E',
  },
  inputMultiline: {
    height: 80,
    textAlignVertical: 'top',
    paddingTop: 12,
  },
  optionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F2F2F7',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  optionButtonActive: {
    backgroundColor: '#0a7ea4',
    borderColor: '#0a7ea4',
  },
  optionText: {
    fontSize: 13,
    color: '#3A3A3C',
    fontWeight: '500',
  },
  optionTextActive: {
    color: '#ffffff',
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginBottom: 6,
    backgroundColor: '#F9FAFB',
  },
  checkRowActive: {
    backgroundColor: '#E6F4FE',
  },
  checkBox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#C7C7CC',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  checkBoxActive: {
    backgroundColor: '#0a7ea4',
    borderColor: '#0a7ea4',
  },
  checkMark: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  checkLabel: {
    fontSize: 14,
    color: '#3A3A3C',
    flex: 1,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  switchLabel: {
    fontSize: 14,
    color: '#3A3A3C',
    flex: 1,
  },
  pickerButton: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pickerText: {
    fontSize: 15,
    color: '#1C1C1E',
  },
  pickerPlaceholder: {
    color: '#8E8E93',
  },
  pickerArrow: {
    fontSize: 10,
    color: '#8E8E93',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '60%',
    paddingBottom: 32,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1C1C1E',
  },
  modalClose: {
    fontSize: 18,
    color: '#8E8E93',
    padding: 4,
  },
  modalItem: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  modalItemActive: {
    backgroundColor: '#E6F4FE',
  },
  modalItemText: {
    fontSize: 15,
    color: '#1C1C1E',
  },
  modalItemTextActive: {
    color: '#0a7ea4',
    fontWeight: '600',
  },
  modalEmpty: {
    textAlign: 'center',
    color: '#8E8E93',
    paddingVertical: 24,
    fontSize: 15,
  },
  reviewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  reviewLabel: {
    fontSize: 13,
    color: '#8E8E93',
    flex: 1,
  },
  reviewValue: {
    fontSize: 13,
    color: '#1C1C1E',
    fontWeight: '600',
    flex: 1.5,
    textAlign: 'right',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  backButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#F2F2F7',
    alignItems: 'center',
  },
  backButtonText: {
    color: '#3A3A3C',
    fontSize: 16,
    fontWeight: '600',
  },
  nextButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#0a7ea4',
    alignItems: 'center',
  },
  nextButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  submitButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#34C759',
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});
