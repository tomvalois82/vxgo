
import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';

export const OlxConnectionPlaceholder = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>OLX</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2 text-amber-600">
          <AlertCircle size={16} />
          <p className="text-sm">Integração com OLX estará disponível em breve.</p>
        </div>
      </CardContent>
    </Card>
  );
};
