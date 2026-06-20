import { API_ENDPOINTS } from '@/constants/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';

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
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, passwordConfirmation: string, role: string) => Promise<void>;
  logout: () => Promise<void>;
  checkJobSeekerProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasJobSeekerProfile, setHasJobSeekerProfile] = useState(false);

  useEffect(() => {
    loadStoredAuth();
  }, []);

  async function loadStoredAuth() {
    try {
      const storedToken = await AsyncStorage.getItem('auth_token');
      if (storedToken) {
        setToken(storedToken);
        const response = await fetch(API_ENDPOINTS.user, {
          headers: {
            Authorization: `Bearer ${storedToken}`,
            Accept: 'application/json',
          },
        });
        if (response.ok) {
          const data = await response.json();
          setUser(data.user);
          // Check if user has job seeker profile
          await checkJobSeekerProfile();
        } else {
          await AsyncStorage.removeItem('auth_token');
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
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

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

      const data = await response.json();
      console.log('[API] Login response:', response.status, data);

      if (!response.ok) {
        const msg = data.message || Object.values(data.errors || {}).flat().join('\n') || 'Login failed';
        throw new Error(msg);
      }

      await AsyncStorage.setItem('auth_token', data.token);
      setToken(data.token);
      setUser(data.user);
      await checkJobSeekerProfile();
    } catch (error: any) {
      console.error('[API] Login network/error:', error.message || error);
      if (error.name === 'AbortError') {
        throw new Error('Request timed out. Server at http://10.124.167.62:8000 is not responding. Please check:\n1. Laravel server is running (php artisan serve --host=0.0.0.0 --port=8000)\n2. Phone and PC are on same network\n3. IP address 10.124.167.62 is correct');
      }
      if (error.message === 'Network request failed') {
        throw new Error('Cannot connect to server. Make sure:\n1. php artisan serve --host=0.0.0.0 --port=8000 is running\n2. Phone & PC are on same WiFi\n3. IP 10.124.167.62 is correct');
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
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

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

      const data = await response.json();
      console.log('[API] Register response:', response.status, data);

      if (!response.ok) {
        const msg = data.message || Object.values(data.errors || {}).flat().join('\n') || 'Registration failed';
        throw new Error(msg);
      }

      // Don't automatically log in after registration - let user login manually
    } catch (error: any) {
      console.error('[API] Register network/error:', error.message || error);
      if (error.name === 'AbortError') {
        throw new Error('Request timed out. Server at http://10.124.167.62:8000 is not responding. Please check:\n1. Laravel server is running (php artisan serve --host=0.0.0.0 --port=8000)\n2. Phone and PC are on same network\n3. IP address 10.124.167.62 is correct');
      }
      if (error.message === 'Network request failed') {
        throw new Error('Cannot connect to server. Make sure:\n1. php artisan serve --host=0.0.0.0 --port=8000 is running\n2. Phone & PC are on same WiFi\n3. IP 10.124.167.62 is correct');
      }
      throw error;
    }
  }

  async function checkJobSeekerProfile() {
    if (!token) return;
    
    try {
      const response = await fetch(API_ENDPOINTS.jobSeekerProfile, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setHasJobSeekerProfile(!!data.job_seeker);
      } else {
        setHasJobSeekerProfile(false);
      }
    } catch (error) {
      console.error('Error checking job seeker profile:', error);
      setHasJobSeekerProfile(false);
    }
  }

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
    <AuthContext.Provider value={{ user, token, isLoading, hasJobSeekerProfile, login, register, logout, checkJobSeekerProfile }}>
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
