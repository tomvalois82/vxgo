// Cores das origens de lead usadas no CRM
export const CORES_ORIGEM: Record<string, string> = {
  whatsapp: '#22c55e',
  olx: '#7c3aed',
  webmotors: '#dc2626',
  instagram: '#ec4899',
  facebook: '#2563eb',
  'indicação': '#eab308',
  indicacao: '#eab308',
  carteira: '#9ca3af',
  outros: '#92400e',
};

/** Retorna a cor da origem do lead ou undefined quando não houver correspondência */
export const getCorOrigem = (origem?: string | null): string | undefined => {
  if (!origem) return undefined;
  return CORES_ORIGEM[origem.trim().toLowerCase()];
};
