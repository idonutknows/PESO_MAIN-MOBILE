/**
 * API Configuration
 * Update this to match your Laravel backend server address.
 * Use your machine's local IP address for physical device testing.
 * Example: 'http://192.168.1.100:8000'
 */
export const API_BASE_URL = 'http://10.124.167.62:8000';



export const API_ENDPOINTS = {
  login: `${API_BASE_URL}/api/login`,
  register: `${API_BASE_URL}/api/register`,
  logout: `${API_BASE_URL}/api/logout`,
  user: `${API_BASE_URL}/api/user`,
  jobSeekerRegister: `${API_BASE_URL}/api/job-seeker/register`,
  jobSeekerProfile: `${API_BASE_URL}/api/job-seeker/profile`,
  barangays: `${API_BASE_URL}/api/barangays`,
} as const;
