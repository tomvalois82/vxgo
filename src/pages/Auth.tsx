
import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from "@/components/ui/alert";

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const { signIn, signUp } = useAuth();

  const handleSignInWithGoogle = async () => {
    try {
      setIsLoading(true);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });
      
      if (error) throw error;
    } catch (error) {
      console.error("Google auth error:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao fazer login com Google. Tente novamente.",
      });
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);
    
    try {
      if (isForgotPassword) {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth`,
        });
        
        if (error) throw error;
        
        toast({
          title: "Email enviado",
          description: "Verifique sua caixa de entrada para redefinir sua senha.",
        });
        setIsForgotPassword(false);
      } else if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) throw error;
      } else {
        const { error } = await signUp(email, password);
        if (error) throw error;
      }
    } catch (error) {
      console.error("Auth error:", error);
      
      let errorMessage = error instanceof Error ? error.message : "Ocorreu um erro";
      
      if (errorMessage.includes("Email not confirmed")) {
        errorMessage = "Email não confirmado. Por favor, verifique sua caixa de entrada.";
      } else if (errorMessage.includes("Invalid login credentials")) {
        errorMessage = "Credenciais inválidas. Verifique seu email e senha.";
      } else if (errorMessage.includes("User already registered")) {
        errorMessage = "Este email já está cadastrado. Tente fazer login.";
      } else if (errorMessage.includes("violates row level security")) {
        errorMessage = "Erro de permissão no banco de dados. Contate o administrador.";
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

  const renderForgotPassword = () => (
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
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? "Enviando..." : "Enviar email de recuperação"}
        </Button>
      </div>
      <div className="text-center">
        <Button
          type="button"
          variant="link"
          onClick={() => setIsForgotPassword(false)}
          disabled={isLoading}
        >
          Voltar para o login
        </Button>
      </div>
    </form>
  );

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
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? (isLogin ? "Entrando..." : "Cadastrando...") : (isLogin ? 'Entrar' : 'Cadastrar')}
        </Button>
      </div>
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">
            Ou continue com
          </span>
        </div>
      </div>
      <Button
        type="button"
        variant="outline"
        className="w-full"
        onClick={handleSignInWithGoogle}
        disabled={isLoading}
      >
        <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512">
          <path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path>
        </svg>
        {isLoading ? "Conectando..." : "Google"}
      </Button>
      <div className="text-center space-y-2">
        <Button
          type="button"
          variant="link"
          onClick={() => { setIsLogin(!isLogin); setErrorMsg(null); }}
          disabled={isLoading}
        >
          {isLogin
            ? 'Não tem uma conta? Cadastre-se'
            : 'Já tem uma conta? Entre'}
        </Button>
        {isLogin && (
          <div>
            <Button
              type="button"
              variant="link"
              onClick={() => { setIsForgotPassword(true); setErrorMsg(null); }}
              disabled={isLoading}
            >
              Esqueceu sua senha?
            </Button>
          </div>
        )}
      </div>
    </form>
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center text-2xl font-bold">
            {isForgotPassword 
              ? 'Recuperar Senha'
              : isLogin ? 'Entrar' : 'Criar conta'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {errorMsg && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{errorMsg}</AlertDescription>
            </Alert>
          )}
          {isForgotPassword ? renderForgotPassword() : renderAuthForm()}
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
