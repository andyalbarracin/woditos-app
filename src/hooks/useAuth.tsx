// @refresh reset
/**
 * Archivo: useAuth.tsx
 * Ruta: src/hooks/useAuth.tsx
 * Última modificación: 2026-04-14
 * Descripción: Contexto y hook de autenticación. Maneja sesión, login, registro,
 *              logout y carga de datos de usuario (users + profiles + club membership).
 *   v1.3: usa `db = supabase as any` para evitar errores de tipos en queries
 *         hasta que se regeneren los tipos de Supabase.
 *   v1.4: onAuthStateChange callback es NO-async para evitar bloqueo de la cola
 *         de eventos de Supabase. En v2, si el callback es async y awaita algo,
 *         signInWithPassword queda bloqueado esperando que INITIAL_SESSION termine
 *         → el botón "Entrando..." se cuelga indefinidamente.
 *         fetchUserData se llama fire-and-forget; isLoading se resuelve en su .finally().
 */
import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { queryClient } from '@/lib/queryClient';
import type { User, Profile } from '@/types';
import type { Session } from '@supabase/supabase-js';

const db = supabase as any;

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
    try {
      const [userRes, profileRes, clubRes] = await Promise.all([
        db.from('users').select('*').eq('id', userId).single(),
        db.from('profiles').select('*').eq('user_id', userId).single(),
        db
          .from('club_memberships')
          .select('club_id, role, clubs(id, name, slug, join_code, plan, owner_id, avatar_url)')
          .eq('user_id', userId)
          .eq('status', 'active')
          .limit(1)
          .maybeSingle(),
      ]);

      if (userRes.data)   setUser(userRes.data as User);
      if (profileRes.data) setProfile(profileRes.data as Profile);

      if (clubRes.data) {
        setClubMembership({
          club_id: clubRes.data.club_id,
          role:    clubRes.data.role as ClubMembership['role'],
          club:    clubRes.data.clubs as ClubMembership['club'],
        });
      } else {
        setClubMembership(null);
      }
    } catch (err) {
      console.error('fetchUserData error:', err);
    }
  };

  const clearUserData = () => {
    setUser(null);
    setProfile(null);
    setClubMembership(null);
  };

  const refreshUserData = async () => {
    const { data: { session: currentSession } } = await supabase.auth.getSession();
    if (!currentSession?.user?.id) return;
    await fetchUserData(currentSession.user.id);
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      // FIX v1.4: callback NO-async.
      // Supabase JS v2 procesa eventos en cola secuencial. Si este callback
      // es async y awaita fetchUserData (3 queries de red), signInWithPassword
      // queda bloqueado esperando que INITIAL_SESSION termine → login se cuelga.
      // Solución: llamar fetchUserData sin await (fire-and-forget).
      // isLoading se resuelve en el .finally() de fetchUserData.
      (event, newSession) => {
        setSession(newSession);

        if (newSession?.user) {
          fetchUserData(newSession.user.id).finally(() => setIsLoading(false));
        } else {
          clearUserData();
          if (event === 'SIGNED_OUT') {
            queryClient.clear();
          }
          setIsLoading(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    // Cargar datos del usuario antes de resolver — así cuando Login.tsx llama
    // navigate('/'), user/profile/clubMembership ya están seteados y
    // ProtectedRoute no redirige de vuelta a /login por user === null.
    if (data.user) {
      await fetchUserData(data.user.id);
    }
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
    // Limpiar estado local de inmediato — no depender de la red.
    clearUserData();
    setSession(null);
    queryClient.clear();
    // Invalidar sesión en el servidor en background (sin await)
    supabase.auth.signOut().catch(() => {});
  };

  return (
    <AuthContext.Provider value={{
      session, user, profile, clubMembership,
      isLoading, signIn, signUp, signOut, refreshUserData,
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