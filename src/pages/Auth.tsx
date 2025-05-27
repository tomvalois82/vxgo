import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { AlertCircle, LoaderCircle } from 'lucide-react';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useLocation, useNavigate } from 'react-router-dom';
import { olxService } from '@/services/olxService';

const Auth = () => {
  // isLogin será sempre true, isForgotPassword sempre false
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const { signIn, user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Handle OLX authorization code
  useEffect(() => {
    const handleOlxAuth = async () => {
      const searchParams = new URLSearchParams(location.search);
      const code = searchParams.get('code');
      
      if (code && user) {
        setIsLoading(true);
        setErrorMsg(null);
        
        try {
          // Exchange code for token
          const success = await olxService.exchangeCodeForToken(code, user.id);
          
          if (!success) {
            throw new Error('Failed to exchange code for token');
          }
          
          // Get updated user profile to get webhook URL
          const { data: updatedProfile, error: profileError } = await supabase
            .from('usuario')
            .select('credencialOlx, n8nOlx')
            .eq('uid', user.id)
            .single();
            
          if (profileError || !updatedProfile) {
            throw profileError || new Error('Failed to get updated profile');
          }
          
          if (!updatedProfile.n8nOlx) {
            toast({
              title: "Aviso",
              description: "URL do webhook não configurada. Entre em contato com o administrador.",
              variant: "default",
            });
            navigate('/settings');
            return;
          }
          
          // Activate webhook
          const status = await olxService.activateWebhook(
            updatedProfile.credencialOlx as string,
            updatedProfile.n8nOlx
          );
          
          if (status === 201 || status === 200) {
            toast({
              title: "Sucesso",
              description: "Integração com o Chat da OLX ativada com sucesso!",
              variant: "default",
            });
          } else if (status === 401) {
            toast({
              title: "Erro",
              description: "Token inválido. Tente reconectar sua conta OLX nas configurações.",
              variant: "destructive",
            });
          } else {
            toast({
              title: "Erro",
              description: `Erro ao ativar webhook (${status}). Tente novamente ou contate o suporte.`,
              variant: "destructive",
            });
          }
          
          // Redirect to settings
          navigate('/settings');
        } catch (error) {
          console.error('OLX auth error:', error);
          toast({
            title: "Erro de Integração OLX",
            description: error instanceof Error ? error.message : "Falha na integração com a OLX. Tente novamente.",
            variant: "destructive",
          });
          setErrorMsg(error instanceof Error ? error.message : "Ocorreu um erro na integração com a OLX");
          navigate('/settings');
        } finally {
          setIsLoading(false);
        }
      }
    };
    
    if (user && location.search.includes('code=')) {
      handleOlxAuth();
    }
  }, [location.search, user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);
    
    try {
      const { error } = await signIn(email, password);
      if (error) throw error;
    } catch (error) {
      console.error("Auth error:", error);
      
      let errorMessage = error instanceof Error ? error.message : "Ocorreu um erro";
      
      if (errorMessage.includes("Email not confirmed")) {
        errorMessage = "Email não confirmado. Por favor, verifique sua caixa de entrada.";
      } else if (errorMessage.includes("Invalid login credentials")) {
        errorMessage = "Credenciais inválidas. Verifique seu email e senha.";
      }
      
      setErrorMsg(errorMessage);
      
      toast({
        variant: "destructive",
        title: "Erro",
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading state when processing OLX auth
  if (isLoading && new URLSearchParams(location.search).get('code')) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center text-2xl font-bold">
              Processando integração OLX
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center p-6 space-y-4">
            <LoaderCircle className="h-16 w-16 animate-spin text-primary" />
            <p className="text-center text-muted-foreground">
              Por favor, aguarde enquanto processamos sua integração com o Chat da OLX...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const renderAuthForm = () => (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <Input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={isLoading}
        />
      </div>
      <div>
        <Input
          type="password"
          placeholder="Senha"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          disabled={isLoading}
        />
      </div>
      <div>
        <Button type="submit" className="w-full" loading={isLoading} disabled={isLoading}>
          Entrar
        </Button>
      </div>
    </form>
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center text-2xl font-bold">
            Entrar
          </CardTitle>
        </CardHeader>
        <CardContent>
          {errorMsg && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{errorMsg}</AlertDescription>
            </Alert>
          )}
          {renderAuthForm()}
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
