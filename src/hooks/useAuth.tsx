/**
 * Archivo: useAuth.tsx
 * Ruta: src/hooks/useAuth.tsx
 * Última modificación: 2026-03-27
 * Descripción: Contexto y hook de autenticación. Maneja sesión, login, registro,
 *              logout y carga de datos de usuario (users + profiles + club membership).
 */
import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { User, Profile } from '@/types';
import type { Session } from '@supabase/supabase-js';

export interface ClubMembership {
  club_id: string;
  role: 'club_admin' | 'coach' | 'member';
  club: {
    id: string;
    name: string;
    slug: string;
    join_code: string;
    plan: string;
    owner_id: string;
    avatar_url: string | null;
  };
}

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  clubMembership: ClubMembership | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshUserData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [clubMembership, setClubMembership] = useState<ClubMembership | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUserData = async (userId: string) => {
    const [userRes, profileRes, clubRes] = await Promise.all([
      supabase.from('users').select('*').eq('id', userId).single(),
      supabase.from('profiles').select('*').eq('user_id', userId).single(),
      supabase
        .from('club_memberships')
        .select('club_id, role, clubs(id, name, slug, join_code, plan, owner_id, avatar_url)')
        .eq('user_id', userId)
        .eq('status', 'active')
        .limit(1)
        .maybeSingle(),
    ]);

    if (userRes.data) setUser(userRes.data as User);
    if (profileRes.data) setProfile(profileRes.data as Profile);
    if (clubRes.data) {
      setClubMembership({
        club_id: clubRes.data.club_id,
        role: clubRes.data.role as ClubMembership['role'],
        club: clubRes.data.clubs as ClubMembership['club'],
      });
    } else {
      setClubMembership(null);
    }
  };

  const refreshUserData = async () => {
    if (!session?.user?.id) return;
    await fetchUserData(session.user.id);
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        if (session?.user) {
          setTimeout(() => fetchUserData(session.user.id), 0);
        } else {
          setUser(null);
          setProfile(null);
          setClubMembership(null);
        }
        setIsLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        fetchUserData(session.user.id);
      }
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: window.location.origin,
      },
    });
    if (error) throw error;
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setClubMembership(null);
  };

  return (
    <AuthContext.Provider value={{
      session, user, profile, clubMembership,
      isLoading, signIn, signUp, signOut, refreshUserData
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}