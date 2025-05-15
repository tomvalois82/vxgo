
import React from 'react';
import { EvolutionApiSettings } from '@/components/settings/EvolutionApiSettings';
import { OlxApiSettings } from '@/components/settings/OlxApiSettings';

const Settings = () => {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Configurações</h1>
      <EvolutionApiSettings />
      <OlxApiSettings />
    </div>
  );
};

export default Settings;
