
import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const { signIn, signUp } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
        await signIn(email, password);
      } else {
        await signUp(email, password);
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: error instanceof Error ? error.message : "Ocorreu um erro",
      });
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
        />
      </div>
      <div>
        <Button type="submit" className="w-full">
          Enviar email de recuperação
        </Button>
      </div>
      <div className="text-center">
        <Button
          type="button"
          variant="link"
          onClick={() => setIsForgotPassword(false)}
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
        />
      </div>
      <div>
        <Input
          type="password"
          placeholder="Senha"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>
      <div>
        <Button type="submit" className="w-full">
          {isLogin ? 'Entrar' : 'Cadastrar'}
        </Button>
      </div>
      <div className="text-center space-y-2">
        <Button
          type="button"
          variant="link"
          onClick={() => setIsLogin(!isLogin)}
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
              onClick={() => setIsForgotPassword(true)}
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
          {isForgotPassword ? renderForgotPassword() : renderAuthForm()}
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
