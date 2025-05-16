import { VehicleType } from "@/hooks/useFipeBrands";

export interface Car {
  id: string;
  vehicleType: VehicleType;
  brand: string;
  model: string;
  year: number;
  price: number;
  color: string;
  mileage: number;
  fuelType: string; // motor
  transmission: string; // cambio
  inStock: boolean;
  image?: string; // This will be removed from the form but kept in type for backward compatibility
  description?: string; // observacao
  characteristics?: string; // caracteristica
  video?: string;
  warranty?: string; // garantia
  technicalSheet?: string; // ficha_tecnica
  cautionReport?: string; // cautelar
  category?: string;
  manufacturingYear?: number; // ano_fabricacao
  fotos?: string[];
  idOlx?: string; // Novo campo
  createdAt: Date;
  updatedAt: Date;
}

export type CarFormData = Omit<Car, 'id' | 'createdAt' | 'updatedAt'>;

export interface KanbanColumnDb {
  id: number;
  descricao: string; // Name of the column
  posicao: number; // Order of the column
  created_at: string;
}

export interface OpportunityDb {
  id: number;
  id_usuario: number; // User ID
  id_lead: number | null;
  session_id_whatsapp: string | null;
  session_id_olx: string | null;
  data_criacao: string | null;
  titulo: string | null;
  valor: string | null;
  obs: string | null;
  resumo: string | null;
  ultima_interacao: string | null;
  status: string | null;
  id_kanban: number | null; // ID of the Kanban column this opportunity belongs to
  created_at: string;
}

// You might want to add LeadDb and ActivityDb types here later
