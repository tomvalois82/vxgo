
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { CheckCircle } from 'lucide-react';

export function OlxApiSettings() {
  const { profile } = useAuth();
  
  const hasOlxCredentials = !!profile?.credencialOlx;
  
  return (
    <Card className="mt-6">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Integração de Chat OLX</CardTitle>
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
            className="bg-[#6E0AD6] hover:bg-[#5d09b5] flex items-center gap-2"
            asChild
          >
            <a href="https://auth.olx.com.br/oauth?client_id=148c0e2bf8bfd9bbc88f934fe385532643583815&response_type=code&scope=basic_user_info%20autoupload%20chat">
              <img 
                src="/lovable-uploads/c75297c8-81b0-4e81-a189-7a222022a779.png" 
                alt="OLX" 
                className="w-6 h-6" 
              />
              {hasOlxCredentials ? "Reconectar à OLX" : "Conectar à OLX"}
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
