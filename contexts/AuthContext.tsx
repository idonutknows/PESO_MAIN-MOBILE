import { API_ENDPOINTS } from '@/constants/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { Alert } from 'react-native';

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  hasJobSeekerProfile: boolean;
  hasCheckedProfile: boolean;
  verificationStatus: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, passwordConfirmation: string, role: string) => Promise<void>;
  logout: () => Promise<void>;
  checkJobSeekerProfile: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasJobSeekerProfile, setHasJobSeekerProfile] = useState(false);
  const [hasCheckedProfile, setHasCheckedProfile] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<string | null>(null);
  const prevVerificationRef = useRef<string | null>(null);
  const shownVerifiedAlert = useRef(false);

  useEffect(() => {
    loadStoredAuth();
  }, []);

  // Poll profile for verification changes
  useEffect(() => {
    if (!token) return;
    const interval = setInterval(() => {
      checkVerificationChange();
    }, 15000);
    return () => clearInterval(interval);
  }, [token]);

  async function checkVerificationChange() {
    if (!token) return;
    try {
      const res = await fetch(API_ENDPOINTS.jobSeekerProfile, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      });
      if (!res.ok) return;
      const json = await res.json();
      if (!json.job_seeker) return;

      const current = json.job_seeker.verification_status;
      const prev = prevVerificationRef.current;
      prevVerificationRef.current = current;
      setVerificationStatus(current);
      setHasJobSeekerProfile(!!json.job_seeker);

      if (prev && prev !== 'approved' && current === 'approved' && !shownVerifiedAlert.current) {
        shownVerifiedAlert.current = true;
        Alert.alert(
          'Account Verified!',
          'Your account has been verified by PESO Admin. You can now access all job seeker features!'
        );
      }
    } catch {
      // silent
    }
  }

  async function loadStoredAuth() {
    try {
      const storedToken = await AsyncStorage.getItem('auth_token');
      if (storedToken) {
        setToken(storedToken);
        try {
          const response = await fetch(API_ENDPOINTS.user, {
            headers: {
              Authorization: `Bearer ${storedToken}`,
              Accept: 'application/json',
            },
          });
          if (response.ok) {
            const rawText = await response.text();
            try {
              const data = JSON.parse(rawText);
              setUser(data.user);
              await checkJobSeekerProfile(storedToken);
            } catch {
              await AsyncStorage.removeItem('auth_token');
            }
          } else {
            await AsyncStorage.removeItem('auth_token');
          }
        } catch {
          // Server offline — keep token, try again later
        }
      }
    } catch (error) {
      console.error('Auth load error:', error);
    } finally {
      setIsLoading(false);
    }
  }

  async function login(email: string, password: string) {
    console.log('[API] Login request to:', API_ENDPOINTS.login);
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout

      const response = await fetch(API_ENDPOINTS.login, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({ email, password }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const rawText = await response.text();
      let data: any;
      try {
        data = JSON.parse(rawText);
      } catch {
        console.error('[API] Login non-JSON response:', rawText.substring(0, 300));
        throw new Error('Server returned HTML instead of JSON. The API endpoint may not exist or the server is down.');
      }
      console.log('[API] Login response:', response.status, data);

      if (!response.ok) {
        const msg = data.message || Object.values(data.errors || {}).flat().join('\n') || 'Login failed';
        throw new Error(msg);
      }

      await AsyncStorage.setItem('auth_token', data.token);
      setToken(data.token);
      setUser(data.user);
      await checkJobSeekerProfile(data.token);
    } catch (error: any) {
      console.error('[API] Login network/error:', error.message || error);
      if (error.name === 'AbortError' || error.message === 'Aborted') {
        throw new Error('Request timed out. Server is not responding. Please check:\n1. Laravel server is running (php artisan serve --host=0.0.0.0 --port=8000)\n2. Phone and PC are on same network\n3. IP address in api.ts is correct');
      }
      if (error.message === 'Network request failed') {
        throw new Error('Cannot connect to server. Make sure:\n1. php artisan serve --host=0.0.0.0 --port=8000 is running\n2. Phone & PC are on same WiFi\n3. IP in api.ts is correct');
      }
      throw error;
    }
  }

  async function register(
    name: string,
    email: string,
    password: string,
    passwordConfirmation: string,
    role: string
  ) {
    console.log('[API] Register request to:', API_ENDPOINTS.register);
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout

      const response = await fetch(API_ENDPOINTS.register, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          name,
          email,
          password,
          password_confirmation: passwordConfirmation,
          role,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const rawText = await response.text();
      let data: any;
      try {
        data = JSON.parse(rawText);
      } catch {
        console.error('[API] Register non-JSON response:', rawText.substring(0, 300));
        throw new Error('Server returned HTML instead of JSON. The API endpoint may not exist or the server is down.');
      }
      console.log('[API] Register response:', response.status, data);

      if (!response.ok) {
        const msg = data.message || Object.values(data.errors || {}).flat().join('\n') || JSON.stringify(data) || 'Registration failed';
        throw new Error(msg);
      }

      // Don't automatically log in after registration - let user login manually
    } catch (error: any) {
      console.error('[API] Register network/error:', error.message || error);
      if (error.name === 'AbortError' || error.message === 'Aborted') {
        throw new Error('Request timed out. Server is not responding. Please check:\n1. Laravel server is running (php artisan serve --host=0.0.0.0 --port=8000)\n2. Phone and PC are on same network\n3. IP address in api.ts is correct');
      }
      if (error.message === 'Network request failed') {
        throw new Error('Cannot connect to server. Make sure:\n1. php artisan serve --host=0.0.0.0 --port=8000 is running\n2. Phone & PC are on same WiFi\n3. IP in api.ts is correct');
      }
      throw error;
    }
  }

  async function checkJobSeekerProfile(overrideToken?: string) {
    const activeToken = overrideToken || token;
    if (!activeToken) {
      setHasCheckedProfile(true);
      return;
    }
    
    try {
      const response = await fetch(API_ENDPOINTS.jobSeekerProfile, {
        headers: {
          Authorization: `Bearer ${activeToken}`,
          Accept: 'application/json',
        },
      });

      if (response.ok) {
        const rawText = await response.text();
        try {
          const data = JSON.parse(rawText);
          const profile = data.job_seeker;
          setHasJobSeekerProfile(!!profile);
          const status = profile?.verification_status || null;
          setVerificationStatus(status);
          prevVerificationRef.current = status;
        } catch {
          setHasJobSeekerProfile(false);
          setVerificationStatus(null);
        }
      } else {
        setHasJobSeekerProfile(false);
        setVerificationStatus(null);
      }
    } catch (error) {
      console.error('Error checking job seeker profile:', error);
      setHasJobSeekerProfile(false);
      setVerificationStatus(null);
    } finally {
      setHasCheckedProfile(true);
    }
  }

  const refreshProfile = () => checkJobSeekerProfile();

  async function logout() {
    if (token) {
      try {
        await fetch(API_ENDPOINTS.logout, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
          },
        });
      } catch (error) {
        console.error('Logout error:', error);
      }
    }
    await AsyncStorage.removeItem('auth_token');
    setToken(null);
    setUser(null);
    setHasJobSeekerProfile(false);
  }

  return (
    <AuthContext.Provider value={{ user, token, isLoading, hasJobSeekerProfile, hasCheckedProfile, verificationStatus, login, register, logout, checkJobSeekerProfile, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
