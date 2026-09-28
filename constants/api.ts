/**
 * API Configuration
 * Update this to match your Laravel backend server address.
 * Use your machine's local IP address for physical device testing.
 * Example: 'http://192.168.1.100:8000'
 */
export const API_BASE_URL = 'http://192.168.1.17:8000'; // Palitan ito ng actual IP ng PC mo



export const API_ENDPOINTS = {
  login: `${API_BASE_URL}/api/login`,
  register: `${API_BASE_URL}/api/register`,
  logout: `${API_BASE_URL}/api/logout`,
  user: `${API_BASE_URL}/api/user`,
  jobSeekerRegister: `${API_BASE_URL}/api/job-seeker/register`,
  jobSeekerProfile: `${API_BASE_URL}/api/job-seeker/profile`,
  barangays: `${API_BASE_URL}/api/barangays`,
  resumePreview: `${API_BASE_URL}/api/resume/preview`,
  resume: `${API_BASE_URL}/api/resume`,
  resumeUpdateTemplate: `${API_BASE_URL}/api/resume/template`,
  establishments: `${API_BASE_URL}/api/establishments/hiring`,
  establishmentDetail: (id: number) => `${API_BASE_URL}/api/establishments/${id}`,
  notifications: `${API_BASE_URL}/api/notifications`,
  notificationsUnread: `${API_BASE_URL}/api/notifications/unread-count`,
  applications: `${API_BASE_URL}/api/applications`,
  myApplications: `${API_BASE_URL}/api/applications/my`,
  profilePhoto: `${API_BASE_URL}/api/job-seeker/profile/photo`,
} as const;
