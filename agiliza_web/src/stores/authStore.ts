import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface UserData {
  pid: string;
  name: string;
  email: string;
  is_staff: boolean;
  is_verified: boolean;
  profile_image?: string | null;
  needs_onboarding?: boolean;
}

export type AuthContext = 'CLIENT' | 'PROFESSIONAL' | 'ADMIN' | null;

interface AuthState {
  token: string | null;
  user: UserData | null;
  context: AuthContext;
  setAuth: (token: string, user: UserData, context: AuthContext) => void;
  switchContext: (newContext: AuthContext) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      context: null,
      setAuth: (token, user, context) => {
        localStorage.setItem('agiliza_token', token);
        localStorage.setItem('agiliza_user', JSON.stringify(user));
        set({ token, user, context });
      },
      switchContext: (newContext) => set({ context: newContext }),
      logout: () => {
        localStorage.removeItem('agiliza_token');
        localStorage.removeItem('agiliza_user');
        set({ token: null, user: null, context: null });
      },
    }),
    {
      name: 'agiliza_auth', // Key stored in localStorage
      onRehydrateStorage: () => (state) => {
        if (state) {
          if (state.token) {
            localStorage.setItem('agiliza_token', state.token);
            if (state.user) localStorage.setItem('agiliza_user', JSON.stringify(state.user));
          } else {
            localStorage.removeItem('agiliza_token');
            localStorage.removeItem('agiliza_user');
          }
        }
      },
    }
  )
);
