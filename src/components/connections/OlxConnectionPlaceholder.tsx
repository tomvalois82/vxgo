
import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { CheckCircle } from 'lucide-react';

export const OlxConnectionPlaceholder = () => {
  const { profile } = useAuth();
  
  const hasOlxCredentials = !!profile?.credencialOlx;
  
  const handleOlxIntegration = () => {
    const clientId = '148c0e2bf8bfd9bbc88f934fe385532643583815';
    const redirectUri = 'https://app.vxmotors.com.br/connections';
    const scope = 'basic_user_info autoupload chat';
    
    const authUrl = `https://auth.olx.com.br/oauth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent(scope)}`;
    
    window.location.href = authUrl;
  };
  
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>OLX</CardTitle>
        {hasOlxCredentials && (
          <div className="flex items-center text-green-500">
            <CheckCircle className="mr-1" size={16} />
            <span className="text-sm">Conectado</span>
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col items-start space-y-4">
          <p className="text-sm text-muted-foreground">
            {hasOlxCredentials 
              ? "Sua conta está conectada ao Chat da OLX." 
              : "Conecte sua conta ao Chat da OLX para gerenciar suas conversas."}
          </p>
          
          <Button 
            onClick={handleOlxIntegration}
            className="bg-[#6E0AD6] hover:bg-[#5d09b5] flex items-center gap-2"
          >
            <img 
              src="/lovable-uploads/c75297c8-81b0-4e81-a189-7a222022a779.png" 
              alt="OLX" 
              className="w-6 h-6" 
            />
            <span>{hasOlxCredentials ? "Reconectar à OLX" : "Integrar OLX"}</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
