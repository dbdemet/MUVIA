// services/api.ts
// MUVIA — REST API Client

import Constants from 'expo-constants';
import { Platform } from 'react-native';

function getBaseUrl(): string {
  const debuggerHost = Constants.expoConfig?.hostUri ?? Constants.manifest2?.extra?.expoGo?.debuggerHost;
  const hostname = debuggerHost?.split(':')[0];
  if (Platform.OS === 'android') {
    return `http://${hostname || '10.0.2.2'}:3001`;
  }
  return `http://${hostname || 'localhost'}:3001`;
}

export const API_BASE_URL = getBaseUrl();
const BASE_URL = API_BASE_URL;

function withQuery(path: string, query?: Record<string, string | number | boolean | undefined | null>) {
  if (!query) return path;
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params.append(key, String(value));
    }
  });
  const s = params.toString();
  return s ? `${path}${path.includes('?') ? '&' : '?'}${s}` : path;
}

async function apiGet(path: string, query?: Record<string, string | number | boolean | undefined | null>) {
  try {
    const res = await fetch(`${BASE_URL}${withQuery(path, query)}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn(`API GET ${path} failed:`, err);
    return null;
  }
}

async function apiPost(path: string, body: any) {
  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn(`API POST ${path} failed:`, err);
    return null;
  }
}

async function apiPatch(path: string, body: any) {
  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn(`API PATCH ${path} failed:`, err);
    return null;
  }
}

// ── Auth ──────────────────────────────────────────────────────────────────────
export const loginStudent = (email: string) => apiPost('/api/auth/student-login', { email });
export const loginAcademic = (email: string) => apiPost('/api/auth/academic-login', { email });

// ── Student ───────────────────────────────────────────────────────────────────
export const getStudent = (id: string, email?: string) => apiGet(`/api/student/${id}`, { email });
export const getStudentSchedule = (id: string, email?: string) => apiGet(`/api/student/${id}/schedule`, { email });
export const getStudentExams = (id: string, email?: string) => apiGet(`/api/student/${id}/exams`, { email });

// ── Courses ───────────────────────────────────────────────────────────────────
export const getCourses = () => apiGet('/api/courses');
export const getCourse = (code: string) => apiGet(`/api/courses/${code}`);

// ── Exams ─────────────────────────────────────────────────────────────────────
export const getExams = () => apiGet('/api/exams');

// ── Events ────────────────────────────────────────────────────────────────────
export const getEvents = (email?: string) => apiGet('/api/events', { email });
export const getRecommendedEvents = (dept: string, email?: string) => apiGet(`/api/events/recommended/${encodeURIComponent(dept)}`, { email });
export const checkInEvent = (eventId: string, email: string) => apiPost(`/api/events/${eventId}/check-in`, { email });
export const checkOutEvent = (eventId: string, email: string) => apiPost(`/api/events/${eventId}/check-out`, { email });
export const submitEventFeedback = (eventId: string, email: string, rating: number, comment: string) =>
  apiPost(`/api/events/${eventId}/feedback`, { email, rating, comment });

// ── Announcements ─────────────────────────────────────────────────────────────
export const getAnnouncements = () => apiGet('/api/announcements');
export const postAnnouncement = (data: any) => apiPost('/api/announcements', data);

// ── Meals ─────────────────────────────────────────────────────────────────────
export const getTodayMeal = () => apiGet('/api/meals/today');
export const getWeeklyMeals = () => apiGet('/api/meals/weekly');
export const rateMeal = (date: string, rating: number, email?: string) => apiPost('/api/meals/rate', { date, rating, email });

// ── Academics ─────────────────────────────────────────────────────────────────
export const getAcademics = (department?: string) => apiGet('/api/academics', department ? { department } : {});
export const getAcademic = (id: string) => apiGet(`/api/academics/${id}`);
export const updateAvailability = (id: string, availability: string, note?: string) =>
  apiPatch(`/api/academics/${id}/availability`, { availability, availabilityNote: note });

// ── Complaints ────────────────────────────────────────────────────────────────
export const getComplaints = (studentId: string, email?: string) => apiGet(`/api/complaints/${studentId}`, { email });
export const submitComplaint = (data: any) => apiPost('/api/complaints', data);
export const submitComplaintFeedback = (complaintId: string, rating: number, feedback: string, action?: 'close' | 'escalate') =>
  apiPatch(`/api/complaints/${complaintId}/feedback`, { rating, feedback, action });
export const getAllComplaints = () => apiGet('/api/admin/complaints');
export const getComplaintQueue = () => apiGet('/api/admin/complaints/queue');
export const updateComplaintStatus = (complaintId: string, status: string, note: string, actor?: string) =>
  apiPatch(`/api/admin/complaints/${complaintId}/status`, { status, note, actor });
export const assignComplaintOwner = (complaintId: string, managerName: string, routedUnit: string) =>
  apiPatch(`/api/admin/complaints/${complaintId}/assign`, { managerName, routedUnit });

// ── Messages ──────────────────────────────────────────────────────────────────
export const getMessages = (userId: string, email?: string) => apiGet(`/api/messages/${userId}`, { email });
export const getConversation = (id1: string, id2: string, email?: string) => apiGet(`/api/messages/conversation/${id1}/${id2}`, { email });
export const sendMessage = (data: any) => apiPost('/api/messages', data);
export const markMessageRead = (id: string) => apiPatch(`/api/messages/${id}/read`, {});
export const markConversationRead = (myId: string, otherId: string) => apiPatch(`/api/messages/conversation/${myId}/${otherId}/read`, {});

// ── User Session/Profile ──────────────────────────────────────────────────────
export const getUserProfile = (email: string, role: string) => apiGet('/api/user/profile', { email, role });
export const updateUserProfile = (email: string, updates: Record<string, any>) =>
  apiPatch('/api/user/profile', { email, ...updates });
export const getAccessibilitySettings = (email: string) => apiGet('/api/user/settings/accessibility', { email });
export const updateAccessibilitySettings = (email: string, settings: Record<string, any>) =>
  apiPatch('/api/user/settings/accessibility', { email, settings });

// ── Community ──────────────────────────────────────────────────────────────────
export const getCommunityFeed = (email: string) => apiGet('/api/community/feed', { email });
export const createCommunityPost = (email: string, content: string, tags: string[] = []) =>
  apiPost('/api/community/feed', { email, content, tags });
export const getCommunityClubs = (email: string) => apiGet('/api/community/clubs', { email });
export const toggleClubMembership = (email: string, clubId: string) => apiPost('/api/community/clubs/toggle', { email, clubId });

// ── AI/Smart Services ─────────────────────────────────────────────────────────
export const askAssistant = (payload: {
  email: string;
  role: 'student' | 'academic' | 'visitor';
  message: string;
  history?: { role: string; content: string }[];
  context?: Record<string, any>;
}) => apiPost('/api/assistant/query', payload);

// ── Navigation & Transport ────────────────────────────────────────────────────
export const getRoutePlan = (payload: {
  mode: 'walking' | 'driving' | 'bus';
  origin: { lat: number; lng: number; name?: string };
  destination: { lat: number; lng: number; name?: string };
}) => apiPost('/api/navigation/route', payload);
export const getLiveBusData = (line?: string, stop?: string) => apiGet('/api/transport/live', { line, stop });
export const getBusLines = () => apiGet('/api/transport/lines');
export const getBusLineDetail = (lineId: string) => apiGet(`/api/transport/lines/${lineId}`);
export const getStopArrivals = (stopId: string) => apiGet(`/api/transport/stops/${stopId}/arrivals`);
export const getBusPosition = (busId: string) => apiGet(`/api/transport/bus/${busId}/position`);

// ── Community Club Chat ───────────────────────────────────────────────────────
export const getClubMessages = (clubId: string) => apiGet(`/api/community/clubs/${clubId}/messages`);
export const sendClubMessage = (clubId: string, email: string, content: string) =>
  apiPost(`/api/community/clubs/${clubId}/messages`, { email, content });
export const getClubMembers = (clubId: string) => apiGet(`/api/community/clubs/${clubId}/members`);
export const joinClub = (clubId: string, email: string) =>
  apiPost(`/api/community/clubs/${clubId}/join`, { email });

// ── Sports Board ──────────────────────────────────────────────────────────────
export const getSportsBoard = () => apiGet('/api/sports');
export const postSportsListing = (data: any) => apiPost('/api/sports', data);
export const applySportsListing = (id: string, email: string) => apiPost('/api/sports/apply', { id, email });

// ── Announcement Detail ───────────────────────────────────────────────────────
export const getAnnouncementDetail = (id: string) => apiGet(`/api/announcements/${id}`);

// ── Map Config ────────────────────────────────────────────────────────────────
export const getMapConfig = () => apiGet('/api/map-config');
export const saveMapConfig = (points: any[]) => apiPost('/api/map-config', points);
