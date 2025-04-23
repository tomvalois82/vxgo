
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface UserProfile {
  id: number; // Changed from string to number to match the database schema
  nome: string | null;
  cargo: 'Gerente' | 'Supervisor' | 'Vendedor' | 'Avaliador' | null;
  telefone: string | null;
  ativo: boolean;
  config: number;
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
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (!session) {
          setProfile(null);
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Fetch user profile when user changes
  useEffect(() => {
    async function fetchProfile() {
      if (user) {
        try {
          const { data, error } = await supabase
            .from('usuario')
            .select('*')
            .eq('uid', user.id)
            .single();

          if (error) {
            console.error('Error fetching profile:', error);
            return;
          }

          setProfile(data);
        } catch (error) {
          console.error('Exception fetching profile:', error);
        }
      }
    }

    fetchProfile();
  }, [user]);

  const signUp = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) return { error };
      
      // No error, but we don't immediately navigate since email confirmation may be required
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
