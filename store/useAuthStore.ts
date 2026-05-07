import { create } from 'zustand';
import { setLanguage as setI18nLang } from '../constants/i18n';

export type Role = 'student' | 'academic' | 'visitor' | null;

export interface User {
  id?: string;
  name: string;
  email: string;
  role: Role;
  studentId?: string;
  department?: string;
  faculty?: string;
  year?: number;
  gpa?: number;
  interests?: string[];
  enrolledCourses?: string[];
  title?: string;
  officeRoom?: string;
  courses?: string[];
}

export interface AuthStore {
  user: User | null;
  isLoggedIn: boolean;
  language: 'en' | 'tr';
  theme: 'light' | 'dark';
  blueLightFilter: boolean;
  login: (user: User) => void;
  logout: () => void;
  updateUser: (partial: Partial<User>) => void;
  setLanguage: (lang: 'en' | 'tr') => void;
  setTheme: (theme: 'light' | 'dark') => void;
  setBlueLightFilter: (on: boolean) => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  isLoggedIn: false,
  language: 'en',
  theme: 'light',
  blueLightFilter: false,
  login: (user: User) => set({ user, isLoggedIn: true }),
  logout: () => set({ user: null, isLoggedIn: false }),
  updateUser: (partial: Partial<User>) =>
    set((state) => ({
      user: state.user ? { ...state.user, ...partial } : null,
    })),
  setLanguage: (lang: 'en' | 'tr') => {
    setI18nLang(lang);
    set({ language: lang });
  },
  setTheme: (theme: 'light' | 'dark') => set({ theme }),
  setBlueLightFilter: (on: boolean) => set({ blueLightFilter: on }),
}));