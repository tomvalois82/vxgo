import React, { createContext, useContext, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';

interface UserProfile {
  id: number;
  nome: string | null;
  cargo: 'Gerente' | 'Supervisor' | 'Vendedor' | 'Avaliador' | null;
  telefone: string | null;
  ativo: boolean;
  config: number | null;
  evo_instancia: string | null;
  evo_key: string | null;
  tbEstoque: string | null;
  tbHistorico: string | null;
  credencialOlx: string | null;
  n8nOlx: string | null;
  uid?: string | null;
  email?: string | null;
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
  const location = useLocation();

  useEffect(() => {
    setIsLoading(true);
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (event === 'SIGNED_OUT') {
          setProfile(null);
          // navigate('/auth');
        }
        setIsLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      setSession(initialSession);
      setUser(initialSession?.user ?? null);
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    async function fetchProfile() {
      if (user) {
        try {
          const { data: userProfileData, error } = await supabase
            .from('usuario')
            .select('*')
            .eq('uid', user.id)
            .single();

          if (error && error.code !== 'PGRST116') {
            console.error('Error fetching user profile:', error);
            toast({ title: 'Erro ao carregar perfil', description: error.message, variant: 'destructive' });
            setProfile(null);
          } else if (userProfileData) {
            console.log('User profile loaded:', userProfileData);
            const processedProfile: UserProfile = {
              ...userProfileData,
              config: userProfileData.config as number | null,
            };
            setProfile(processedProfile);

            const needsCompletion = !processedProfile.nome || !processedProfile.cargo || !processedProfile.telefone;
            if (needsCompletion && location.pathname !== '/profile' && location.pathname !== '/auth') {
              console.log('User profile needs completion, redirecting to /profile');
              navigate('/profile');
            }
          } else {
            console.log('No user profile found for uid:', user.id);
            setProfile(null);
          }
        } catch (error: any) {
          console.error('Exception fetching user profile:', error);
          toast({ title: 'Erro ao carregar perfil', description: error.message, variant: 'destructive' });
          setProfile(null);
        }
      } else {
        setProfile(null);
      }
    }

    if (user) {
      fetchProfile();
    } else {
      setProfile(null);
    }
  }, [user, navigate, location.pathname]);

  const signUp = async (email: string, password: string) => {
    try {
      console.log('Attempting signup for:', email);
      
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        console.error('Signup error:', error);
        return { error };
      }
      
      console.log('Signup successful');
      return {};
    } catch (error) {
      console.error('Signup exception:', error);
      return { error: error instanceof Error ? error : new Error('An unknown error occurred during signup') };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      console.log('Attempting signin for:', email);
      
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Signin error:', error);
        return { error };
      }
      
      console.log('Signin successful');
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
      setProfile(null);
      setUser(null);
      setSession(null);
      navigate('/auth');
    } catch (error) {
      console.error('Error signing out:', error);
      setProfile(null);
      setUser(null);
      setSession(null);
      navigate('/auth');
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
