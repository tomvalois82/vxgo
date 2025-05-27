
import React from 'react';
import { WhatsAppConnection } from '@/components/connections/WhatsAppConnection';
import { OlxConnectionPlaceholder } from '@/components/connections/OlxConnectionPlaceholder';

const Connections = () => {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Conexões</h1>
      <WhatsAppConnection />
      <OlxConnectionPlaceholder />
    </div>
  );
};

export default Connections;
