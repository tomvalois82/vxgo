export interface KanbanColumnData {
  id: number; // from kanban.id (bigint in DB)
  descricao: string; // from kanban.descricao
  posicao: number | null; // from kanban.posicao (smallint in DB)
  // from opotunidade table
  created_at: string; // timestamp
}

export interface LeadData {
  id: number; // from lead.id (bigint in DB)
  nome: string | null;
  telefone: string | null;
  email: string | null;
  Origem: string | null;
  idUsuario: number | null; // from lead.idUsuario (bigint in DB) - ENSURE THIS IS PRESENT
  created_at: string; // timestamp  // from lead table
  session_id_whatsapp?: string | null; // Corrected typo from session_id_whatsaap
  session_id_olx?: string | null;
}

export interface OpportunityData {
  id: number; // from opotunidade.id (bigint in DB)
  id_usuario: number; // from opotunidade.id_usuario (bigint in DB)
  id_lead: number | null; // from opotunidade.id_lead (bigint in DB)
  idEstoque: number | null; // from opotunidade.idEstoque (bigint in DB) - ADDED
  titulo: string | null;
  valor: string | null;
  obs: string | null;
  resumo: string | null;
  id_kanban: number; // from opotunidade.id_kanban (bigint in DB)
  data_criacao: string | null;
  ultima_interacao: string | null;
  status: string | null;
  lead?: LeadData; // To store fetched lead details
  // from opotunidade table
  created_at: string; // timestamp
  session_id_whatsapp?: string | null;
  session_id_olx?: string | null;
}

export interface ActivityData {
  id: number; // from atividade.id (bigint in DB)
  id_oportunidade: number | null; // bigint
  id_usuario: number | null; // bigint
  id_lead: number | null; // bigint
  data_hora: string | null; // timestamp
  descricao: string | null;
  tipo: string | null; // Ligação, Mensagem, Visita, Reunião
  obs: string | null;
  concluida: boolean | null;
  // from opotunidade table
  created_at: string; // timestamp
}

export interface StockVehicle {
  id: number;
  modelo: string | null;
  fabricante: string | null;
}
