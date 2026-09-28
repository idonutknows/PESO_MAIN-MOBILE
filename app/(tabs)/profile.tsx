import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/contexts/AuthContext';
import { API_ENDPOINTS, API_BASE_URL } from '@/constants/api';
import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator, View, Alert, Image } from 'react-native';
import { useState, useEffect } from 'react';
import * as ImagePicker from 'expo-image-picker';

interface JobSeekerProfile {
  first_name: string;
  middle_name: string;
  last_name: string;
  birthdate: string;
  age: number;
  sex: string;
  civil_status: string;
  address: string;
  contact_number: string;
  email: string;
  educational_attainment: string;
  employment_status: string;
  occupation: string | null;
  employer_company: string | null;
  preferred_job: string;
  skills: string[];
  barangay: { barangay_name: string } | null;
  verification_status: string;
  photo_url: string | null;
}

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const { token } = useAuth();
  const [profile, setProfile] = useState<JobSeekerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  useEffect(() => {
    if (!token) return;
    fetchProfile();
  }, [token]);

  async function fetchProfile() {
    if (!token) return;
    try {
      const res = await fetch(API_ENDPOINTS.jobSeekerProfile, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      });
      const json = await res.json();
      if (json.job_seeker) {
        setProfile(json.job_seeker);
      }
    } catch (err) {
      console.error('Failed to fetch profile', err);
    } finally {
      setLoading(false);
    }
  }

  async function pickImage() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission Required', 'Allow access to your photo library to upload a profile picture.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled && result.assets[0]) {
      await uploadPhoto(result.assets[0].uri);
    }
  }

  async function uploadPhoto(uri: string) {
    if (!token) return;
    setUploadingPhoto(true);
    try {
      const formData = new FormData();
      formData.append('photo', {
        uri,
        type: 'image/jpeg',
        name: 'profile.jpg',
      } as any);
      const res = await fetch(API_ENDPOINTS.profilePhoto, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
        body: formData,
      });
      const json = await res.json();
      if (res.ok) {
        Alert.alert('Success', 'Profile photo updated!');
        fetchProfile();
      } else {
        Alert.alert('Error', json.message || 'Failed to upload photo');
      }
    } catch {
      Alert.alert('Error', 'Cannot connect to server. Check your connection.');
    } finally {
      setUploadingPhoto(false);
    }
  }

  const isVerified = profile?.verification_status === 'approved';

  const menuItems = [
    { icon: '📄', label: 'My Resume / CV', color: '#34C759', route: '/(tabs)/resume' as const },
    { icon: '🔔', label: 'Notifications', color: '#FF3B30', route: '/notifications' as const },
  ];

  const profileInfo = profile ? [
    { label: 'Full Name', value: `${profile.first_name} ${profile.middle_name || ''} ${profile.last_name}` },
    { label: 'Birthdate', value: profile.birthdate },
    { label: 'Age', value: `${profile.age}` },
    { label: 'Sex', value: profile.sex },
    { label: 'Civil Status', value: profile.civil_status },
    { label: 'Address', value: profile.address },
    { label: 'Contact', value: profile.contact_number },
    { label: 'Email', value: profile.email },
    { label: 'Education', value: profile.educational_attainment },
    { label: 'Employment', value: profile.employment_status },
    { label: 'Occupation', value: profile.occupation || '-' },
    { label: 'Preferred Job', value: profile.preferred_job },
    { label: 'Skills', value: (profile.skills || []).join(', ') || '-' },
  ] : [];

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <ThemedView style={styles.header}>
        <TouchableOpacity onPress={pickImage} disabled={uploadingPhoto}>
          <ThemedView style={styles.avatar}>
            {profile?.photo_url ? (
              <Image source={{ uri: `${API_BASE_URL}/storage/${profile.photo_url}` }} style={styles.avatarImage} />
            ) : (
              <ThemedText style={styles.avatarText}>
                {user?.name?.charAt(0)?.toUpperCase() || 'J'}
              </ThemedText>
            )}
            <ThemedView style={styles.cameraBadge}>
              {uploadingPhoto ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <ThemedText style={styles.cameraIcon}>📷</ThemedText>
              )}
            </ThemedView>
          </ThemedView>
        </TouchableOpacity>
        <ThemedText style={styles.name}>{user?.name || 'Job Seeker'}</ThemedText>
        <ThemedText style={styles.email}>{user?.email || 'jobseeker@email.com'}</ThemedText>
        <ThemedView style={[styles.roleBadge, isVerified && styles.verifiedBadge]}>
          <ThemedText style={[styles.roleText, isVerified && styles.verifiedText]}>
            {isVerified ? '✓ Verified' : 'Not Verified'}
          </ThemedText>
        </ThemedView>
      </ThemedView>

      {loading ? (
        <ActivityIndicator size="large" color="#0a7ea4" style={{ marginTop: 24 }} />
      ) : profile ? (
        <>
          {isVerified && (
            <ThemedView style={styles.verifiedBanner}>
              <ThemedText style={styles.verifiedBannerIcon}>✓</ThemedText>
              <ThemedText style={styles.verifiedBannerText}>
                Your account is verified. You can now apply for jobs and access all features.
              </ThemedText>
            </ThemedView>
          )}

          {!isVerified && (
            <ThemedView style={styles.pendingBanner}>
              <ThemedText style={styles.pendingBannerIcon}>⏳</ThemedText>
              <ThemedText style={styles.pendingBannerText}>
                Your account is pending verification. Please wait for PESO Admin to verify your profile.
              </ThemedText>
            </ThemedView>
          )}

          <ThemedView style={styles.infoCard}>
            <ThemedText style={styles.infoTitle}>Personal Information</ThemedText>
            {profileInfo.map((item, i) => (
              <View key={i} style={styles.infoRow}>
                <ThemedText style={styles.infoLabel}>{item.label}</ThemedText>
                <ThemedText style={styles.infoValue}>{item.value}</ThemedText>
              </View>
            ))}
          </ThemedView>
        </>
      ) : (
        <ThemedView style={styles.infoCard}>
          <ThemedText style={styles.noProfileText}>
            No PESO registration found. Please complete your profiling first.
          </ThemedText>
          <TouchableOpacity
            style={styles.registerButton}
            onPress={() => router.push('/peso-registration')}
          >
            <ThemedText style={styles.registerButtonText}>Go to Profiling</ThemedText>
          </TouchableOpacity>
        </ThemedView>
      )}

      <ThemedView style={styles.menuContainer}>
        {menuItems.map((item, index) => (
          <TouchableOpacity key={index} style={styles.menuItem} onPress={() => item.route && router.push(item.route)}>
            <ThemedText style={styles.menuIcon}>{item.icon}</ThemedText>
            <ThemedText style={styles.menuLabel}>{item.label}</ThemedText>
            <ThemedText style={styles.menuArrow}>›</ThemedText>
          </TouchableOpacity>
        ))}
      </ThemedView>

      <TouchableOpacity style={styles.logoutButton} onPress={logout}>
        <ThemedText style={styles.logoutText}>Log Out</ThemedText>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  header: {
    backgroundColor: '#0a7ea4',
    paddingTop: 60,
    paddingBottom: 28,
    alignItems: 'center',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  avatarImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  cameraBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#0a7ea4',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2.5,
    borderColor: '#ffffff',
  },
  cameraIcon: {
    fontSize: 12,
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 32,
    fontWeight: '700',
  },
  name: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '700',
    marginTop: 12,
  },
  email: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    marginTop: 4,
  },
  roleBadge: {
    marginTop: 10,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 4,
  },
  verifiedBadge: {
    backgroundColor: '#34C759',
  },
  verifiedText: {
    color: '#ffffff',
  },
  roleText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  verifiedBanner: {
    marginHorizontal: 16,
    marginTop: 16,
    backgroundColor: '#E8F5E9',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#A5D6A7',
  },
  verifiedBannerIcon: {
    fontSize: 24,
    color: '#2E7D32',
    marginRight: 12,
  },
  verifiedBannerText: {
    flex: 1,
    fontSize: 13,
    color: '#1B5E20',
    lineHeight: 18,
  },
  pendingBanner: {
    marginHorizontal: 16,
    marginTop: 16,
    backgroundColor: '#FFF8E1',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFE082',
  },
  pendingBannerIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  pendingBannerText: {
    flex: 1,
    fontSize: 13,
    color: '#E65100',
    lineHeight: 18,
  },
  infoCard: {
    marginHorizontal: 16,
    marginTop: 16,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  infoLabel: {
    fontSize: 13,
    color: '#8E8E93',
    flex: 1,
  },
  infoValue: {
    fontSize: 13,
    color: '#1C1C1E',
    fontWeight: '600',
    flex: 1.5,
    textAlign: 'right',
  },
  noProfileText: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
    marginBottom: 16,
  },
  registerButton: {
    backgroundColor: '#0a7ea4',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  registerButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
  },
  menuContainer: {
    marginTop: 20,
    marginHorizontal: 16,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  menuIcon: {
    fontSize: 20,
    width: 32,
  },
  menuLabel: {
    flex: 1,
    fontSize: 15,
    color: '#1C1C1E',
    fontWeight: '500',
  },
  menuArrow: {
    fontSize: 20,
    color: '#C7C7CC',
  },
  logoutButton: {
    marginHorizontal: 16,
    marginTop: 20,
    marginBottom: 40,
    backgroundColor: '#FF3B30',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  logoutText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});
