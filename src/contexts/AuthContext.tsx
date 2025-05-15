import React, { createContext, useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface UserProfile {
  id: number;
  nome: string | null;
  cargo: 'Gerente' | 'Supervisor' | 'Vendedor' | 'Avaliador' | null;
  telefone: string | null;
  ativo: boolean;
  config: number;
  evo_instancia: string | null;
  evo_key: string | null;
  tbEstoque: string | null;
  tbHistorico: string | null;
  credencialOlx: string | null; // Added this line
  n8nOlx: string | null; // Added this line as it's used in Auth.tsx and likely needed in profile
}

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: UserProfile | null;
  isLoading: boolean;
  signUp: (email: string, password: string) => Promise<{ error?: Error }>;
  signIn: (email: string, password: string) => Promise<{ error?: Error }>;
  signOut: () => Promise<void>;
  needsProfileCompletion: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (!session) {
          setProfile(null);
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    async function fetchOrCreateProfile() {
      if (user) {
        try {
          let { data: userProfile, error } = await supabase
            .from('usuario')
            .select('*')
            .eq('uid', user.id)
            .maybeSingle();

          if (!userProfile) {
            const { data: newProfile, error: createError } = await supabase
              .from('usuario')
              .insert([
                { 
                  uid: user.id,
                  email: user.email,
                  ativo: true,
                  tbEstoque: 'estoque' // Default table for new users
                }
              ])
              .select()
              .single();

            if (createError) throw createError;
            userProfile = newProfile;
            
            navigate('/profile');
          }

          console.log('User profile loaded:', userProfile);
          setProfile(userProfile);
        } catch (error) {
          console.error('Error fetching/creating profile:', error);
        }
      }
    }

    fetchOrCreateProfile();
  }, [user, navigate]);

  const signUp = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) return { error };
      
      return {};
    } catch (error) {
      console.error('Signup exception:', error);
      return { error: error instanceof Error ? error : new Error('An unknown error occurred during signup') };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) return { error };
      
      navigate('/');
      return {};
    } catch (error) {
      console.error('Signin exception:', error);
      return { error: error instanceof Error ? error : new Error('An unknown error occurred during signin') };
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      navigate('/auth');
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  };

  const needsProfileCompletion = !!profile && (!profile.nome || !profile.cargo || !profile.telefone);

  const value = {
    session,
    user,
    profile,
    isLoading,
    signUp,
    signIn,
    signOut,
    needsProfileCompletion,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
