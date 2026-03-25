import { createContext, useContext, type ReactNode } from 'react';
import type { User, Session } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

// Fake user so the app skips auth screens
const fakeUser = { id: 'dev-user', email: 'dev@local' } as unknown as User;

const handleSignOut = async () => {
  localStorage.removeItem('health_profile');
  window.location.reload();
};

const AuthContext = createContext<AuthContextType>({
  user: fakeUser,
  session: null,
  loading: false,
  signOut: handleSignOut,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  return (
    <AuthContext.Provider value={{ user: fakeUser, session: null, loading: false, signOut: handleSignOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
