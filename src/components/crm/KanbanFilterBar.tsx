import React from 'react';
import { Search, Filter, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { KanbanColumn } from '@/hooks/crm/useKanban';

interface InteresseOption {
  id: number;
  label: string;
}

interface KanbanFilterBarProps {
  open: boolean;
  onToggle: () => void;
  columns: KanbanColumn[];
  selectedColumnId: string;
  onColumnChange: (value: string) => void;
  selectedStatus: string;
  onStatusChange: (value: string) => void;
  interesseOptions: InteresseOption[];
  selectedInteresse: string;
  onInteresseChange: (value: string) => void;
  searchText: string;
  onSearchChange: (value: string) => void;
  className?: string;
}

const KanbanFilterBar: React.FC<KanbanFilterBarProps> = ({
  open,
  onToggle,
  columns,
  selectedColumnId,
  onColumnChange,
  selectedStatus,
  onStatusChange,
  interesseOptions,
  selectedInteresse,
  onInteresseChange,
  searchText,
  onSearchChange,
}) => {

  if (!open) {
    return (
      <Button variant="outline" size="sm" onClick={onToggle} className="gap-1.5">
        <Filter size={16} />
        Filtrar
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-2 flex-wrap bg-muted/50 border rounded-lg px-3 py-2">
      <div className="flex items-center gap-2 flex-1 min-w-0 flex-wrap">
        <Select value={selectedColumnId} onValueChange={onColumnChange}>
          <SelectTrigger className="w-40 h-8 text-xs">
            <SelectValue placeholder="Etapa" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas etapas</SelectItem>
            {columns.map((col) => (
              <SelectItem key={col.id} value={String(col.id)}>
                {col.descricao || `Coluna #${col.id}`}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={selectedStatus} onValueChange={onStatusChange}>
          <SelectTrigger className="w-36 h-8 text-xs">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="aberta">Aberta</SelectItem>
            <SelectItem value="ganhou">Ganhou</SelectItem>
            <SelectItem value="perdeu">Perdeu</SelectItem>
          </SelectContent>
        </Select>

        <div className="relative flex-1 min-w-[180px] max-w-xs">
          <Search size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchText}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Buscar lead, telefone, veículo..."
            className="h-8 text-xs pl-7 pr-7"
          />
          {searchText && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      <Button variant="ghost" size="sm" onClick={onToggle} className="h-8 px-2">
        <X size={14} />
      </Button>
    </div>
  );
};

export default KanbanFilterBar;
