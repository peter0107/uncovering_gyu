import { createContext, useContext, useEffect, useState } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

type User = {
  id: string;
  nickname: string;
  current_day: number;
  started_at: string | null;
  day_completed_at: string | null;
};

type AuthContextType = {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signInAnonymously: (nickname: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchUser(session.user.id);
      else setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchUser(session.user.id);
      else { setUser(null); setLoading(false); }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function fetchUser(userId: string) {
    const { data, error } = await supabase
      .from('users')
      .select('id, nickname, current_day, started_at, day_completed_at')
      .eq('id', userId)
      .maybeSingle();
    if (error) console.error('fetchUser 실패:', error);
    setUser(data);
    setLoading(false);
  }

  async function refreshUser() {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) await fetchUser(session.user.id);
  }

  async function signInAnonymously(nickname: string) {
    const { data, error } = await supabase.auth.signInAnonymously();
    if (error || !data.user) throw error;

    const { error: insertError } = await supabase.from('users').upsert({
      id: data.user.id,
      nickname,
    });

    if (insertError) {
      console.error('users insert 실패:', insertError);
      throw insertError;
    }

    await fetchUser(data.user.id);
  }

  async function signOut() {
    await supabase.auth.signOut();
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ session, user, loading, signInAnonymously, signOut, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
